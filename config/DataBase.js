import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  "postgresql://postgres:NwShT9lbcFaGLVZM@db.sqhzfyhddzaxkotjyyes.supabase.co:5432/postgres",
  {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // keep false only if you're using self-signed certs
      },
    },
    logging: false, // optional: disables SQL logging in console
  }
);

export default sequelize;
