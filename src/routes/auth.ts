import { Router } from "express";
import AuthController from "../controllers/AuthController";
import ValidationMiddleware from "../middleware/validation";
import { guestMiddleware } from "../middleware/auth";

const router = Router();

// Aplicar rate limiting e sanitização em todas as rotas
router.use(ValidationMiddleware.sanitizeInput);
router.use(ValidationMiddleware.validateContentType);
router.use(ValidationMiddleware.validatePayloadSize(10 * 1024)); // 10KB max

// Development logging
if (process.env.NODE_ENV === "development") {
  router.use(ValidationMiddleware.logValidation);
}

/**
 * POST /auth/login
 * Autenticar usuário
 */
router.post(
  "/login",
  ValidationMiddleware.loginRateLimit,
  guestMiddleware, // Redireciona se já logado
  ValidationMiddleware.validateLogin,
  AuthController.login,
);

/**
 * POST /auth/register
 * Criar nova conta
 */
router.post(
  "/register",
  ValidationMiddleware.registerRateLimit,
  guestMiddleware, // Redireciona se já logado
  ValidationMiddleware.validateRegister,
  AuthController.register,
);

/**
 * POST /auth/logout
 * Encerrar sessão
 */
router.post(
  "/logout",
  // Não precisa de autenticação - pode ser chamado mesmo deslogado
  AuthController.logout,
);

/**
 * GET /auth/check
 * Verificar status de autenticação
 */
router.get("/check", AuthController.checkAuth);

/**
 * POST /auth/change-password
 * Alterar senha do usuário (requer autenticação)
 */
router.post(
  "/change-password",
  ValidationMiddleware.loginRateLimit, // Mesmo rate limit do login
  ValidationMiddleware.validateChangePassword,
  AuthController.changePassword,
);

export default router;
