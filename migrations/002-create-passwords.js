"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("passwords", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      encrypted_password: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM(
          "social",
          "work",
          "financial",
          "email",
          "entertainment",
          "other",
        ),
        allowNull: false,
        defaultValue: "other",
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      favorite: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      strength: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      last_used_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes for performance
    await queryInterface.addIndex("passwords", ["user_id"], {
      name: "passwords_user_id_idx",
    });

    await queryInterface.addIndex("passwords", ["user_id", "website"], {
      name: "passwords_user_website_idx",
    });

    await queryInterface.addIndex("passwords", ["user_id", "category"], {
      name: "passwords_user_category_idx",
    });

    await queryInterface.addIndex("passwords", ["user_id", "favorite"], {
      name: "passwords_user_favorite_idx",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("passwords");
  },
};
