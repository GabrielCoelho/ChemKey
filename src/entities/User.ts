import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/index";

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at?: Date;
  updated_at?: Date;
  last_login_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public last_login_at?: Date;

  public async updateLastLogin(): Promise<void> {
    this.last_login_at = new Date();
    await this.save();
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
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Nome é obrigatório",
        },
        len: {
          args: [2, 100],
          msg: "Nome deve ter entre 2 e 100 caracteres",
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Email deve ter formato válido",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [6, 255],
          msg: "Senha deve ter no mínimo 6 caracteres",
        },
      },
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "user",
  },
);

export default User;
