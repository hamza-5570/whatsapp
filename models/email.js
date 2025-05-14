import { DataTypes } from "sequelize";
import sequelize from "../config/DataBase.js";

const Emails = sequelize.define(
  "Emails",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email_id: {
      type: DataTypes.TEXT,
    },
    sender: {
      type: DataTypes.TEXT,
    },
    subject: {
      type: DataTypes.TEXT,
    },
    body: {
      type: DataTypes.TEXT,
    },
    "Sender email": {
      type: DataTypes.TEXT,
    },
    draft_reply: {
      type: DataTypes.TEXT,
    },
    Status: {
      type: DataTypes.TEXT,
    },
    edited_draft_reply: {
      type: DataTypes.TEXT,
    },
    sent_at: {
      type: DataTypes.DATE,
    },
    attachments: {
      type: DataTypes.JSONB,
    },
    response_required: {
      type: DataTypes.BOOLEAN,
    },
    response_received_at: {
      type: DataTypes.DATE,
    },
    error_message: {
      type: DataTypes.TEXT,
    },
    labels: {
      type: DataTypes.JSONB,
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
  },
  {
    tableName: "Emails", // must match the table name in Supabase
    timestamps: false,
  }
);

export default Emails;
