import express, { Application, Request, Response, NextFunction } from "express";
import path from "path";
import session from "express-session";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { initializeDatabase } from "./config/index";

// Import das rotas
import indexRoutes from "./routes/index";
import authRoutes from "./routes/auth";
import passwordRoutes from "./routes/passwords";

class App {
  public app: Application;
  private readonly PORT: number;

  constructor() {
    this.app = express();
    this.PORT = parseInt(process.env.PORT || "3000");

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://cdn.jsdelivr.net",
              "https://maxcdn.bootstrapcdn.com",
            ],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://maxcdn.bootstrapcdn.com"],
          },
        },
      }),
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por IP
      message: "Muitas tentativas de acesso. Tente novamente em 15 minutos.",
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Session configuration
    this.app.use(
      session({
        secret: process.env.SESSION_SECRET || "chemkey-dev-secret-2025",
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 horas
        },
      }),
    );

    // View engine setup
    this.app.set("view engine", "ejs");
    this.app.set("views", path.join(process.cwd(), "views"));

    // Static files
    this.app.use(express.static(path.join(process.cwd(), "public")));
    this.app.use("/src", express.static(path.join(process.cwd(), "views/src")));
  }

  private initializeRoutes(): void {
    this.app.use("/", indexRoutes);
    this.app.use("/auth", authRoutes);
    this.app.use("/passwords", passwordRoutes);

    // 404 handler
    this.app.use("*", (req: Request, res: Response) => {
      res.status(404).render("pages/404", {
        title: "Página não encontrada - ChemKey",
        error: "A página que você procura não existe.",
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error("Erro interno:", err);

        if (process.env.NODE_ENV === "development") {
          res.status(500).render("pages/error", {
            title: "Erro interno - ChemKey",
            error: err.message,
            stack: err.stack,
          });
        } else {
          res.status(500).render("pages/error", {
            title: "Erro interno - ChemKey",
            error: "Algo deu errado. Tente novamente mais tarde.",
            stack: null,
          });
        }
      },
    );
  }

  public async start(): Promise<void> {
    try {
      // Inicializar banco de dados
      await initializeDatabase();

      // Iniciar servidor
      this.app.listen(this.PORT, () => {
        console.log(`🚀 ChemKey rodando na porta ${this.PORT}`);
        console.log(`📱 Acesse: http://localhost:${this.PORT}`);
        console.log(`🔒 Ambiente: ${process.env.NODE_ENV || "development"}`);
      });
    } catch (error) {
      console.error("❌ Erro ao iniciar aplicação:", error);
      process.exit(1);
    }
  }
}

export default App;
