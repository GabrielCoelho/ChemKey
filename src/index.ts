import App from "./app";

// Tratamento de exceções não capturadas
process.on("uncaughtException", (error: Error) => {
  console.error("❌ Exceção não capturada:", error);
  console.log(error.name + " " + error.message);
  process.exit(1);
});

process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    console.error("❌ Promise rejeitada não tratada:", reason);
    console.error("Na promise:", promise);
    process.exit(1);
  },
);

// Tratamento graceful shutdown
process.on("SIGTERM", () => {
  console.log("🔄 SIGTERM recebido. Encerrando aplicação...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🔄 SIGINT recebido. Encerrando aplicação...");
  process.exit(0);
});

// Inicializar aplicação
const app = new App();
app.start();
