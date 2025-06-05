import { DataTypes } from "sequelize";
import sequelize from "../config/DataBase.js";

const EmailTracking = sequelize.define(
  "EmailTracking",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    tracking_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    tracker_status: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "Pending",
    },
    email_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "emailtracking",
    timestamps: false, // Assuming no createdAt/updatedAt fields
  }
);

export default EmailTracking;
