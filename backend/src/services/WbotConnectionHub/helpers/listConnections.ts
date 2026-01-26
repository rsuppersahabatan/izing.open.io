import { logger } from "../../../utils/logger";
import connectionHubConfig from "./connectionHubConfig";
import Whatsapp from "../../../models/Whatsapp";
import { Op } from "sequelize";
import AppError from "../../../errors/AppError";

const ListChannels = async (tenantId: number): Promise<any> => {
  try {
    const client = await connectionHubConfig(tenantId);
    const connections = await client.connections.listConnections();

    const whatsapps = await Whatsapp.findAll({
      where: {
        tenantId: tenantId,
        tokenAPI: {
          [Op.ne]: ""
        }
      }
    });

    logger.debug(`Connections retrieved: ${JSON.stringify(connections)}`);

    const connectionsFiltered = connections.filter((connection: any) => {
      return !whatsapps.some((whatsapp: any) => whatsapp.tokenAPI === connection.channelToken);
    });

    logger.debug(`connectionsFiltered: ${JSON.stringify(connectionsFiltered)}`);

    return connectionsFiltered;
  } catch (error: any) {
    console.error("Error in ListChannels ConnectionHUB:", error);
    throw new AppError("TOKEN_ERROR_HUB", 404);
  }
};

export default ListChannels;
