import CheckSettingsHelper from "../../../helpers/CheckSettings";
const {
  ConnectionHubClient,
  ConnectionHubConfig
} = require("@connection-hub/sdk");

const connectionHubConfig = async (
  tenantId: number
): Promise<typeof ConnectionHubClient> => {
  const connectionHubAccountKey = await CheckSettingsHelper(
    "ConnectionHubToken",
    tenantId
  );

  if (!connectionHubAccountKey) {
    throw new Error('CONNECTIONHUB_TOKEN_NOT_FOUND"');
  }

  const config: typeof ConnectionHubConfig = {
    accessToken: connectionHubAccountKey
  };

  const client = new ConnectionHubClient(config);
  await client.waitForValidation();
  return client;
};

export default connectionHubConfig;
