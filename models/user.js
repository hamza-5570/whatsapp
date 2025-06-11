import { DataTypes } from "sequelize";
import sequelize from "../config/DataBase.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    aud: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    encrypted_password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_super_admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    instance_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    phone_confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    phone_change: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    phone_change_token: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    phone_change_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    email_confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    invited_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    confirmation_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    confirmation_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    recovery_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recovery_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    email_change_token_new: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email_change: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email_change_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_sign_in_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    raw_app_meta_data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    raw_user_meta_data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    is_sso_user: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_anonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW, // Assuming you want to set a default value
    },
    email_change_token_current: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    email_change_confirm_status: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 0, // Assuming 0 is the default status
    },
    banned_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reauthentication_token: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    reauthentication_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "users",
    schema: "auth",
    timestamps: false,
  }
);

export default User;
