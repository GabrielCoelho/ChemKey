import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { serverConfig } from "../config/server";
// import AuthController from '../controllers/AuthController'; // Implementaremos depois

const router = Router();

// Rate limiting específico para autenticação
const authLimiter = rateLimit({
  windowMs: serverConfig.authRateLimit.windowMs,
  max: serverConfig.authRateLimit.max,
  message: {
    error: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting em todas as rotas de auth
router.use(authLimiter);

// POST /auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validação básica
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email e senha são obrigatórios.",
      });
    }

    // TODO: Implementar validação real com banco de dados
    // Por enquanto, mantém a validação hardcoded para continuidade
    if (email === "teste@teste" && password === "teste") {
      // Criar sessão
      req.session.user = {
        id: 1,
        name: "Usuário Teste",
        email: email,
      };

      return res.json({
        success: true,
        message: "Login realizado com sucesso!",
        redirectUrl: "/app",
      });
    } else {
      return res.status(401).json({
        success: false,
        error: "Email ou senha incorretos.",
      });
    }
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    });
  }
});

// POST /auth/register
router.post("/register", async (req: Request, res: Response) => {
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

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "A senha deve ter no mínimo 6 caracteres.",
      });
    }

    // TODO: Implementar registro real com banco de dados
    // Por enquanto, simula sucesso
    return res.json({
      success: true,
      message: "Conta criada com sucesso! Você pode fazer login agora.",
      redirectUrl: "/login",
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    });
  }
});

// POST /auth/logout
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao destruir sessão:", err);
      return res.status(500).json({
        success: false,
        error: "Erro ao fazer logout.",
      });
    }

    res.clearCookie("chemkey.sid");
    return res.json({
      success: true,
      message: "Logout realizado com sucesso!",
      redirectUrl: "/",
    });
  });
});

// GET /auth/check - Verificar se está logado
router.get("/check", (req: Request, res: Response) => {
  res.json({
    isLoggedIn: !!req.session.user,
    user: req.session.user || null,
  });
});

export default router;
