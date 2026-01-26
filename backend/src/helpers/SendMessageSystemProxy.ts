import { getTbot } from "../libs/tbot";
import TelegramSendMessagesSystem from "../services/TbotServices/TelegramSendMessagesSystem";
import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import SendTextConnectionHubMessageService from "../services/WbotConnectionHub/SendTextConnectionHubMessageService";
import SendMediaConnectionHubMessageService from "../services/WbotConnectionHub/SendMediaConnectionHubMessageService";
import Ticket from "../models/Ticket";

type Payload = {
  ticket: Ticket;
  messageData: any;
  media: any;
  userId: any;
};

const SendMessageSystemProxy = async ({
  ticket,
  messageData,
  media,
  userId
}: Payload): Promise<any> => {
  let message;

  if (messageData.mediaName) {
    switch (ticket.channel) {
      case "telegram":
        message = await TelegramSendMessagesSystem(
          getTbot(ticket.whatsappId),
          ticket,
          { ...messageData, media }
        );
        break;

      case "con_instagram":
        message = await SendMediaConnectionHubMessageService({
          mediaName: messageData.mediaName,
          ticket
        });
        break;

      case "con_facebook":
        message = await SendMediaConnectionHubMessageService({
          mediaName: messageData.mediaName,
          ticket
        });
        break;

      default:
        message = await SendWhatsAppMedia({ media, ticket, userId });
        break;
    }
  }

  if (!media) {
    switch (ticket.channel) {
      case "telegram":
        message = await TelegramSendMessagesSystem(
          getTbot(ticket.whatsappId),
          ticket,
          messageData
        );
        break;

      case "con_instagram":
        message = await SendTextConnectionHubMessageService({
          body: messageData.body,
          ticket
        });
        break;

      case "con_facebook":
        message = await SendTextConnectionHubMessageService({
          body: messageData.body,
          ticket
        });
        break;

      default:
        message = await SendWhatsAppMessage({
          body: messageData.body,
          ticket,
          quotedMsg: messageData?.quotedMsg
        });
        break;
    }
  }

  return message;
};

export default SendMessageSystemProxy;
