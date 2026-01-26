import { Op } from "sequelize";
import Whatsapp from "../../models/Whatsapp";
import { StartTbotSession } from "../TbotServices/StartTbotSession";
import { StartWhatsAppSession } from "./StartWhatsAppSession";
import setConnectionHubChannelWebhook from "../WbotConnectionHub/helpers/setChannelWebhook";

export const StartAllWhatsAppsSessions = async (): Promise<void> => {
  const whatsapps = await Whatsapp.findAll({
    where: {
      [Op.or]: [
        {
          [Op.and]: {
            type: {
              [Op.in]: ["telegram"]
            },
            status: {
              [Op.notIn]: ["DISCONNECTED"]
            }
          }
        },
        {
          status: {
            [Op.notIn]: ["DISCONNECTED", "qrcode"]
          }
        }
      ],
      isActive: true
    }
  });
  const whatsappSessions = whatsapps.filter(w => w.type === "whatsapp");
  const telegramSessions = whatsapps.filter(
    w => w.type === "telegram" && !!w.tokenTelegram
  );

  const ConnectionHubSessions = whatsapps.filter(
    w => w.type.startsWith("con_") && !!w.tokenAPI
  );

  if (whatsappSessions.length > 0) {
    whatsappSessions.forEach(whatsapp => {
      StartWhatsAppSession(whatsapp);
    });
  }

  if (telegramSessions.length > 0) {
    telegramSessions.forEach(whatsapp => {
      StartTbotSession(whatsapp);
    });
  }

  if (ConnectionHubSessions.length > 0) {
    ConnectionHubSessions.forEach(whatsapp => {
      setConnectionHubChannelWebhook(whatsapp);
    });
  }


};
