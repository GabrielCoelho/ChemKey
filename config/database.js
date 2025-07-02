const path = require("path");

module.exports = {
  development: {
    dialect: "sqlite",
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
  },

  test: {
    dialect: "sqlite",
    storage: ":memory:",
    logging: false,

    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  },

  production: {
    dialect: "sqlite",
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
  },
};
