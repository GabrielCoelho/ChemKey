import crypto from "crypto";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
  authTag: string;
}

export class CryptoService {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly SALT_LENGTH = 32; // 256 bits
  private static readonly TAG_LENGTH = 16; // 128 bits
  private static readonly SCRYPT_OPTIONS = {
    N: 16384, // CPU/memory cost
    r: 8, // Block size
    p: 1, // Parallelization
  };

  /**
   * Deriva uma chave mestra a partir da senha do usuário
   */
  public static async deriveMasterKey(
    userPassword: string,
    salt?: Buffer,
  ): Promise<{ key: string; salt: string }> {
    const keySalt = salt || randomBytes(this.SALT_LENGTH);

    const derivedKey = (await scryptAsync(
      userPassword,
      keySalt,
      this.KEY_LENGTH,
    )) as Buffer;

    return {
      key: derivedKey.toString("hex"),
      salt: keySalt.toString("hex"),
    };
  }

  /**
   * Criptografa uma senha usando AES-256-GCM
   */
  public static async encryptPassword(
    plainPassword: string,
    masterKey: string,
  ): Promise<EncryptedData> {
    try {
      const key = Buffer.from(masterKey, "hex");
      const iv = randomBytes(this.IV_LENGTH);

      // Usar createCipheriv (não createCipher que está deprecated)
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

      // Adicionar dados autenticados adicionais (AAD)
      cipher.setAAD(Buffer.from("ChemKey-Password", "utf8"));

      let encrypted = cipher.update(plainPassword, "utf8", "hex");
      encrypted += cipher.final("hex");

      // Obter tag de autenticação
      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString("hex"),
        salt: "", // Não usado aqui, master key já foi derivada
        authTag: authTag.toString("hex"),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Erro na criptografia: ${errorMessage}`);
    }
  }

  /**
   * Descriptografa uma senha usando AES-256-GCM
   */
  public static async decryptPassword(
    encryptedData: EncryptedData,
    masterKey: string,
  ): Promise<string> {
    try {
      const key = Buffer.from(masterKey, "hex");
      const iv = Buffer.from(encryptedData.iv, "hex");
      const authTag = Buffer.from(encryptedData.authTag, "hex");

      // Usar createDecipheriv (não createDecipher que está deprecated)
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);

      // Definir tag de autenticação
      decipher.setAuthTag(authTag);

      // Adicionar dados autenticados adicionais (AAD)
      decipher.setAAD(Buffer.from("ChemKey-Password", "utf8"));

      let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Erro na descriptografia: ${errorMessage}`);
    }
  }

  /**
   * Gera senha aleatória segura
   */
  public static generateSecurePassword(options: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    excludeAmbiguous?: boolean;
  }): string {
    const {
      length = 16,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeAmbiguous = false,
    } = options;

    let charset = "";

    if (includeLowercase) {
      charset += excludeAmbiguous
        ? "abcdefghjkmnpqrstuvwxyz"
        : "abcdefghijklmnopqrstuvwxyz";
    }
    if (includeUppercase) {
      charset += excludeAmbiguous
        ? "ABCDEFGHJKMNPQRSTUVWXYZ"
        : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    }
    if (includeNumbers) {
      charset += excludeAmbiguous ? "23456789" : "0123456789";
    }
    if (includeSymbols) {
      charset += excludeAmbiguous
        ? "!@#$%^&*-_=+<>?"
        : "!@#$%^&*()-_=+[]{}|;:,.<>?";
    }

    if (!charset) {
      throw new Error("Pelo menos um tipo de caractere deve ser incluído");
    }

    // Usar crypto.randomBytes para geração segura
    const password = Array.from(randomBytes(length))
      .map((byte) => charset[byte % charset.length])
      .join("");

    return password;
  }

  /**
   * Calcula força da senha (0-5)
   */
  public static calculatePasswordStrength(password: string): number {
    let strength = 0;

    // Comprimento
    if (password.length >= 12) strength += 2;
    else if (password.length >= 8) strength += 1;

    // Tipos de caracteres
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    // Penalidades
    if (/(.)\1{2,}/.test(password)) strength -= 1; // Repetição
    if (/^[a-zA-Z]+$/.test(password)) strength -= 1; // Só letras
    if (/^[0-9]+$/.test(password)) strength -= 2; // Só números

    return Math.max(0, Math.min(5, strength));
  }

  /**
   * Verifica se uma chave mestra é válida
   */
  public static isValidMasterKey(masterKey: string): boolean {
    try {
      const keyBuffer = Buffer.from(masterKey, "hex");
      return keyBuffer.length === this.KEY_LENGTH;
    } catch {
      return false;
    }
  }

  /**
   * Gera hash seguro para armazenamento (não criptográfico)
   */
  public static generateSecureHash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }
}

export default CryptoService;
