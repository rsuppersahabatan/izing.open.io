import { Request, Response } from "express";
import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";

import ListChannels from "../services/WbotConnectionHub/helpers/listConnections";

import ConnectionHubMessageListener from "../services/WbotConnectionHub/ConnectionHubMessageListener";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  try {
    const channels = await ListChannels(Number(tenantId));
    return res.status(200).json(channels);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const webhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tokenAPI } = req.params;
  const { body } = req;

  logger.debug("Webhook recebeu dados:", JSON.stringify(body, null, 2));
  // console.log("Webhook recebeu dados:", JSON.stringify(body, null, 2));

  const whatsapp = await Whatsapp.findOne({
    where: { tokenAPI }
  });

  if (!whatsapp) {
    return res.status(404).json({ message: "Whatsapp channel not found" });
  }

  try {
    await ConnectionHubMessageListener(body, whatsapp);
    return res.status(200).json({ message: "Webhook received" });
  } catch (error) {
    return res.status(400).json({ message: error });
  }
};
