import { Client, MessageSubscription } from "notificamehubsdk";

import { showHubToken } from "./ShowHubToken";
import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";

const setChannelHubWebhook = async (whatsapp: Whatsapp) => {
  const notificameHubToken = await showHubToken(whatsapp.tenantId);

  const client = new Client(notificameHubToken);

  const url = `${process.env.BACKEND_URL}/hub-webhook/${whatsapp.number}`;

  const subscription = new MessageSubscription(
    {
      url
    },
    {
      channel: whatsapp.number
    }
  );

  client
    .createSubscription(subscription)
    .then((response: any) => {
      logger.info(`Webhook subscribed ${response}`);
    })
    .catch((error: any) => {
      logger.warn(`Webhook subscription error: ${error}`);
    });

  await whatsapp.update({ status: "CONNECTED" });
};

export default setChannelHubWebhook;
