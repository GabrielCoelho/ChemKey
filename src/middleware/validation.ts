import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";

// Interface para erros de validação customizados
interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class ValidationMiddleware {
  /**
   * Middleware genérico para processar resultados de validação
   * VERSÃO MELHORADA COM MENSAGENS ESPECÍFICAS
   */
  public static handleValidationErrors(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors: ValidationError[] = errors
        .array()
        .map((error) => ({
          field: error.type === "field" ? error.path : "unknown",
          message: error.msg,
          value: error.type === "field" ? error.value : undefined,
        }));

      // Log detalhado para debug acadêmico
      if (process.env.NODE_ENV === "development") {
        console.log("❌ Validation errors:", formattedErrors);
        console.log("📋 Request body:", req.body);
      }

      // MELHORADO: Criar mensagem específica baseada nos erros
      const errorMessages = formattedErrors.map((err) => err.message);
      const specificErrorMessage = errorMessages.join(", ");

      res.status(400).json({
        success: false,
        error: `Invalid data: ${specificErrorMessage}`,
        details: formattedErrors,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  }

  /**
   * Sanitização básica para strings
   */
  private static sanitizeString(value: string): string {
    return value.trim().replace(/\s+/g, " ");
  }

  /**
   * Validações para autenticação - MELHORADAS COM MENSAGENS ESPECÍFICAS
   */
  public static validateLogin = [
    body("email")
      .isLength({ min: 1 })
      .withMessage("Email is required")
      .isLength({ max: 255 })
      .withMessage("Email must be at most 255 characters")
      // Validação flexível: aceita email simples ou formato completo
      .custom((value) => {
        // Aceita tanto "teste@teste" quanto "teste@teste.com"
        const simpleEmailRegex = /^[^@\s]+@[^@\s]+$/;
        const fullEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (simpleEmailRegex.test(value) || fullEmailRegex.test(value)) {
          return true;
        }
        throw new Error(
          "Email must have valid format (ex: user@domain or user@domain.com)",
        );
      })
      .customSanitizer((value) => value.toLowerCase().trim()),

    body("password")
      .isLength({ min: 1 })
      .withMessage("Password is required")
      .isLength({ max: 128 })
      .withMessage("Password must be at most 128 characters"),

    ValidationMiddleware.handleValidationErrors,
  ];

  public static validateRegister = [
    body("name")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters")
      .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
      .withMessage("Name must contain only letters and spaces")
      .customSanitizer((value) => ValidationMiddleware.sanitizeString(value)),

    body("email")
      .isLength({ min: 1 })
      .withMessage("Email is required")
      .isLength({ max: 255 })
      .withMessage("Email must be at most 255 characters")
      // Validação flexível: aceita email simples ou formato completo
      .custom((value) => {
        const simpleEmailRegex = /^[^@\s]+@[^@\s]+$/;
        const fullEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (simpleEmailRegex.test(value) || fullEmailRegex.test(value)) {
          return true;
        }
        throw new Error(
          "Email must have valid format (ex: user@domain or user@domain.com)",
        );
      })
      .customSanitizer((value) => value.toLowerCase().trim()),

    // VALIDAÇÃO DE SENHA MELHORADA COM MENSAGENS ESPECÍFICAS
    body("password")
      .custom((value, { req }) => {
        // Para demo acadêmica: aceitar senhas simples como "teste"
        if (
          process.env.NODE_ENV === "development" ||
          process.env.DEMO_MODE === "true"
        ) {
          // Requisitos mínimos para demo
          if (value.length < 3) {
            throw new Error("Password must be at least 3 characters for demo");
          }
          return true;
        }

        // Para produção: manter requisitos de segurança
        if (value.length < 8) {
          throw new Error("Password must be at least 8 characters long");
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          throw new Error(
            "Password must contain at least: 1 lowercase letter, 1 uppercase letter, 1 number",
          );
        }

        return true;
      })
      .isLength({ max: 128 })
      .withMessage("Password must be at most 128 characters"),

    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match");
      }
      return true;
    }),

    ValidationMiddleware.handleValidationErrors,
  ];

  public static validateChangePassword = [
    body("currentPassword")
      .isLength({ min: 1 })
      .withMessage("Current password is required"),

    // Mesma lógica flexível para mudança de senha
    body("newPassword")
      .custom((value) => {
        if (
          process.env.NODE_ENV === "development" ||
          process.env.DEMO_MODE === "true"
        ) {
          if (value.length < 3) {
            throw new Error(
              "New password must be at least 3 characters for demo",
            );
          }
          return true;
        }

        if (value.length < 8) {
          throw new Error("New password must be at least 8 characters long");
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          throw new Error(
            "New password must contain at least: 1 lowercase letter, 1 uppercase letter, 1 number",
          );
        }

        return true;
      })
      .isLength({ max: 128 })
      .withMessage("New password must be at most 128 characters"),

    body("confirmNewPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("New password confirmation does not match");
      }
      return true;
    }),

    ValidationMiddleware.handleValidationErrors,
  ];

  /**
   * Validações para senhas - MELHORADAS
   */
  public static validateCreatePassword = [
    body("website")
      .isLength({ min: 1, max: 255 })
      .withMessage("Website must be between 1 and 255 characters")
      .customSanitizer((value) => ValidationMiddleware.sanitizeString(value)),

    body("username")
      .isLength({ min: 1, max: 255 })
      .withMessage("Username must be between 1 and 255 characters")
      .customSanitizer((value) => ValidationMiddleware.sanitizeString(value)),

    body("password")
      .isLength({ min: 1, max: 1000 })
      .withMessage("Password must be between 1 and 1000 characters"),

    body("category")
      .optional()
      .isIn(["social", "work", "financial", "email", "entertainment", "other"])
      .withMessage("Category must be one of the valid options"),

    body("notes")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Notes must be at most 1000 characters")
      .customSanitizer((value) =>
        value ? ValidationMiddleware.sanitizeString(value) : "",
      ),

    ValidationMiddleware.handleValidationErrors,
  ];

  public static validateUpdatePassword = [
    param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),

    body("website")
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage("Website must be between 1 and 255 characters")
      .customSanitizer((value) => ValidationMiddleware.sanitizeString(value)),

    body("username")
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage("Username must be between 1 and 255 characters")
      .customSanitizer((value) => ValidationMiddleware.sanitizeString(value)),

    body("password")
      .optional()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Password must be between 1 and 1000 characters"),

    body("category")
      .optional()
      .isIn(["social", "work", "financial", "email", "entertainment", "other"])
      .withMessage("Category must be one of the valid options"),

    body("notes")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Notes must be at most 1000 characters")
      .customSanitizer((value) =>
        value ? ValidationMiddleware.sanitizeString(value) : "",
      ),

    body("favorite")
      .optional()
      .isBoolean()
      .withMessage("Favorite must be a boolean value"),

    ValidationMiddleware.handleValidationErrors,
  ];

  public static validatePasswordId = [
    param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),

    ValidationMiddleware.handleValidationErrors,
  ];

  public static validateGeneratePassword = [
    body("length")
      .optional()
      .isInt({ min: 6, max: 64 })
      .withMessage("Length must be between 6 and 64 characters"),

    body("includeUppercase")
      .optional()
      .isBoolean()
      .withMessage("includeUppercase must be a boolean value"),

    body("includeLowercase")
      .optional()
      .isBoolean()
      .withMessage("includeLowercase must be a boolean value"),

    body("includeNumbers")
      .optional()
      .isBoolean()
      .withMessage("includeNumbers must be a boolean value"),

    body("includeSymbols")
      .optional()
      .isBoolean()
      .withMessage("includeSymbols must be a boolean value"),

    body("excludeAmbiguous")
      .optional()
      .isBoolean()
      .withMessage("excludeAmbiguous must be a boolean value"),

    // Validação customizada para garantir ao menos um tipo de caractere
    body().custom((value) => {
      const {
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
      } = value;

      // Se nenhum foi especificado, aceitar (defaults serão usados)
      if (
        includeUppercase === undefined &&
        includeLowercase === undefined &&
        includeNumbers === undefined &&
        includeSymbols === undefined
      ) {
        return true;
      }

      // Se pelo menos um for true, aceitar
      if (
        includeUppercase ||
        includeLowercase ||
        includeNumbers ||
        includeSymbols
      ) {
        return true;
      }

      throw new Error("At least one character type must be included");
    }),

    ValidationMiddleware.handleValidationErrors,
  ];

  /**
   * Rate limiting - RELAXADO PARA DEMO ACADÊMICA
   */
  public static loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: process.env.NODE_ENV === "development" ? 50 : 5, // 50 tentativas em dev, 5 em prod
    message: {
      success: false,
      error: "Too many login attempts. Please try again in a few minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  });

  public static registerRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: process.env.NODE_ENV === "development" ? 20 : 3, // 20 registros em dev, 3 em prod
    message: {
      success: false,
      error: "Too many registration attempts. Please try again in 1 hour.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  public static passwordGenerationRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: process.env.NODE_ENV === "development" ? 100 : 20, // 100 gerações em dev, 20 em prod
    message: {
      success: false,
      error: "Too many password generations. Please try again in 1 minute.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  /**
   * Middleware para sanitização de entrada
   */
  public static sanitizeInput = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    // Sanitizar strings em req.body
    if (req.body && typeof req.body === "object") {
      for (const key in req.body) {
        if (typeof req.body[key] === "string") {
          // Remover caracteres potencialmente perigosos
          req.body[key] = req.body[key]
            .replace(/[<>]/g, "") // Remove < e >
            .trim();
        }
      }
    }

    // Sanitizar query parameters
    if (req.query && typeof req.query === "object") {
      for (const key in req.query) {
        if (typeof req.query[key] === "string") {
          req.query[key] = (req.query[key] as string)
            .replace(/[<>]/g, "")
            .trim();
        }
      }
    }

    next();
  };

  /**
   * Middleware para validar Content-Type em requisições POST/PUT - FLEXIBILIZADO
   */
  public static validateContentType = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      const contentType = req.get("Content-Type");

      // Aceitar tanto JSON quanto form-encoded para compatibilidade
      if (
        contentType &&
        (contentType.includes("application/json") ||
          contentType.includes("application/x-www-form-urlencoded"))
      ) {
        next();
        return;
      }

      res.status(400).json({
        success: false,
        error:
          "Content-Type must be application/json or application/x-www-form-urlencoded",
      });
      return;
    }

    next();
  };

  /**
   * Middleware para validar tamanho do payload
   */
  public static validatePayloadSize = (maxSize: number = 1024 * 1024) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const contentLength = req.get("Content-Length");

      if (contentLength && parseInt(contentLength) > maxSize) {
        res.status(413).json({
          success: false,
          error: `Payload too large. Maximum allowed: ${maxSize} bytes`,
        });
        return;
      }

      next();
    };
  };

  /**
   * Middleware para log de validações (development)
   */
  public static logValidation = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (process.env.NODE_ENV === "development") {
      console.log(`🔍 Validating ${req.method} ${req.path}:`, {
        body: req.body,
        params: req.params,
        query: req.query,
        user: req.session?.user?.email || "anonymous",
      });
    }

    next();
  };
}

export default ValidationMiddleware;
