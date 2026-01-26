import socketEmit from "../../../helpers/socketEmit";
import Message from "../../../models/Message";
import Ticket from "../../../models/Ticket";
import { Op } from "sequelize";

const UpdateMessageAck = async (
  messageId: string,
  ack: number,
  whatsappId: number
): Promise<void> => {
  try {
    if (ack === 0) return;

    let message;

    if (ack === -1) {
      message = await Message.findOne({
        where: {
          messageId,
          whatsappId
        },
        include: [
          "contact",
          {
            model: Ticket,
            as: "ticket"
          },
          {
            model: Message,
            as: "quotedMsg",
            include: ["contact"]
          }
        ]
      });

      if (message) {
        await message.update({
          ack
        });
      }
    } else if (ack === 1) {
      message = await Message.findOne({
        where: {
          messageId,
          ack: { [Op.in]: [-1, 0] },
          whatsappId
        },
        include: [
          "contact",
          {
            model: Ticket,
            as: "ticket"
          },
          {
            model: Message,
            as: "quotedMsg",
            include: ["contact"]
          }
        ]
      });

      if (message) {
        await message.update({
          ack,
          messageId
        });
      }
    } else if (ack === 2) {
      message = await Message.findOne({
        where: {
          messageId,
          ack: { [Op.in]: [0, 1, 2] },
          whatsappId
        },
        include: [
          "contact",
          {
            model: Ticket,
            as: "ticket"
          },
          {
            model: Message,
            as: "quotedMsg",
            include: ["contact"]
          }
        ]
      });

      if (message) {
        await message.update({
          ack
        });
      }
    } else if (ack === 3) {
      message = await Message.findOne({
        where: {
          messageId,
          whatsappId
        },
        include: [
          "contact",
          {
            model: Ticket,
            as: "ticket"
          },
          {
            model: Message,
            as: "quotedMsg",
            include: ["contact"]
          }
        ]
      });

      if (message) {
        await message.update({
          ack
        });
      }
    }

    if (!message) {
      throw new Error("MSG_NOT_FOUND");
    }

    if (message) {
      socketEmit({
        tenantId: message.tenantId,
        type: "chat:ack",
        payload: message
      });
    }
  } catch (error) {
    //  throw error;
    // logger.error(`Error handling message ack hub. Err: ${error}`);
  }
};

export default UpdateMessageAck;
