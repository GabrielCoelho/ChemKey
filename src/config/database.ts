import { Sequelize } from "sequelize";
import path from "path";

const databaseConfig = {
  dialect: "sqlite" as const,
  storage: path.join(process.cwd(), "data", "chemkey.db"),
  logging: false,

  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

export default databaseConfig;
