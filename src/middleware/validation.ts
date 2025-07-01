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
   */
  public static handleValidationErrors(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors: ValidationError[] = errors.array().map((error) => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined,
      }));

      res.status(400).json({
        success: false,
        error: "Dados inválidos fornecidos.",
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
    return value.trim().replace(/\s+/g, ' ');
  }

  /**
   * Validações para autenticação
   */
  public static validateLogin = [
    body('email')
      .isEmail()
      .withMessage('Email deve ter formato válido')
      .normalizeEmail()
      .isLength({ max: 255 })
      .withMessage('Email deve ter no máximo 255 caracteres'),

    body('password')
      .isLength({ min: 1 })
      .withMessage('Senha é obrigatória')
      .isLength({ max: 128 })
      .withMessage('Senha deve ter no máximo 128 caracteres'),

    ValidationMiddleware.handleValidationErrors,
  ];

  public static validateRegister = [
    body('name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres')
      .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
      .withMessage('Nome deve conter apenas letras e espaços')
      .customSanitizer((value) => ValidationMiddleware.sanitizeString(value)),

    body('email')
      .isEmail()
      .withMessage('Email deve ter formato válido')
      .normalizeEmail()
      .isLength({ max: 255 })
      .withMessage('Email deve ter no máximo 255 caracteres'),

    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Senha deve ter entre 8 e 128 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Senha deve conter ao menos: 1 minúscula, 1 maiúscula, 1 número'),

    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Confirmação de senha não confere');
        }
        return true;
      }),

    ValidationMiddleware.handleValidationErrors,
  ];

  public static validateChangePassword = [
    body('currentPassword')
      .isLength({ min: 1 })
      .withMessage('Senha atual é obrigatória'),

    body('newPassword')
      .isLength({ min: 8, max: 128 })
      .withMessage('Nova senha deve ter entre 8 e 128 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Nova senha deve conter ao menos: 1 minúscula, 1 maiúscula, 1 número'),

    body('confirmNewPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Confirmação da nova senha não confere');
        }
        return true;
      }),

    ValidationMiddleware.handleValidationErrors,
  ];

  /**
   * Validações para senhas
   */
  public static validateCreatePassword = [
    body('website')
      .isLength({ min: 1, max: 255 })
      .withMessage('Website deve ter entre 1 e 255 caracteres')
      .isURL({ require_protocol: false, require_host: false })
      .withMessage('Website deve ter formato válido')
      .customSanitizer((value) => ValidationMiddleware.sanitizeString(value)),

    body('username')
      .isLength({ min: 1, max: 255 })
      .withMessage('Username deve ter entre 1 e 255 caracteres')
      .customSanitizer((value) => ValidationMiddleware.sanitizeString(value)),

    body('password')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Password deve ter entre 1 e 1000 caracteres'),

    body('category')
      .optional()
      .isIn(['social', 'work', 'financial', 'email', 'entertainment', 'other'])
      .withMessage('Categoria deve ser uma das opções válidas'),

    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notas devem ter no máximo 1000 caracteres')
      .customSanitizer((value) => value ? ValidationMiddleware.sanitizeString(value) : ''),

    ValidationMiddleware.handleValidationErrors,
  ];

  public static validateUpdatePassword = [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID deve ser um número inteiro positivo'),

    body('website')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('Website deve ter entre 1 e 255 caracteres')
      .isURL({ require_protocol: false, require_host: false })
      .withMessage('Website deve ter formato válido')
      .customSanitizer((value) => ValidationMiddleware.sanitizeString(value)),

    body('username')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('Username deve ter entre 1 e 255 caracteres')
      .customSanitizer((value) => ValidationMiddleware.sanitizeString(value)),

    body('password')
      .optional()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Password deve ter entre 1 e 1000 caracteres'),

    body('category')
      .optional()
      .isIn(['social', 'work', 'financial', 'email', 'entertainment', 'other'])
      .withMessage('Categoria deve ser uma das opções válidas'),

    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notas devem ter no máximo 1000 caracteres')
      .customSanitizer((value) => value ? ValidationMiddleware.sanitizeString(value) : ''),

    body('favorite')
      .optional()
      .isBoolean()
      .withMessage('Favorite deve ser um valor booleano'),

    ValidationMiddleware.handleValidationErrors,
  ];

  public static validatePasswordId = [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID deve ser um número inteiro positivo'),

    ValidationMiddleware.handleValidationErrors,
  ];

  public static validateGeneratePassword = [
    body('length')
      .optional()
      .isInt({ min: 6, max: 64 })
      .withMessage('Comprimento deve estar entre 6 e 64 caracteres'),

    body('includeUppercase')
      .optional()
      .isBoolean()
      .withMessage('includeUppercase deve ser um valor booleano'),

    body('includeLowercase')
      .optional()
      .isBoolean()
      .withMessage('includeLowercase deve ser um valor booleano'),

    body('includeNumbers')
      .optional()
      .isBoolean()
      .withMessage('includeNumbers deve ser um valor booleano'),

    body('includeSymbols')
      .optional()
      .isBoolean()
      .withMessage('includeSymbols deve ser um valor booleano'),

    body('excludeAmbiguous')
      .optional()
      .isBoolean()
      .withMessage('excludeAmbiguous deve ser um valor booleano'),

    // Validação customizada para garantir ao menos um tipo de caractere
    body()
      .custom((value) => {
        const { includeUppercase, includeLowercase, includeNumbers, includeSymbols } = value;

        // Se nenhum foi especificado, aceitar (defaults serão usados)
        if (includeUppercase === undefined && includeLowercase === undefined &&
            includeNumbers === undefined && includeSymbols === undefined) {
          return true;
        }

        // Se pelo menos um for true, aceitar
        if (includeUppercase || includeLowercase || includeNumbers || includeSymbols) {
          return true;
        }

        throw new Error('Pelo menos um tipo de caractere deve ser incluído');
      }),

    ValidationMiddleware.handleValidationErrors,
  ];

  /**
   * Rate limiting específico para operações sensíveis
   */
  public static loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas por IP
    message: {
      success: false,
      error: "Muitas tentativas de login. Tente novamente em 15 minutos.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  });

  public static registerRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 registros por IP por hora
    message: {
      success: false,
      error: "Muitas tentativas de registro. Tente novamente em 1 hora.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  public static passwordGenerationRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 20, // 20 gerações por minuto
    message: {
      success: false,
      error: "Muitas gerações de senha. Tente novamente em 1 minuto.",
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
    if (req.body && typeof req.body === 'object') {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          // Remover caracteres potencialmente perigosos
          req.body[key] = req.body[key]
            .replace(/[<>]/g, '') // Remove < e >
            .trim();
        }
      }
    }

    // Sanitizar query parameters
    if (req.query && typeof req.query === 'object') {
      for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = (req.query[key] as string)
            .replace(/[<>]/g, '')
            .trim();
        }
      }
    }

    next();
  };

  /**
   * Middleware para validar Content-Type em requisições POST/PUT
   */
  public static validateContentType = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type');

      if (!contentType || !contentType.includes('application/json')) {
        res.status(400).json({
          success: false,
          error: "Content-Type deve ser application/json",
        });
        return;
      }
    }

    next();
  };

  /**
   * Middleware para validar tamanho do payload
   */
  public static validatePayloadSize = (maxSize: number = 1024 * 1024) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const contentLength = req.get('Content-Length');

      if (contentLength && parseInt(contentLength) > maxSize) {
        res.status(413).json({
          success: false,
          error: `Payload muito grande. Máximo permitido: ${maxSize} bytes`,
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
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Validating ${req.method} ${req.path}:`, {
        body: req.body,
        params: req.params,
        query: req.query,
        user: req.session?.user?.email || 'anonymous',
      });
    }

    next();
  };
}

export default ValidationMiddleware;
