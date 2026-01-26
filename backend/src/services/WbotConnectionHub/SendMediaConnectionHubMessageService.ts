import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import connectionHubConfig from "./helpers/connectionHubConfig";
import { logger } from "../../utils/logger";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";

interface Request {
  mediaName: string;
  ticket: Ticket;
}

interface MessageUpdateResponse {
  messageId: any;
  status: string;
  ack: number;
}

  const SendMediaConnectionHubMessageService = async ({
                                                        mediaName,
                                                       ticket
                                                     }: Request): Promise<MessageUpdateResponse> => {
  const connectionHub = await Whatsapp.findByPk(ticket.whatsappId);
  if (connectionHub?.status !== "CONNECTED") {
    throw new AppError("ERR_CONNECTION_HUB_NOT_INITIALIZED");
  }
  if (!connectionHub) {
    throw new AppError(`ERR_CONNECTION_HUB_NOT_FOUND`);
  }

  const client = await connectionHubConfig(connectionHub.tenantId);

  try {
    let response: any;

    const url = `${process.env.BACKEND_URL}/public/${mediaName}`;

    if (ticket.channel === "con_instagram") {
      response = await client.messaging.sendFileToInstagram(
        connectionHub?.tokenAPI,
        ticket.contact.instagramPK,
        url
      );
    } else if (ticket.channel === "con_facebook") {
      response = await client.messaging.sendFileToFacebook(
        connectionHub?.tokenAPI,
        ticket.contact.messengerId,
        url
      );
    }

    const messageToUpdate = {
      messageId: response.messageId,
      status: "sended",
      ack: 2
    };

    logger.info("Message Update ok");
    await SetTicketMessagesAsRead(ticket);

    return messageToUpdate;
  } catch (err) {
    logger.error(
      `Error message is (tenant: ${ticket.tenantId} | Ticket: ${ticket.id})`,
      err
    );
    throw new AppError("ERR_SENDING_MEDIA_HUB");
  }
};

export default SendMediaConnectionHubMessageService;
