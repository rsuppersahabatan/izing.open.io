import connectionHubConfig from "./connectionHubConfig";
import Whatsapp from "../../../models/Whatsapp";
import { logger } from "../../../utils/logger";

const UnSetConnectionHubWebHookService = async (whatsapp: Whatsapp): Promise<void> => {
  try {
    const client = await connectionHubConfig(whatsapp.tenantId);
    const response = await client.webhooks.removeWebhook(whatsapp.tokenAPI);
  } catch (error) {
    logger.error("ERROR: UnSetConnectionHubWebHookService", error);
  }
};

export default UnSetConnectionHubWebHookService;
