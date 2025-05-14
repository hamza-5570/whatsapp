import express from "express";
const routes = express.Router();

import emailRouter from "./emailRouter.js";
import e from "express";

routes.use("/email", emailRouter);

export default routes;
