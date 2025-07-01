import { Router } from "express";
import PasswordController from "../controllers/PasswordController";
import ValidationMiddleware from "../middleware/validation";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Aplicar sanitização e validações básicas
router.use(ValidationMiddleware.sanitizeInput);
router.use(ValidationMiddleware.validateContentType);
router.use(ValidationMiddleware.validatePayloadSize(50 * 1024)); // 50KB max para senhas

// Development logging
if (process.env.NODE_ENV === "development") {
  router.use(ValidationMiddleware.logValidation);
}

/**
 * GET /passwords
 * Listar todas as senhas do usuário
 */
router.get("/", PasswordController.getAllPasswords);

/**
 * POST /passwords
 * Criar nova senha
 */
router.post(
  "/",
  ValidationMiddleware.validateCreatePassword,
  PasswordController.createPassword,
);

/**
 * GET /passwords/favorites
 * Listar senhas favoritas
 */
router.get("/favorites", PasswordController.getFavoritePasswords);

/**
 * POST /passwords/generate
 * Gerar senha aleatória
 */
router.post(
  "/generate",
  ValidationMiddleware.passwordGenerationRateLimit,
  ValidationMiddleware.validateGeneratePassword,
  PasswordController.generatePassword,
);

/**
 * GET /passwords/:id
 * Buscar senha específica
 */
router.get(
  "/:id",
  ValidationMiddleware.validatePasswordId,
  PasswordController.getPasswordById,
);

/**
 * PUT /passwords/:id
 * Atualizar senha existente
 */
router.put(
  "/:id",
  ValidationMiddleware.validateUpdatePassword,
  PasswordController.updatePassword,
);

/**
 * DELETE /passwords/:id
 * Deletar senha
 */
router.delete(
  "/:id",
  ValidationMiddleware.validatePasswordId,
  PasswordController.deletePassword,
);

/**
 * PATCH /passwords/:id/favorite
 * Toggle status de favorito
 */
router.patch(
  "/:id/favorite",
  ValidationMiddleware.validatePasswordId,
  PasswordController.toggleFavorite,
);

export default router;
