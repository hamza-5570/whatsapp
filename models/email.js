import { DataTypes } from "sequelize";
import sequelize from "../config/DataBase.js";

const Emails = sequelize.define(
  "Emails",
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
    email_id: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sender: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    subject: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    received_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    "Sender email": {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    draft_reply: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    Status: {
      type: DataTypes.ENUM("open", "closed"),
      defaultValue: "open",
    },
    edited_draft_reply: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    response_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    response_received_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    labels: {
      type: DataTypes.TEXT, // Changed to TEXT
      allowNull: true, // Allow null values
    },
    messagelink: {
      type: DataTypes.TEXT,
    },
    docname: {
      type: DataTypes.TEXT,
    },
    deliverdto: {
      type: DataTypes.TEXT,
    },
    short: {
      type: DataTypes.TEXT,
    },
    medium: {
      type: DataTypes.TEXT,
    },
    long: {
      type: DataTypes.TEXT,
    },
    formal: {
      type: DataTypes.TEXT,
    },
    friendly: {
      type: DataTypes.TEXT,
    },
    brutal: {
      type: DataTypes.TEXT,
    },
    persuasive: {
      type: DataTypes.TEXT,
    },
    expert: {
      type: DataTypes.TEXT,
    },
    joyful: {
      type: DataTypes.TEXT,
    },
    inspirational: {
      type: DataTypes.TEXT,
    },
    informative: {
      type: DataTypes.TEXT,
    },
    thoughtful: {
      type: DataTypes.TEXT,
    },
    cautionary: {
      type: DataTypes.TEXT,
    },
    grieved: {
      type: DataTypes.TEXT,
    },
    exiting: {
      type: DataTypes.TEXT,
    },
    loving: {
      type: DataTypes.TEXT,
    },
    confident: {
      type: DataTypes.TEXT,
    },
    suprised: {
      type: DataTypes.TEXT,
    },
    Instructions: {
      type: DataTypes.TEXT,
    },
    reply_attachments: {
      type: DataTypes.JSONB,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "Emails",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["email_id"],
      },
    ],
  }
);
export default Emails;
