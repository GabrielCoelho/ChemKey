import { Request, Response } from "express";
import Password from "../entities/Password";
import User from "../entities/User";
import CryptoService, { EncryptedData } from "../services/CryptoService";
import { Op } from "sequelize";

// Extend session interface to include masterKey
declare module "express-session" {
  interface SessionData {
    masterKey?: string;
  }
}

// Type for Sequelize errors
interface SequelizeError extends Error {
  name: string;
  errors?: Array<{ message: string }>;
}

export class PasswordController {
  /**
   * GET /passwords - Listar todas as senhas do usuário (descriptografadas)
   */
  public static async getAllPasswords(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const userId = req.session?.user?.id;
      const masterKey = req.session?.masterKey;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      if (!masterKey) {
        return res.status(401).json({
          success: false,
          error: "Master key not found. Please log in again.",
        });
      }

      // Buscar senhas criptografadas do usuário
      const encryptedPasswords = await Password.findByUserId(userId);

      // Descriptografar senhas para envio
      const decryptedPasswords = await Promise.all(
        encryptedPasswords.map(async (passwordEntry) => {
          try {
            // A senha está armazenada como JSON string no banco
            const encryptedData: EncryptedData = JSON.parse(
              passwordEntry.encrypted_password,
            );

            const decryptedPassword = await CryptoService.decryptPassword(
              encryptedData,
              masterKey,
            );

            return {
              id: passwordEntry.id,
              website: passwordEntry.website,
              username: passwordEntry.username,
              password: decryptedPassword,
              category: passwordEntry.category,
              notes: passwordEntry.notes,
              favorite: passwordEntry.favorite,
              strength: passwordEntry.strength,
              dateAdded: passwordEntry.created_at,
              lastUsed: passwordEntry.last_used_at,
            };
          } catch (error) {
            console.error(
              `Erro ao descriptografar senha ID ${passwordEntry.id}:`,
              error,
            );
            // Se não conseguir descriptografar, omitir da lista
            return null;
          }
        }),
      );

      // Filtrar senhas que falharam na descriptografia
      const validPasswords = decryptedPasswords.filter(
        (password) => password !== null,
      );

      return res.json({
        success: true,
        passwords: validPasswords,
        count: validPasswords.length,
      });
    } catch (error) {
      console.error("Erro ao buscar senhas:", error);
      return res.status(500).json({
        success: false,
        error: "Internal Error",
      });
    }
  }

  /**
   * POST /passwords - Criar nova senha criptografada
   */
  public static async createPassword(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { website, username, password, category, notes } = req.body;
      const userId = req.session?.user?.id;
      const masterKey = req.session?.masterKey;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      if (!masterKey) {
        return res.status(401).json({
          success: false,
          error: "Master key not found, please log in again.",
        });
      }

      // Validação básica
      if (!website || !username || !password) {
        return res.status(400).json({
          success: false,
          error: "Website, username and passwords are obligatory.",
        });
      }

      // Calcular força da senha
      const passwordStrength =
        CryptoService.calculatePasswordStrength(password);

      // Criptografar senha antes de salvar
      const encryptedData = await CryptoService.encryptPassword(
        password,
        masterKey,
      );

      // Criar entrada no banco de dados
      const newPassword = await Password.create({
        user_id: userId,
        website: website.trim(),
        username: username.trim(),
        encrypted_password: JSON.stringify(encryptedData), // Armazenar como JSON
        category: category || "other",
        notes: notes?.trim() || "",
        favorite: false,
        strength: passwordStrength,
      });

      return res.status(201).json({
        success: true,
        message: "Password chemically secured!",
        password: {
          id: newPassword.id,
          website: newPassword.website,
          username: newPassword.username,
          category: newPassword.category,
          notes: newPassword.notes,
          favorite: newPassword.favorite,
          strength: newPassword.strength,
          dateAdded: newPassword.created_at,
        },
      });
    } catch (error) {
      console.error("Erro ao salvar senha:", error);

      // Tratar erros específicos de validação
      const sequelizeError = error as SequelizeError;
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
        error: "Error securing password",
      });
    }
  }

  /**
   * PUT /passwords/:id - Atualizar senha existente
   */
  public static async updatePassword(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { id } = req.params;
      const { website, username, password, category, notes, favorite } =
        req.body;
      const userId = req.session?.user?.id;
      const masterKey = req.session?.masterKey;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      if (!masterKey) {
        return res.status(401).json({
          success: false,
          error: "MasterKey not found, please log in again.",
        });
      }

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          error: "ID inválido.",
        });
      }

      // Buscar senha existente
      const existingPassword = await Password.findOne({
        where: {
          id: parseInt(id),
          user_id: userId,
        },
      });

      if (!existingPassword) {
        return res.status(404).json({
          success: false,
          error: "Password not found.",
        });
      }

      // Preparar dados para atualização
      const updateData: any = {};

      if (website !== undefined) updateData.website = website.trim();
      if (username !== undefined) updateData.username = username.trim();
      if (category !== undefined) updateData.category = category;
      if (notes !== undefined) updateData.notes = notes?.trim() || "";
      if (favorite !== undefined) updateData.favorite = favorite;

      // Se senha foi alterada, re-criptografar
      if (password !== undefined) {
        const passwordStrength =
          CryptoService.calculatePasswordStrength(password);
        const encryptedData = await CryptoService.encryptPassword(
          password,
          masterKey,
        );

        updateData.encrypted_password = JSON.stringify(encryptedData);
        updateData.strength = passwordStrength;
      }

      // Atualizar no banco de dados
      await existingPassword.update(updateData);

      return res.json({
        success: true,
        message: "Password updated",
        password: {
          id: existingPassword.id,
          website: existingPassword.website,
          username: existingPassword.username,
          category: existingPassword.category,
          notes: existingPassword.notes,
          favorite: existingPassword.favorite,
          strength: existingPassword.strength,
          dateAdded: existingPassword.created_at,
          lastUpdated: existingPassword.updated_at,
        },
      });
    } catch (error) {
      console.error("Erro ao atualizar senha:", error);

      const sequelizeError = error as SequelizeError;
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
        error: "Error updating password",
      });
    }
  }

  /**
   * DELETE /passwords/:id - Deletar senha
   */
  public static async deletePassword(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          error: "ID invalid.",
        });
      }

      // Buscar e deletar senha
      const deletedCount = await Password.destroy({
        where: {
          id: parseInt(id),
          user_id: userId,
        },
      });

      if (deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Password not found",
        });
      }

      return res.json({
        success: true,
        message: "Acid throwed upon your password. It is now deleted.",
      });
    } catch (error) {
      console.error("Erro ao deletar senha:", error);
      return res.status(500).json({
        success: false,
        error: "Error deleting",
      });
    }
  }

  /**
   * GET /passwords/:id - Buscar senha específica (descriptografada)
   */
  public static async getPasswordById(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.session?.user?.id;
      const masterKey = req.session?.masterKey;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      if (!masterKey) {
        return res.status(401).json({
          success: false,
          error: "Master key not found, please log in again.",
        });
      }

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          error: "ID inválido.",
        });
      }

      // Buscar senha
      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          error: "ID inválido.",
        });
      }

      // Converter ID para número após validação
      const passwordId = parseInt(id);

      const passwordEntry = await Password.findOne({
        where: {
          id: passwordId,
          user_id: userId,
        },
      });

      if (!passwordEntry) {
        return res.status(404).json({
          success: false,
          error: "Password not found.",
        });
      }

      // Descriptografar senha
      const encryptedData: EncryptedData = JSON.parse(
        passwordEntry.encrypted_password,
      );
      const decryptedPassword = await CryptoService.decryptPassword(
        encryptedData,
        masterKey,
      );

      // Atualizar último uso
      await passwordEntry.updateLastUsed();

      return res.json({
        success: true,
        password: {
          id: passwordEntry.id,
          website: passwordEntry.website,
          username: passwordEntry.username,
          password: decryptedPassword,
          category: passwordEntry.category,
          notes: passwordEntry.notes,
          favorite: passwordEntry.favorite,
          strength: passwordEntry.strength,
          dateAdded: passwordEntry.created_at,
          lastUsed: passwordEntry.last_used_at,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar senha:", error);
      return res.status(500).json({
        success: false,
        error: "Error loading passwords",
      });
    }
  }

  /**
   * POST /passwords/generate - Gerar senha aleatória
   */
  public static async generatePassword(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const {
        length = 16,
        includeUppercase = true,
        includeLowercase = true,
        includeNumbers = true,
        includeSymbols = true,
        excludeAmbiguous = false,
      } = req.body;

      // Validação
      if (length < 6 || length > 64) {
        return res.status(400).json({
          success: false,
          error: "Length must be between 6 and 64 characters",
        });
      }

      const generatedPassword = CryptoService.generateSecurePassword({
        length: parseInt(length),
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeAmbiguous,
      });

      const strength =
        CryptoService.calculatePasswordStrength(generatedPassword);

      return res.json({
        success: true,
        password: generatedPassword,
        strength,
        options: {
          length,
          includeUppercase,
          includeLowercase,
          includeNumbers,
          includeSymbols,
          excludeAmbiguous,
        },
      });
    } catch (error) {
      console.error("Erro ao gerar senha:", error);
      return res.status(500).json({
        success: false,
        error: "Error generating password",
      });
    }
  }

  /**
   * GET /passwords/favorites - Buscar senhas favoritas
   */
  public static async getFavoritePasswords(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const userId = req.session?.user?.id;
      const masterKey = req.session?.masterKey;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Usuário não autenticado.",
        });
      }

      if (!masterKey) {
        return res.status(401).json({
          success: false,
          error: "Master key não encontrada. Faça login novamente.",
        });
      }

      const favoritePasswords = await Password.findFavorites(userId);

      // Descriptografar senhas favoritas
      const decryptedFavorites = await Promise.all(
        favoritePasswords.map(async (passwordEntry) => {
          try {
            const encryptedData: EncryptedData = JSON.parse(
              passwordEntry.encrypted_password,
            );
            const decryptedPassword = await CryptoService.decryptPassword(
              encryptedData,
              masterKey,
            );

            return {
              id: passwordEntry.id,
              website: passwordEntry.website,
              username: passwordEntry.username,
              password: decryptedPassword,
              category: passwordEntry.category,
              strength: passwordEntry.strength,
              dateAdded: passwordEntry.created_at,
            };
          } catch (error) {
            console.error(
              `Erro ao descriptografar senha favorita ID ${passwordEntry.id}:`,
              error,
            );
            return null;
          }
        }),
      );

      const validFavorites = decryptedFavorites.filter(
        (password) => password !== null,
      );

      return res.json({
        success: true,
        favorites: validFavorites,
        count: validFavorites.length,
      });
    } catch (error) {
      console.error("Erro ao buscar favoritos:", error);
      return res.status(500).json({
        success: false,
        error: "Erro ao buscar senhas favoritas.",
      });
    }
  }

  // /**
  //  * PATCH /passwords/:id/favorite - Toggle status de favorito
  //  */
  // public static async toggleFavorite(
  //   req: Request,
  //   res: Response,
  // ): Promise<Response> {
  //   try {
  //     const { id } = req.params;
  //     const userId = req.session?.user?.id;
  //
  //     if (!userId) {
  //       return res.status(401).json({
  //         success: false,
  //         error: "Usuário não autenticado.",
  //       });
  //     }
  //
  //     const passwordEntry = await Password.findOne({
  //       where: {
  //         id: parseInt(id),
  //         user_id: userId,
  //       },
  //     });
  //
  //     if (!passwordEntry) {
  //       return res.status(404).json({
  //         success: false,
  //         error: "Senha não encontrada.",
  //       });
  //     }
  //
  //     await passwordEntry.toggleFavorite();
  //
  //     return res.json({
  //       success: true,
  //       message: `Senha ${passwordEntry.favorite ? "adicionada aos" : "removida dos"} favoritos!`,
  //       favorite: passwordEntry.favorite,
  //     });
  //   } catch (error) {
  //     console.error("Erro ao alterar favorito:", error);
  //     return res.status(500).json({
  //       success: false,
  //       error: "Erro ao alterar status de favorito.",
  //     });
  //   }
  // }

  /**
   * GET /passwords/health - Análise completa de saúde das senhas
   */
  public static async getPasswordHealth(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const userId = req.session?.user?.id;
      const masterKey = req.session?.masterKey;

      if (!userId || !masterKey) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      // Buscar todas as senhas do usuário
      const passwords = await Password.findByUserId(userId);

      if (passwords.length === 0) {
        return res.json({
          success: true,
          health: {
            totalPasswords: 0,
            strongPasswords: 0,
            weakPasswords: 0,
            duplicatePasswords: 0,
            oldPasswords: 0,
            overallScore: 100,
            recommendations: ["Add your first password"],
          },
        });
      }

      // Descriptografar senhas para análise
      const decryptedPasswords = await Promise.all(
        passwords.map(async (passwordEntry) => {
          try {
            const encryptedData: EncryptedData = JSON.parse(
              passwordEntry.encrypted_password,
            );
            const decryptedPassword = await CryptoService.decryptPassword(
              encryptedData,
              masterKey,
            );

            return {
              id: passwordEntry.id,
              password: decryptedPassword,
              strength: passwordEntry.strength,
              website: passwordEntry.website,
              createdAt: passwordEntry.created_at,
              updatedAt: passwordEntry.updated_at,
            };
          } catch (error) {
            return null;
          }
        }),
      );

      const validPasswords = decryptedPasswords.filter((p) => p !== null);

      // Análises
      const totalPasswords = validPasswords.length;
      const strongPasswords = validPasswords.filter(
        (p) => p.strength >= 4,
      ).length;
      const weakPasswords = validPasswords.filter((p) => p.strength < 3).length;

      // Detectar duplicatas
      const passwordMap = new Map();
      const duplicates: Array<{
        password: string;
        websites: string[];
      }> = [];
      validPasswords.forEach((p) => {
        if (passwordMap.has(p.password)) {
          duplicates.push({
            password: p.password,
            websites: [passwordMap.get(p.password).website, p.website],
          });
        } else {
          passwordMap.set(p.password, p);
        }
      });

      // Detectar senhas antigas (mais de 90 dias)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const oldPasswords = validPasswords.filter(
        (p) => new Date(p.updatedAt) < ninetyDaysAgo,
      ).length;

      // Calcular score geral (0-100)
      const strongRatio = strongPasswords / totalPasswords;
      const weakPenalty = (weakPasswords / totalPasswords) * 30;
      const duplicatePenalty = (duplicates.length / totalPasswords) * 25;
      const oldPenalty = (oldPasswords / totalPasswords) * 20;

      const overallScore = Math.max(
        0,
        Math.min(
          100,
          strongRatio * 100 - weakPenalty - duplicatePenalty - oldPenalty,
        ),
      );

      // Gerar recomendações
      const recommendations = [];
      if (weakPasswords > 0) {
        recommendations.push(
          `${weakPasswords} weak password(s) must be strengthened`,
        );
      }
      if (duplicates.length > 0) {
        recommendations.push(
          `${duplicates.length} duplicated passwords found.`,
        );
      }
      if (oldPasswords > 0) {
        recommendations.push(
          `${oldPasswords} unaltered passwords over 90 days`,
        );
      }
      if (recommendations.length === 0) {
        recommendations.push("Bravo!! All your passwords are strong.");
      }

      return res.json({
        success: true,
        health: {
          totalPasswords,
          strongPasswords,
          weakPasswords,
          duplicatePasswords: duplicates.length,
          oldPasswords,
          overallScore: Math.round(overallScore),
          recommendations,
          duplicates: duplicates.slice(0, 5), // Primeiras 5 duplicatas
          analysis: {
            strengthDistribution: {
              weak: weakPasswords,
              medium: totalPasswords - strongPasswords - weakPasswords,
              strong: strongPasswords,
            },
          },
        },
      });
    } catch (error) {
      console.error("Erro na análise de saúde:", error);
      return res.status(500).json({
        success: false,
        error: "Error loading analysis",
      });
    }
  }

  /**
   * GET /passwords/health/duplicates - Buscar senhas duplicadas
   */
  public static async getDuplicatePasswords(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const userId = req.session?.user?.id;
      const masterKey = req.session?.masterKey;

      if (!userId || !masterKey) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const passwords = await Password.findByUserId(userId);

      // Descriptografar e agrupar por senha
      const passwordGroups = new Map();

      for (const passwordEntry of passwords) {
        try {
          const encryptedData: EncryptedData = JSON.parse(
            passwordEntry.encrypted_password,
          );
          const decryptedPassword = await CryptoService.decryptPassword(
            encryptedData,
            masterKey,
          );

          if (passwordGroups.has(decryptedPassword)) {
            passwordGroups.get(decryptedPassword).push({
              id: passwordEntry.id,
              website: passwordEntry.website,
              username: passwordEntry.username,
            });
          } else {
            passwordGroups.set(decryptedPassword, [
              {
                id: passwordEntry.id,
                website: passwordEntry.website,
                username: passwordEntry.username,
              },
            ]);
          }
        } catch (error) {
          continue;
        }
      }

      // Filtrar apenas grupos com mais de 1 item (duplicatas)
      const duplicates = Array.from(passwordGroups.entries())
        .filter(([password, group]) => group.length > 1)
        .map(([password, group]) => ({
          password: password.substring(0, 3) + "*".repeat(password.length - 3),
          count: group.length,
          accounts: group,
        }));

      return res.json({
        success: true,
        duplicates,
        totalDuplicateGroups: duplicates.length,
        totalDuplicatePasswords: duplicates.reduce(
          (sum, d) => sum + d.count,
          0,
        ),
      });
    } catch (error) {
      console.error("Erro ao buscar duplicatas:", error);
      return res.status(500).json({
        success: false,
        error: "Error loading duplicates",
      });
    }
  }

  /**
   * GET /passwords/health/weak - Buscar senhas fracas
   */
  public static async getWeakPasswords(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const weakPasswords = await Password.findAll({
        where: {
          user_id: userId,
          strength: {
            [Op.lt]: 3,
          },
        },
        attributes: ["id", "website", "username", "strength", "updated_at"],
        order: [
          ["strength", "ASC"],
          ["updated_at", "DESC"],
        ],
      });

      return res.json({
        success: true,
        weakPasswords: weakPasswords.map((p) => ({
          id: p.id,
          website: p.website,
          username: p.username,
          strength: p.strength,
          lastUpdated: p.updated_at,
        })),
        count: weakPasswords.length,
      });
    } catch (error) {
      console.error("Erro ao buscar senhas fracas:", error);
      return res.status(500).json({
        success: false,
        error: "Error loading weak passwords",
      });
    }
  }

  /**
   * GET /passwords/health/old - Buscar senhas antigas
   */
  public static async getOldPasswords(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const oldPasswords = await Password.findAll({
        where: {
          user_id: userId,
          updated_at: {
            [Op.lt]: ninetyDaysAgo,
          },
        },
        attributes: ["id", "website", "username", "updated_at"],
        order: [["updated_at", "ASC"]],
      });

      return res.json({
        success: true,
        oldPasswords: oldPasswords.map((p) => ({
          id: p.id,
          website: p.website,
          username: p.username,
          lastUpdated: p.updated_at,
          daysOld: Math.floor(
            (new Date().getTime() - new Date(p.updated_at).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        })),
        count: oldPasswords.length,
      });
    } catch (error) {
      console.error("Erro ao buscar senhas antigas:", error);
      return res.status(500).json({
        success: false,
        error: "Error loading old passwords",
      });
    }
  }
}

export default PasswordController;
