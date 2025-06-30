import { DataTypes, Model, Optional, Association } from "sequelize";
import sequelize from "../config/index";
import User from "./User";

interface PasswordAttributes {
  id: number;
  user_id: number;
  website: string;
  username: string;
  encrypted_password: string;
  category:
    | "social"
    | "work"
    | "financial"
    | "email"
    | "entertainment"
    | "other";
  notes?: string;
  favorite: boolean;
  strength: number; // 0-5 strength indicator
  created_at?: Date;
  updated_at?: Date;
  last_used_at?: Date;
}

interface PasswordCreationAttributes
  extends Optional<
    PasswordAttributes,
    "id" | "favorite" | "strength" | "last_used_at"
  > {}

class Password
  extends Model<PasswordAttributes, PasswordCreationAttributes>
  implements PasswordAttributes
{
  public id!: number;
  public user_id!: number;
  public website!: string;
  public username!: string;
  public encrypted_password!: string;
  public category!:
    | "social"
    | "work"
    | "financial"
    | "email"
    | "entertainment"
    | "other";
  public notes?: string;
  public favorite!: boolean;
  public strength!: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public last_used_at?: Date;

  // Association methods
  public readonly user?: User;
  public static associations: {
    user: Association<Password, User>;
  };

  // Instance methods
  public async updateLastUsed(): Promise<void> {
    this.last_used_at = new Date();
    await this.save();
  }

  public async toggleFavorite(): Promise<void> {
    this.favorite = !this.favorite;
    await this.save();
  }

  public updateStrength(strength: number): void {
    if (strength >= 0 && strength <= 5) {
      this.strength = strength;
    }
  }

  // Static methods for queries
  public static async findByUserId(userId: number): Promise<Password[]> {
    return this.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
    });
  }

  public static async findByCategory(
    userId: number,
    category: string,
  ): Promise<Password[]> {
    return this.findAll({
      where: {
        user_id: userId,
        category: category,
      },
      order: [["website", "ASC"]],
    });
  }

  public static async findFavorites(userId: number): Promise<Password[]> {
    return this.findAll({
      where: {
        user_id: userId,
        favorite: true,
      },
      order: [["website", "ASC"]],
    });
  }

  public static async searchByWebsite(
    userId: number,
    searchTerm: string,
  ): Promise<Password[]> {
    return this.findAll({
      where: {
        user_id: userId,
        website: {
          [sequelize.Op.like]: `%${searchTerm}%`,
        },
      },
      order: [["website", "ASC"]],
    });
  }
}

Password.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Website é obrigatório",
        },
        len: {
          args: [1, 255],
          msg: "Website deve ter entre 1 e 255 caracteres",
        },
      },
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Username é obrigatório",
        },
        len: {
          args: [1, 255],
          msg: "Username deve ter entre 1 e 255 caracteres",
        },
      },
    },
    encrypted_password: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Password criptografada é obrigatória",
        },
      },
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
      validate: {
        isIn: {
          args: [
            ["social", "work", "financial", "email", "entertainment", "other"],
          ],
          msg: "Categoria deve ser uma das opções válidas",
        },
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: "Notas devem ter no máximo 1000 caracteres",
        },
      },
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
      validate: {
        min: {
          args: [0],
          msg: "Força deve ser no mínimo 0",
        },
        max: {
          args: [5],
          msg: "Força deve ser no máximo 5",
        },
      },
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Password",
    tableName: "passwords",
    indexes: [
      {
        fields: ["user_id"],
        name: "passwords_user_id_idx",
      },
      {
        fields: ["user_id", "website"],
        name: "passwords_user_website_idx",
      },
      {
        fields: ["user_id", "category"],
        name: "passwords_user_category_idx",
      },
      {
        fields: ["user_id", "favorite"],
        name: "passwords_user_favorite_idx",
      },
    ],
  },
);

// Define associations
Password.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

User.hasMany(Password, {
  foreignKey: "user_id",
  as: "passwords",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

export default Password;
