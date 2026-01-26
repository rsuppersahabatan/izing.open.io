import { v4 as uuid } from "uuid";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import Contact from "../../models/Contact";
import {
  VerifyContactFacebook,
  VerifyContactInstagram
} from "./helpers/VerifyContact";
import { cacheLayer } from "../../libs/cache";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import socketEmit from "../../helpers/socketEmit";
import { downloadFiles } from "../../helpers/DownloadFiles";
import createTranscription from "../../helpers/createTranscription";
import convertToMp3 from "../../helpers/convertToMp3";
import fs from "fs";
import verifyBusinessHours from "../WbotServices/helpers/VerifyBusinessHours";
import VerifyStepsChatFlowTicket from "../ChatFlowServices/VerifyStepsChatFlowTicket";
import Message from "../../models/Message";
import UpdateMessageAck from "./helpers/UpdateMessageAck";
import findQuotedMessageId from "./helpers/findQuotedMessageId";
import Ticket from "../../models/Ticket";

export interface HubMessage {
  fromMe: boolean;
  from: { id: string };
  to: { id: string };
  timestamp?: number;
  message?: {
    mid: string;
    is_deleted: boolean;
    attachments?: Array<{
      type: string;
      payload: { url: string };
    }>;
    text?: string;
    reply_to?: { mid: string };
  };
  reaction?: {
    mid: string;
    action?: string;
    emoji?: string;
    reaction?: string;
  };
  delivery?: {
    mids: string[];
    watermark: number;
  };
  read?: {
    mid: string;
    watermark: number;
  };
}

const ConnectionHubMessageListener = async (
  HubMessage: any | HubMessage,
  whatsapp: Whatsapp
) => {
  try {
    logger.debug(`Connection Hub ${JSON.stringify(HubMessage)}`);

    if (
      HubMessage?.messageData?.[0]?.delivery ||
      HubMessage?.messageData?.[0]?.read
    ) {
      let messageIdACK: string | undefined;
      let ackStatus: number | undefined;

      if (HubMessage?.messageData?.[0]?.read) {
        messageIdACK = HubMessage.messageData[0].read.mid;
        ackStatus = 3;
        logger.debug("confirmacao ack READ (3)", messageIdACK);
      } else if (HubMessage?.messageData?.[0]?.delivery) {
        messageIdACK = HubMessage.messageData[0].delivery.mid;
        ackStatus = 2;
        logger.debug("confirmacao ack DELIVERY (2)", messageIdACK);
      }

      if (whatsapp.type === "con_facebook") {
        const fromMe = HubMessage?.messageData?.[0]?.fromMe;

        let contactId = "";
        if (!fromMe) {
          contactId = HubMessage?.messageData?.[0]?.from?.id;
        } else {
          contactId = HubMessage?.messageData?.[0]?.to?.id;
        }

        const contact = await VerifyContactFacebook(contactId, whatsapp);

        const ticket = await Ticket.findOne({
          where: {
            tenantId: whatsapp.tenantId,
            whatsappId: whatsapp.id,
            contactId: contact.id
          },
          order: [["id", "DESC"]]
        });

        // Add null check for ticket
        if (ticket) {
          const getMessage = await Message.findAll({
            where: {
              ticketId: ticket.id,
              fromMe: true,
              ack: 1
            },
            order: [["createdAt", "DESC"]]
          });

          getMessage.forEach(async item => {
            if (item.messageId) {
              await UpdateMessageAck(item.messageId, 3, whatsapp.id);
            }
          });
        }
      }

      // Check both variables are defined before using
      if (messageIdACK && ackStatus !== undefined) {
        await UpdateMessageAck(messageIdACK, ackStatus, whatsapp.id);
      }
      return;
    }

    if (!HubMessage?.messageData?.[0]?.message) {
      logger.info(`Connection Hub não suportado ${JSON.stringify(HubMessage)}`);
      return;
    }

    const messageId = HubMessage?.messageData?.[0]?.message?.mid || uuid();

    const message = await Message.findOne({
      where: {
        messageId,
        tenantId: whatsapp.tenantId
      }
    });

    if (message) {
      console.log("Mensagem já existe");
      return;
    }

    const fromMe = HubMessage?.messageData?.[0]?.fromMe;
    const timestamp = HubMessage?.messageData?.[0]?.timestamp;

    let contact: Contact | undefined;

    let contactId = "";
    if (!fromMe) {
      contactId = HubMessage?.messageData?.[0]?.from?.id;
    } else {
      contactId = HubMessage?.messageData?.[0]?.to?.id;
    }

    if (whatsapp.type === "con_facebook") {
      contact = await VerifyContactFacebook(contactId, whatsapp);
    } else if (whatsapp.type === "con_instagram") {
      contact = await VerifyContactInstagram(contactId, whatsapp);
    } else {
      return;
    }

    let unreadMessages = 0;

    const contactChannelId = `${contact.id}:${whatsapp.id}`;

    if (fromMe) {
      await cacheLayer.set(`contacts:${contactChannelId}:unreads`, "0");
    } else {
      const unreads = await cacheLayer.get(
        `contacts:${contactChannelId}:unreads`
      );
      unreadMessages = unreads ? +unreads + 1 : 1;
      await cacheLayer.set(
        `contacts:${contactChannelId}:unreads`,
        `${unreadMessages}`
      );
    }

   let messageText = HubMessage?.messageData?.[0]?.message?.text || "";

    const ticket = await FindOrCreateTicketService({
      contact,
      whatsappId: whatsapp.id!,
      unreadMessages,
      tenantId: whatsapp.tenantId,
      msg: { ...messageText, fromMe },
      channel: whatsapp.type
    });

    const quotedMsgId = await findQuotedMessageId(HubMessage);

    // Processar reações
    if (HubMessage?.messageData?.[0]?.reaction?.mid) {
      messageText = HubMessage?.messageData?.[0]?.reaction?.emoji;

      const messageData = {
        messageId,
        ticketId: ticket.id,
        contactId: fromMe ? undefined : contact.id,
        body: messageText,
        fromMe,
        read: fromMe,
        mediaType: "reactionMessage",
        quotedMsgId,
        timestamp: timestamp || new Date().getTime(),
        status: "received"
      };

      await ticket.update({
        lastMessage: messageText,
        lastMessageAt: new Date().getTime(),
        answered: fromMe
      });

      await CreateMessageService({
        messageData,
        tenantId: ticket.tenantId
      });

      return;
    }

    // Processar mensagens de texto sem anexos
    if (!HubMessage?.messageData?.[0]?.message?.attachments) {
      const messageData = {
        messageId,
        ticketId: ticket.id,
        contactId: fromMe ? undefined : contact.id,
        body: messageText,
        fromMe,
        read: fromMe,
        mediaType: "chat",
        quotedMsgId,
        timestamp: timestamp || new Date().getTime(),
        status: "received"
      };

      await ticket.update({
        lastMessage: messageText,
        lastMessageAt: new Date().getTime(),
        answered: fromMe
      });

      await CreateMessageService({
        messageData,
        tenantId: ticket.tenantId
      });

      socketEmit({
        tenantId: whatsapp.tenantId,
        type: "ticket:update",
        payload: ticket
      });
    } else if (HubMessage?.messageData?.[0]?.message?.attachments) {
      const MAX_RETRIES = 5;
      const RETRY_DELAY = 20000;

      const downloadWithRetry = async (
        attachmentUrl: string,
        attachmentIndex: number,
        totalAttachments: number,
        attempt = 1
      ): Promise<any> => {
        try {
          logger.info(
            `Tentativa ${attempt} de ${MAX_RETRIES} para download do anexo ${
              attachmentIndex + 1
            }/${totalAttachments}`
          );

          const media = await downloadFiles(attachmentUrl);
          logger.info(
            `Download do anexo ${
              attachmentIndex + 1
            }/${totalAttachments} concluído com sucesso na tentativa ${attempt}`
          );
          return media;
        } catch (error) {
          logger.warn(
            `Falha na tentativa ${attempt} de ${MAX_RETRIES} para anexo ${
              attachmentIndex + 1
            }/${totalAttachments}: ${error}`
          );

          if (attempt < MAX_RETRIES) {
            logger.info(
              `Aguardando ${RETRY_DELAY}ms antes da próxima tentativa...`
            );
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return downloadWithRetry(
              attachmentUrl,
              attachmentIndex,
              totalAttachments,
              attempt + 1
            );
          } else {
            logger.error(
              `Todas as ${MAX_RETRIES} tentativas de download falharam para anexo ${
                attachmentIndex + 1
              }/${totalAttachments}`
            );
            throw error;
          }
        }
      };

      try {
        const attachments = HubMessage?.messageData?.[0]?.message?.attachments;

        if (Array.isArray(attachments) && attachments.length > 0) {
          for (let i = 0; i < attachments.length; i++) {
            const attachment = attachments[i];
            const uniqueMessageId = `${messageId}_${i + 1}`;
            const attachmentUrl = attachment.payload.url;

            const media = await downloadWithRetry(
              attachmentUrl,
              i,
              attachments.length
            );

            let mediaType = media.mimeType.split("/")[0];

            // Processar arquivos de áudio
            if (attachment.type === "audio") {
              const inputFile = `./public/${media.filename}`;
              const path = require("path");
              const fileExtension = path.extname(media.filename).toLowerCase();

              if (fileExtension === ".ogg" || fileExtension === ".mp4") {
                const fileNameWithoutExt = inputFile.substring(
                  0,
                  inputFile.length - fileExtension.length
                );
                const outputFile = `${fileNameWithoutExt}.mp3`;

                await convertToMp3(inputFile);
                fs.unlinkSync(inputFile);
                media.filename = outputFile.split("/").pop();
              }

              mediaType = "audio";

              if (!messageText || messageText === "") {
                const inputFile = `./public/${media.filename}`;
                messageText = await createTranscription(
                  inputFile,
                  whatsapp?.tenantId
                );
              }
            } else if (media.mimeType && typeof media.mimeType === "string") {
              mediaType = media.mimeType.split("/")[0];
            } else {
              mediaType = "unknown";
            }

            const messageData = {
              messageId: uniqueMessageId,
              ticketId: ticket.id,
              contactId: fromMe ? undefined : contact.id,
              body: messageText,
              fromMe,
              read: fromMe,
              mediaUrl: media.filename,
              mediaType,
              quotedMsgId,
              timestamp: timestamp || new Date().getTime(),
              status: "received"
            };

            await CreateMessageService({
              messageData,
              tenantId: ticket.tenantId
            });

            if (i === attachments.length - 1) {
              await ticket.update({
                lastMessage: "Media files",
                lastMessageAt: new Date().getTime(),
                answered: fromMe
              });

              socketEmit({
                tenantId: whatsapp.tenantId,
                type: "ticket:update",
                payload: ticket
              });
            }
          }
        }
      } catch (error) {
        logger.error(`Error getting media information: ${error}`);

        const errormedia =
          "*Mensagem do sistema*:\nFalha no download da mídia verifique no dispositivo";

        const messageData = {
          messageId,
          ticketId: ticket.id,
          contactId: fromMe ? undefined : contact.id,
          body: messageText || errormedia,
          fromMe,
          read: fromMe,
          mediaType: "chat",
          quotedMsgId,
          timestamp: timestamp || new Date().getTime(),
          status: "received"
        };

        await ticket.update({
          lastMessage: messageText || errormedia,
          lastMessageAt: new Date().getTime(),
          answered: fromMe
        });

        await CreateMessageService({
          messageData,
          tenantId: ticket.tenantId
        });

        socketEmit({
          tenantId: whatsapp.tenantId,
          type: "ticket:update",
          payload: ticket
        });
      }
    } else {
      const messageBody =
        "*Mensagem do sistema*:\nMensagem recebida não compatível com o sistema, se for necessário ele pode ser obtido no aplicativo do whatsapp.";

      const messageData = {
        messageId,
        ticketId: ticket.id,
        contactId: fromMe ? undefined : contact.id,
        body: messageText || messageBody,
        fromMe,
        read: fromMe,
        mediaType: "chat",
        quotedMsgId,
        timestamp: timestamp || new Date().getTime(),
        status: "received"
      };

      await ticket.update({
        lastMessage: messageText || messageBody,
        lastMessageAt: new Date().getTime(),
        answered: fromMe
      });

      await CreateMessageService({
        messageData,
        tenantId: ticket.tenantId
      });

      socketEmit({
        tenantId: whatsapp.tenantId,
        type: "ticket:update",
        payload: ticket
      });
    }

    if (ticket?.isFarewellMessage) {
      return;
    }

    await VerifyStepsChatFlowTicket(
      {
        fromMe,
        body: messageText || ""
      },
      ticket
    );

    await verifyBusinessHours(
      {
        fromMe,
        timestamp
      },
      ticket
    );
  } catch (error: any) {
    throw error;
    logger.error(`Error ConnectionHubMessageListener Listerner: ${error}`);
  }
};

export default ConnectionHubMessageListener;
