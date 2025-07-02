import { Router, Request, Response } from "express";
import path from "path";

const router = Router();

// Página inicial
router.get("/", (req: Request, res: Response) => {
  res.render("pages/index", {
    title: "ChemKey - Your local PCA Manager",
    description:
      "A private password manager that keeps your digital keys secure and local.",
    user: req.session?.user || null,
    isLoggedIn: !!req.session?.user,
    currentPage: "home",
  });
});

// Página de login
router.get("/login", (req: Request, res: Response) => {
  // Se já estiver logado, redireciona para o app
  if (req.session?.user) {
    return res.redirect("/app");
  }

  res.render("pages/login", {
    title: "ChemKey - Login",
    error: (req.query.error as string) || null,
    message: (req.query.message as string) || null,
    user: null,
    isLoggedIn: false,
    currentPage: "login",
  });
});

// Página principal do app (protegida)
router.get("/app", (req: Request, res: Response) => {
  // Verificar se está logado
  if (!req.session?.user) {
    return res.redirect("/login?error=Acesso negado. Faça login primeiro.");
  }

  res.render("pages/app", {
    title: "ChemKey - Your Password Manager",
    user: req.session.user,
    username: req.session.user.name, // Manter por compatibilidade
    isLoggedIn: true,
    currentPage: "app",
  });
});

// Página de registro
router.get("/register", (req: Request, res: Response) => {
  // Se já estiver logado, redireciona para o app
  if (req.session?.user) {
    return res.redirect("/app");
  }

  res.render("pages/register", {
    title: "ChemKey - Criar Conta",
    error: (req.query.error as string) || null,
    message: (req.query.message as string) || null,
    user: null,
    isLoggedIn: false,
    currentPage: "register",
  });
});

// Rota de teste para forçar erro 404
router.get("/force-404", (req: Request, res: Response) => {
  res.status(404).render("pages/404", {
    title: "Página não encontrada - ChemKey",
    error: "Esta é uma página de teste 404 através de rota específica.",
    isLoggedIn: !!req.session?.user,
    currentPage: "404",
    user: req.session?.user || null,
  });
});

// Rota de teste para forçar erro 500
router.get("/force-error", (req: Request, res: Response, next) => {
  // Simular um erro
  const error = new Error("Este é um erro simulado para teste");
  next(error);
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

// Favicon route
router.get("/favicon.ico", (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), "views/src/public/images/logo.png"));
});

// Catch-all para recursos estáticos que não existem
router.get("/public/*", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Static resource not found",
    path: req.path,
  });
});

export default router;
