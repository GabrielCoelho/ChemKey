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
          error: "Email and passwords are obligatory",
        });
      }

      // Buscar usuário por email (com dados sensíveis)
      const user = await User.scope("withSensitiveData").findOne({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Incorrect email or password",
        });
      }

      // Validar senha
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Incorrect email or password",
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
        message: "Log in successful",
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
        error: "Internal error. Try again.",
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
          error: "All data are obligatory",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: "Passwords are not the same.",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: "Password must be 8 characters or more",
        });
      }

      // Verificar força da senha
      const passwordStrength =
        CryptoService.calculatePasswordStrength(password);
      if (passwordStrength < 2) {
        return res.status(400).json({
          success: false,
          error:
            "Weak Password. Use capital letters, numbers and special characters to increase strength.",
        });
      }

      // Verificar se usuário já existe - usando findOne diretamente
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: "Account already registered with this e-mail.",
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
        message: "Account created. You may log in now...",
        redirectUrl: "/login",
      });
    } catch (error) {
      console.error("Register error: ", error);

      // Verificar se é um erro conhecido do Sequelize
      const sequelizeError = error as SequelizeError;

      // Tratar erro de email duplicado do banco
      if (sequelizeError.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          success: false,
          error: "E-mail already registered.",
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
        error: "Internal error. Try again.",
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
            console.error("Error destroying session: ", err);
            resolve(
              res.status(500).json({
                success: false,
                error: "Error logging out.",
              }),
            );
            return;
          }

          // Limpar cookie
          res.clearCookie("chemkey.sid");

          resolve(
            res.json({
              success: true,
              message: "Log out successful",
              redirectUrl: "/",
            }),
          );
        });
      } catch (error) {
        console.error("Erro no logout:", error);
        resolve(
          res.status(500).json({
            success: false,
            error: "Internal Error",
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
      console.error("Error on auth: ", error);
      return res.status(500).json({
        success: false,
        error: "Internal error: ",
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
          error: "User not authenticated.",
        });
      }

      // Validações
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({
          success: false,
          error: "All fields are obligatory",
        });
      }

      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({
          success: false,
          error: "Passwords are not the same.",
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          error: "New password must be 8 characters or more",
        });
      }

      // Buscar usuário
      const user = await User.scope("withSensitiveData").findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found.",
        });
      }

      // Validar senha atual
      const isValidCurrentPassword =
        await user.validatePassword(currentPassword);
      if (!isValidCurrentPassword) {
        return res.status(400).json({
          success: false,
          error: "Current password doesn't match.",
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
        message: "Password changed",
      });
    } catch (error) {
      console.error("Error updating password", error);
      return res.status(500).json({
        success: false,
        error: "Internal error.",
      });
    }
  }
}

export default AuthController;
