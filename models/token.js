import { DataTypes } from "sequelize";
import sequelize from "../config/DataBase.js";

const Tokens = sequelize.define(
  "Tokens",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    access_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    refresh_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "tokens",
    timestamps: false,
  }
);

export default Tokens;
