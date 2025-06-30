import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable("passwords", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    encrypted_password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(
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
      type: DataTypes.TEXT,
      allowNull: true,
    },
    favorite: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    strength: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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

  // Add constraint for strength validation
  await queryInterface.addConstraint("passwords", {
    fields: ["strength"],
    type: "check",
    name: "passwords_strength_check",
    where: {
      strength: {
        [DataTypes.Op.between]: [0, 5],
      },
    },
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable("passwords");
};
