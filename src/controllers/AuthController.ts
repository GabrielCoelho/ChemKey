import { Request, Response } from "express";
import User from "../entities/User";
import CryptoService from "../services/CryptoService";

// Type for Sequelize errors
interface SequelizeError extends Error {
  name: string;
  errors?: Array<{ message: string }>;
}

export class AuthController {
  /**
   * POST /auth/login
   */
  public static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      // Validação básica
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Email e senha são obrigatórios.",
        });
      }

      // Buscar usuário por email (com dados sensíveis)
      const user = await User.scope("withSensitiveData").findOne({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Email ou senha incorretos.",
        });
      }

      // Validar senha
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Email ou senha incorretos.",
        });
      }

      // Verificar ou gerar master key
      let masterKey = user.getMasterKey();
      if (!masterKey) {
        // Primeira vez do usuário - gerar master key
        const { key } = await CryptoService.deriveMasterKey(password);
        await user.setMasterKey(key);
        masterKey = key;
      }

      // Atualizar último login
      await user.updateLastLogin();

      // Criar sessão
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
      };

      // Armazenar master key na sessão (para criptografia das senhas)
      req.session.masterKey = masterKey;

      return res.json({
        success: true,
        message: "Login realizado com sucesso!",
        redirectUrl: "/app",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Erro no login:", error);
      return res.status(500).json({
        success: false,
        error: "Erro interno do servidor. Tente novamente.",
      });
    }
  }

  /**
   * POST /auth/register
   */
  public static async register(req: Request, res: Response): Promise<Response> {
    try {
      const { name, email, password, confirmPassword } = req.body;

      // Validações básicas
      if (!name || !email || !password || !confirmPassword) {
        return res.status(400).json({
          success: false,
          error: "Todos os campos são obrigatórios.",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: "As senhas não coincidem.",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: "A senha deve ter no mínimo 8 caracteres.",
        });
      }

      // Verificar força da senha
      const passwordStrength =
        CryptoService.calculatePasswordStrength(password);
      if (passwordStrength < 2) {
        return res.status(400).json({
          success: false,
          error:
            "Senha muito fraca. Use letras maiúsculas, minúsculas, números e símbolos.",
        });
      }

      // Verificar se usuário já existe - usando findOne diretamente
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: "Este email já está em uso.",
        });
      }

      // Gerar master key para o usuário
      const { key: masterKey } = await CryptoService.deriveMasterKey(password);

      // Criar usuário
      const user = await User.createUser({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      // Definir master key
      await user.setMasterKey(masterKey);

      return res.status(201).json({
        success: true,
        message: "Conta criada com sucesso! Você pode fazer login agora.",
        redirectUrl: "/login",
      });
    } catch (error) {
      console.error("Erro no registro:", error);

      // Verificar se é um erro conhecido do Sequelize
      const sequelizeError = error as SequelizeError;

      // Tratar erro de email duplicado do banco
      if (sequelizeError.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          success: false,
          error: "Este email já está em uso.",
        });
      }

      // Tratar erros de validação do Sequelize
      if (
        sequelizeError.name === "SequelizeValidationError" &&
        sequelizeError.errors
      ) {
        const validationErrors = sequelizeError.errors.map(
          (err) => err.message,
        );
        return res.status(400).json({
          success: false,
          error: validationErrors.join(", "),
        });
      }

      return res.status(500).json({
        success: false,
        error: "Erro interno do servidor. Tente novamente.",
      });
    }
  }

  /**
   * POST /auth/logout
   */
  public static async logout(req: Request, res: Response): Promise<Response> {
    return new Promise((resolve) => {
      try {
        // Destruir sessão
        req.session.destroy((err) => {
          if (err) {
            console.error("Erro ao destruir sessão:", err);
            resolve(
              res.status(500).json({
                success: false,
                error: "Erro ao fazer logout.",
              }),
            );
            return;
          }

          // Limpar cookie
          res.clearCookie("chemkey.sid");

          resolve(
            res.json({
              success: true,
              message: "Logout realizado com sucesso!",
              redirectUrl: "/",
            }),
          );
        });
      } catch (error) {
        console.error("Erro no logout:", error);
        resolve(
          res.status(500).json({
            success: false,
            error: "Erro interno do servidor.",
          }),
        );
      }
    });
  }

  /**
   * GET /auth/check
   */
  public static async checkAuth(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const isLoggedIn = !!(req.session && req.session.user);

      return res.json({
        success: true,
        isLoggedIn,
        user: req.session?.user || null,
        hasMasterKey: !!req.session?.masterKey,
      });
    } catch (error) {
      console.error("Erro na verificação de auth:", error);
      return res.status(500).json({
        success: false,
        error: "Erro interno do servidor.",
      });
    }
  }

  /**
   * POST /auth/change-password
   */
  public static async changePassword(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { currentPassword, newPassword, confirmNewPassword } = req.body;
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Usuário não autenticado.",
        });
      }

      // Validações
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({
          success: false,
          error: "Todos os campos são obrigatórios.",
        });
      }

      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({
          success: false,
          error: "As senhas não coincidem.",
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          error: "A nova senha deve ter no mínimo 8 caracteres.",
        });
      }

      // Buscar usuário
      const user = await User.scope("withSensitiveData").findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuário não encontrado.",
        });
      }

      // Validar senha atual
      const isValidCurrentPassword =
        await user.validatePassword(currentPassword);
      if (!isValidCurrentPassword) {
        return res.status(400).json({
          success: false,
          error: "Senha atual incorreta.",
        });
      }

      // Gerar nova master key
      const { key: newMasterKey } =
        await CryptoService.deriveMasterKey(newPassword);

      // TODO: Re-criptografar todas as senhas salvas com a nova master key
      // Isso será implementado quando tivermos o PasswordService

      // Atualizar senha e master key
      await user.setPassword(newPassword);
      await user.setMasterKey(newMasterKey);

      // Atualizar master key na sessão
      req.session.masterKey = newMasterKey;

      return res.json({
        success: true,
        message: "Senha alterada com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      return res.status(500).json({
        success: false,
        error: "Erro interno do servidor.",
      });
    }
  }
}

export default AuthController;
