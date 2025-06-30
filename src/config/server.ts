import dotenv from "dotenv";

// Carrega variáveis de ambiente
dotenv.config();

export const serverConfig = {
  port: parseInt(process.env.PORT || "3000"),
  nodeEnv: process.env.NODE_ENV || "development",

  // Configurações de sessão
  session: {
    secret: process.env.SESSION_SECRET || "chemkey-dev-secret-2025",
    name: "chemkey.sid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      sameSite: "strict" as const,
    },
  },

  // Configurações de segurança
  security: {
    bcryptRounds: 12,
    jwtSecret: process.env.JWT_SECRET || "chemkey-jwt-secret-2025",
    jwtExpiresIn: "24h",
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // requests por IP
    skipSuccessfulRequests: false,
  },

  // Rate limiting específico para login
  authRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 tentativas de login por IP
    skipSuccessfulRequests: true,
  },
};

export const isDevelopment = serverConfig.nodeEnv === "development";
export const isProduction = serverConfig.nodeEnv === "production";
