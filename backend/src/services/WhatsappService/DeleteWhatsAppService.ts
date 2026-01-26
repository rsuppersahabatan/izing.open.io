import Whatsapp from "../../models/Whatsapp";
import AppError from "../../errors/AppError";
import UnSetConnectionHubWebHookService from "../WbotConnectionHub/helpers/UnSetConnectionHubWebHookService";

const DeleteWhatsApprService = async (
  id: string,
  tenantId: string | number
): Promise<void> => {
  const whatsapp = await Whatsapp.findOne({
    where: { id, tenantId }
  });

  if (!whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  if (whatsapp.type.startsWith("con_")) {
    await UnSetConnectionHubWebHookService(whatsapp);
  }

  // await whatsapp.update({ isDeleted: true });
  await whatsapp.destroy();
};

export default DeleteWhatsApprService;
