import { join, extname } from "path";
import { promisify } from "util";
import fs from "fs";

import { Message as WbotMessage } from "whatsapp-web.js";
import Contact from "../../../models/Contact";
import Ticket from "../../../models/Ticket";
import Message from "../../../models/Message";

import VerifyQuotedMessage from "./VerifyQuotedMessage";
import CreateMessageService from "../../MessageServices/CreateMessageService";
import { logger } from "../../../utils/logger";

import convertToMp3 from "../../../helpers/convertToMp3";

const writeFileAsync = promisify(fs.writeFile);

const VerifyMediaMessage = async (
  msg: WbotMessage,
  ticket: Ticket,
  contact: Contact
): Promise<Message | void> => {
  const quotedMsg = await VerifyQuotedMessage(msg);
  const media = await msg.downloadMedia();

  if (!media) {
    logger.error(`ERR_WAPP_DOWNLOAD_MEDIA:: ID: ${msg.id.id}`);
    return;
  }

  if (!media.filename) {
    const ext = media.mimetype.split("/")[1].split(";")[0];
    media.filename = `${Date.now()}.${ext}`;
  } else {
    media.filename = `${Date.now()}-${media.filename}`;
  }

  const publicDir = join(__dirname, "..", "..", "..", "..", "public");
  const inputFile = join(publicDir, media.filename);

  try {
    await writeFileAsync(inputFile, media.data, "base64");

    if (extname(inputFile).toLowerCase() === ".ogg") {
      const outputFile = await convertToMp3(inputFile);

      fs.unlinkSync(inputFile);

      media.filename = outputFile.split("/").pop()!;
    }
  } catch (err) {
    logger.error("Erro ao processar mídia:", err);
    return;
  }

  const messageData = {
    messageId: msg.id.id,
    ticketId: ticket.id,
    contactId: msg.fromMe ? undefined : contact.id,
    body: msg.body,
    fromMe: msg.fromMe,
    read: msg.fromMe,
    mediaUrl: media.filename,
    mediaType: media.mimetype.split("/")[0],
    quotedMsgId: quotedMsg?.id,
    timestamp: msg.timestamp,
    status: msg.fromMe ? "sended" : "received"
  };

  await ticket.update({
    lastMessage: msg.body,
    lastMessageAt: Date.now(),
    answered: msg.fromMe || false
  });

  const newMessage = await CreateMessageService({
    messageData,
    tenantId: ticket.tenantId
  });

  // eslint-disable-next-line consistent-return
  return newMessage;
};

export default VerifyMediaMessage;
