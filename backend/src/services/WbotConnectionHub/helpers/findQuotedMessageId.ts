import Message from "../../../models/Message";
import { logger } from "../../../utils/logger";

/**
 * Checks if a message has a quoted message ID
 * If found, searches for the referenced message ID in the database
 *
 * @param message - The incoming message object
 * @returns Promise<string|null> - Returns the original message ID if found, null otherwise
 */
const findQuotedMessageId = async (apiMessage: any): Promise<string | null> => {
  try {
    let referenceId = null;

    // Extract quoted message ID from the new format
    if (apiMessage.messageData?.[0]?.reaction?.mid) {
      referenceId = apiMessage.messageData?.[0]?.reaction?.mid;
    }

    // If we found a reference ID, search for it in the database
    if (referenceId) {
      const referencedMessage = await Message.findOne({
        where: { messageId: referenceId }
      });
      return referencedMessage ? referencedMessage.id : null;
    }

    // No reference found
    return null;
  } catch (error) {
    logger.error(`Error finding quoted message: ${error}`);
    return null;
  }
};

export default findQuotedMessageId;
