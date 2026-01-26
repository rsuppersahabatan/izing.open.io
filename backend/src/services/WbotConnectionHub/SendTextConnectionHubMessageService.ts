import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import connectionHubConfig from "./helpers/connectionHubConfig";
import { logger } from "../../utils/logger";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";

interface Request {
  body: string;
  ticket: Ticket;
}

interface MessageUpdateResponse {
  messageId: any;
  status: string;
  ack: number;
}

const SendTextConnectionHubMessageService = async ({
  body,
  ticket
}: Request): Promise<MessageUpdateResponse> => {
  const connectionHub = await Whatsapp.findByPk(ticket.whatsappId);
  if (connectionHub?.status !== "CONNECTED") {
    throw new AppError("ERR_CONNECTION_HUB_NOT_INITIALIZED");
  }

  try {
    const client = await connectionHubConfig(connectionHub?.tenantId!);
    let response: any;

    if (ticket.channel === "con_instagram") {
      response = await client.messaging.sendTextToInstagram(
        connectionHub?.tokenAPI,
        ticket.contact.instagramPK,
        body
      );
    } else if (ticket.channel === "con_facebook") {
      response = await client.messaging.sendTextToFacebook(
        connectionHub?.tokenAPI,
        ticket.contact.messengerId,
        body
      );
    }

    logger.debug("response", response);

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
    throw new AppError("ERR_SENDING_MESSAGE_HUB");
  }
};

export default SendTextConnectionHubMessageService;
