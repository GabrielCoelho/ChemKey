import { Request, Response, NextFunction } from "express";

// Extender interface da sessão para incluir user
declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      name: string;
      email: string;
    };
  }
}

// Middleware para verificar se o usuário está autenticado
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Verificar se há uma sessão ativa com usuário
  if (!req.session || !req.session.user) {
    // Se for requisição AJAX/API, retorna JSON
    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.status(401).json({
        success: false,
        error: "Acesso negado. Faça login primeiro.",
        redirectUrl: "/login",
      });
    }

    // Se for requisição normal, redireciona para login
    return res.redirect("/login?error=Acesso negado. Faça login primeiro.");
  }

  // Usuário autenticado, continuar
  next();
};

// Middleware para verificar se o usuário NÃO está autenticado (para páginas como login/register)
export const guestMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Se já estiver logado, redireciona para o app
  if (req.session && req.session.user) {
    return res.redirect("/app");
  }

  // Usuário não autenticado, continuar
  next();
};

// Middleware para verificar se o usuário é o dono do recurso (para APIs)
export const ownershipMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Este middleware será usado quando implementarmos as entidades
  // Por enquanto, apenas passa adiante
  next();
};
