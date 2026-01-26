import express from "express";

import * as ConnectionHubControler from "../controllers/ConnectionHubControler";
import isAuth from "../middleware/isAuth";

const ConnectionHubRoutes = express.Router();

ConnectionHubRoutes.get(
  "/connection-channel/",
  isAuth,
  ConnectionHubControler.index
);

ConnectionHubRoutes.post(
  "/hubconnection-webhook/:tokenAPI",
  ConnectionHubControler.webhook
);

export default ConnectionHubRoutes;
