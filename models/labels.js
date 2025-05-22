import { DataTypes } from "sequelize";
import Sequelize from "../config/DataBase.js";

const Labels = Sequelize.define(
  "labels",
  {
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    labels: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "labels",
    timestamps: false,
  }
);

export default Labels;
