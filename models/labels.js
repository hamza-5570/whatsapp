import { DataTypes } from "sequelize";
import sequelize from "../config/DataBase.js";

const Labels = sequelize.define(
  "Labels",
  {
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    labels: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
  },
  {
    tableName: "labels",
    timestamps: false,
  }
);

export default Labels;
