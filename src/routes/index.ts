import { Router, Request, Response } from "express";

const router = Router();

// Página inicial
router.get("/", (req: Request, res: Response) => {
  res.render("pages/index", {
    title: "ChemKey - Your local PCA Manager",
    description:
      "A private password manager that keeps your digital keys secure and local.",
    user: req.session.user || null,
    isLoggedIn: !!req.session.user,
  });
});

// Página de login
router.get("/login", (req: Request, res: Response) => {
  // Se já estiver logado, redireciona para o app
  if (req.session.user) {
    return res.redirect("/app");
  }

  res.render("pages/login", {
    title: "ChemKey - Login",
    error: (req.query.error as string) || null,
    message: (req.query.message as string) || null,
  });
});

// Página principal do app (protegida)
router.get("/app", (req: Request, res: Response) => {
  // Verificar se está logado
  if (!req.session.user) {
    return res.redirect("/login?error=Acesso negado. Faça login primeiro.");
  }

  res.render("pages/app", {
    title: "ChemKey - Your Password Manager",
    user: req.session.user,
    username: req.session.user.name,
  });
});

// Página de registro
router.get("/register", (req: Request, res: Response) => {
  // Se já estiver logado, redireciona para o app
  if (req.session.user) {
    return res.redirect("/app");
  }

  res.render("pages/register", {
    title: "ChemKey - Criar Conta",
    error: (req.query.error as string) || null,
    message: (req.query.message as string) || null,
  });
});

// Health check
router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

export default router;
