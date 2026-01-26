import { logger } from "../../../utils/logger";
import Whatsapp from "../../../models/Whatsapp";
import connectionHubConfig from "./connectionHubConfig";

const setConnectionHubChannelWebhook = async (whatsapp: Whatsapp): Promise<any> => {
  try {
    const client = await connectionHubConfig(whatsapp.tenantId);

    const url = `${process.env.BACKEND_URL}/hubconnection-webhook/${whatsapp.tokenAPI}`;

    const response = await client.webhooks.setupWebhook(url, whatsapp.tokenAPI);

    logger.debug(`Set Webhook: ${JSON.stringify(url)}`);

    await whatsapp.update({ status: "CONNECTED" });

    return response;
  } catch (error: any) {
    logger.warn(" Error in SetWebhook ConnecttionHub: ", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error(`An unknown error occurred: ${JSON.stringify(error)}`);
    }
  }
};

export default setConnectionHubChannelWebhook;
