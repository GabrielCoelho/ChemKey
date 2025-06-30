import { Sequelize } from "sequelize";
import databaseConfig from "./database";

// Instância do Sequelize
const sequelize = new Sequelize(databaseConfig);

// Função para inicializar conexão
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Testa a conexão
    await sequelize.authenticate();
    console.log("✅ Conexão com o banco realizada com sucesso.");

    // Sincroniza os modelos (quando implementarmos)
    // await sequelize.sync();
  } catch (error) {
    console.error("❌ Impossível conectar com o banco de dados:", error);
    process.exit(1);
  }
};

// Função para fechar conexão
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log("🔒 Conexão com o banco fechada.");
  } catch (error) {
    console.error("❌ Erro ao fechar conexão: ", error);
  }
};

// Export da instância para usar nos models
export default sequelize;
