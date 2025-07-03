import { Router, Request, Response } from "express";
import User from "../entities/User";
import Password from "../entities/Password";
import CryptoService, { EncryptedData } from "../services/CryptoService";
import { authMiddleware } from "../middleware/auth";

const recoveryRouter = Router();

/**
 * POST /auth/recover-orphaned-passwords
 * Tentar recuperar senhas órfãs usando senha anterior
 */
recoveryRouter.post(
  "/recover-orphaned-passwords",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { oldPassword } = req.body;
      const userId = req.session?.user?.id;
      const currentMasterKey = req.session?.masterKey;

      if (!userId || !currentMasterKey) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      if (!oldPassword) {
        return res.status(400).json({
          success: false,
          error: "Old password is required",
        });
      }

      console.log("🔍 Iniciando recuperação de senhas órfãs...");

      // Buscar todas as senhas do usuário
      const userPasswords = await Password.findAll({
        where: { user_id: userId },
      });

      console.log(
        `📊 Encontradas ${userPasswords.length} senhas para verificar`,
      );

      // Derivar master key da senha antiga
      const { key: oldMasterKey } =
        await CryptoService.deriveMasterKey(oldPassword);

      const recoveredPasswords: Array<{
        id: number;
        website: string;
        username: string;
        plainPassword: string;
      }> = [];

      const failedPasswords: number[] = [];

      // Tentar descriptografar cada senha com a master key antiga
      for (const passwordEntry of userPasswords) {
        try {
          const encryptedData: EncryptedData = JSON.parse(
            passwordEntry.encrypted_password,
          );

          // Tentar descriptografar com master key atual (pode falhar)
          let decryptedPassword: string;
          let needsMigration = false;

          try {
            decryptedPassword = await CryptoService.decryptPassword(
              encryptedData,
              currentMasterKey,
            );
            console.log(
              `✅ Senha ID ${passwordEntry.id} já acessível com master key atual`,
            );
          } catch (currentError) {
            // Falhou com master key atual, tentar com a antiga
            try {
              decryptedPassword = await CryptoService.decryptPassword(
                encryptedData,
                oldMasterKey,
              );
              needsMigration = true;
              console.log(
                `🔓 Senha ID ${passwordEntry.id} recuperada com master key antiga`,
              );
            } catch (oldError) {
              console.error(
                `❌ Senha ID ${passwordEntry.id} não pôde ser recuperada com nenhuma master key`,
              );
              failedPasswords.push(passwordEntry.id);
              continue;
            }
          }

          recoveredPasswords.push({
            id: passwordEntry.id,
            website: passwordEntry.website,
            username: passwordEntry.username,
            plainPassword: decryptedPassword,
          });

          // Se precisa migração, re-criptografar com master key atual
          if (needsMigration) {
            try {
              const newEncryptedData = await CryptoService.encryptPassword(
                decryptedPassword,
                currentMasterKey,
              );

              await passwordEntry.update({
                encrypted_password: JSON.stringify(newEncryptedData),
              });

              console.log(
                `🔄 Senha ID ${passwordEntry.id} migrada para nova master key`,
              );
            } catch (migrationError) {
              console.error(
                `❌ Falha ao migrar senha ID ${passwordEntry.id}:`,
                migrationError,
              );
            }
          }
        } catch (error) {
          console.error(
            `❌ Erro ao processar senha ID ${passwordEntry.id}:`,
            error,
          );
          failedPasswords.push(passwordEntry.id);
        }
      }

      const migratedCount = recoveredPasswords.filter((_, index) => {
        const passwordEntry = userPasswords[index];
        return passwordEntry && !failedPasswords.includes(passwordEntry.id);
      }).length;

      console.log(
        `🎉 Recuperação concluída: ${recoveredPasswords.length} senhas recuperadas, ${failedPasswords.length} falharam`,
      );

      return res.json({
        success: true,
        message: "Password recovery completed",
        results: {
          totalPasswords: userPasswords.length,
          recoveredPasswords: recoveredPasswords.length,
          failedPasswords: failedPasswords.length,
          migratedPasswords: migratedCount,
        },
        // Para debug apenas - remover em produção
        recoveredPasswordsList: recoveredPasswords.map((p) => ({
          id: p.id,
          website: p.website,
          username: p.username,
          // plainPassword: p.plainPassword, // Comentado por segurança
        })),
        failedPasswordIds: failedPasswords,
      });
    } catch (error) {
      console.error("❌ Erro crítico na recuperação de senhas:", error);
      return res.status(500).json({
        success: false,
        error: "Internal error during password recovery",
      });
    }
  },
);

/**
 * DELETE /auth/cleanup-orphaned-passwords
 * Limpar senhas órfãs que não puderam ser recuperadas
 */
recoveryRouter.delete(
  "/cleanup-orphaned-passwords",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.session?.user?.id;
      const currentMasterKey = req.session?.masterKey;

      if (!userId || !currentMasterKey) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      console.log("🧹 Iniciando limpeza de senhas órfãs...");

      // Buscar todas as senhas do usuário
      const userPasswords = await Password.findAll({
        where: { user_id: userId },
      });

      const orphanedPasswords: number[] = [];

      // Identificar senhas que não podem ser descriptografadas
      for (const passwordEntry of userPasswords) {
        try {
          const encryptedData: EncryptedData = JSON.parse(
            passwordEntry.encrypted_password,
          );
          await CryptoService.decryptPassword(encryptedData, currentMasterKey);
          // Se chegou aqui, a senha está acessível
        } catch (error) {
          // Senha órfã identificada
          orphanedPasswords.push(passwordEntry.id);
          console.log(
            `🗑️ Senha órfã identificada: ID ${passwordEntry.id} (${passwordEntry.website})`,
          );
        }
      }

      if (orphanedPasswords.length === 0) {
        return res.json({
          success: true,
          message: "No orphaned passwords found",
          deletedCount: 0,
        });
      }

      // Deletar senhas órfãs
      const deletedCount = await Password.destroy({
        where: {
          id: orphanedPasswords,
          user_id: userId,
        },
      });

      console.log(
        `🗑️ ${deletedCount} senhas órfãs removidas do banco de dados`,
      );

      return res.json({
        success: true,
        message: `${deletedCount} orphaned passwords have been cleaned up`,
        deletedCount,
        deletedPasswordIds: orphanedPasswords,
      });
    } catch (error) {
      console.error("❌ Erro na limpeza de senhas órfãs:", error);
      return res.status(500).json({
        success: false,
        error: "Internal error during cleanup",
      });
    }
  },
);

export default recoveryRouter;
