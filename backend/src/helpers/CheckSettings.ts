import Setting from "../models/Setting";

const CheckSettings = async (
  key: string,
  tenantId: number
): Promise<string> => {
  const setting = await Setting.findOne({
    where: { key, tenantId }
  });

  return setting?.value ?? "";
};

export default CheckSettings;
