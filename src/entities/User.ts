import { DataTypes, Model, Optional } from "sequelize";
import bcrypt from "bcrypt";
import sequelize from "../config/index";

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  master_key?: string;
  created_at?: Date;
  updated_at?: Date;
  last_login_at?: Date;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "master_key" | "last_login_at"> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public name!: string;
  public email!: string;
  public password_hash!: string;
  public master_key?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public last_login_at?: Date;

  // Instance methods for password management
  public async setPassword(plainPassword: string): Promise<void> {
    const saltRounds = 12;
    this.password_hash = await bcrypt.hash(plainPassword, saltRounds);
  }

  public async validatePassword(plainPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, this.password_hash);
  }

  public async updateLastLogin(): Promise<void> {
    this.last_login_at = new Date();
    await this.save();
  }

  // Master key management for password encryption
  public async setMasterKey(derivedKey: string): Promise<void> {
    this.master_key = derivedKey;
    await this.save();
  }

  public getMasterKey(): string | null {
    return this.master_key || null;
  }

  // Static methods
  public static async findByEmail(email: string): Promise<User | null> {
    return this.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  public static async createUser(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    const user = this.build({
      name: userData.name,
      email: userData.email.toLowerCase(),
      password_hash: "", // Será preenchido pelo setPassword
    });

    await user.setPassword(userData.password);
    return await user.save();
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Nome é obrigatório",
        },
        len: {
          args: [2, 100],
          msg: "Nome deve ter entre 2 e 100 caracteres",
        },
        is: {
          args: /^[a-zA-ZÀ-ÿ\s]+$/,
          msg: "Nome deve conter apenas letras e espaços",
        },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        name: "users_email_unique",
        msg: "Este email já está em uso",
      },
      validate: {
        isEmail: {
          msg: "Email deve ter formato válido",
        },
        notEmpty: {
          msg: "Email é obrigatório",
        },
      },
      set(value: string) {
        this.setDataValue("email", value.toLowerCase().trim());
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Hash da senha é obrigatório",
        },
      },
    },
    master_key: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Chave mestra derivada para criptografia das senhas do usuário",
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    hooks: {
      beforeCreate: async (user: User) => {
        user.email = user.email.toLowerCase();
      },
      beforeUpdate: async (user: User) => {
        if (user.changed("email")) {
          user.email = user.email.toLowerCase();
        }
      },
    },
    indexes: [
      {
        unique: true,
        fields: ["email"],
        name: "users_email_unique_idx",
      },
    ],
    defaultScope: {
      attributes: {
        exclude: ["password_hash", "master_key"],
      },
    },
    scopes: {
      withSensitiveData: {
        attributes: undefined,
      },
    },
  },
);

export default User;
