import express from "express";
const routes = express.Router();

import emailRouter from "./emailRouter.js";
import emailTrackingRouter from "./emailTrackingRouter.js";

routes.use("/email", emailRouter);
routes.use("/emailTracking", emailTrackingRouter);

export default routes;
