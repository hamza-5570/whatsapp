import cron from "node-cron";
import fetchLatestEmailsForAllUsers from "./fetchEmail.js";

cron.schedule("* * * * *", () => {
  console.log("Running email fetch cron job...");
  fetchLatestEmailsForAllUsers();
});

export default cron;
