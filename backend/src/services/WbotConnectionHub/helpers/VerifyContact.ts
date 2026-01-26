import Contact from "../../../models/Contact";
import Whatsapp from "../../../models/Whatsapp";
import CreateOrUpdateContactService from "../../ContactServices/CreateOrUpdateContactService";
import connectionHubConfig from "./connectionHubConfig";
import { cacheLayer } from "../../../libs/cache";

export const VerifyContactFacebook = async (
  contactId: string,
  whatsapp: Whatsapp
): Promise<Contact> => {
  const cacheKey = `contactInfo:${contactId}@facebook`;
  const cachedData = await cacheLayer.get(cacheKey);
  let profile;

  if (cachedData) {
    profile = JSON.parse(cachedData);
  } else {
    const client = await connectionHubConfig(whatsapp?.tenantId!);
    const response = await client.messaging.getProfileFacebook(whatsapp.tokenAPI, contactId);
    profile = response.profile;
    await cacheLayer.set(cacheKey, JSON.stringify(profile), "EX", 60 * 60 * 24 * 5);
  }

  const contactData = {
    name: profile?.name || "",
    number: "",
    profilePicUrl: profile?.profile_pic || profile?.picture || "",
    tenantId: whatsapp.tenantId,
    pushname: profile?.name || "",
    isUser: true,
    isWAContact: false,
    isGroup: false,
    origem: "messenger",
    messengerId: contactId
  };

  const contact = await CreateOrUpdateContactService(contactData);

  return contact;
};

export const VerifyContactInstagram = async (
  contactId: string,
  whatsapp: Whatsapp
): Promise<Contact> => {
  const cacheKey = `contactInfo:${contactId}@instagram`;
  const cachedData = await cacheLayer.get(cacheKey);
  let profile;

  if (cachedData) {
    profile = JSON.parse(cachedData);
  } else {
    const client = await connectionHubConfig(whatsapp?.tenantId!);
    const response = await client.messaging.getProfileInstagram(whatsapp.tokenAPI, contactId);
    profile = response.profile;
    await cacheLayer.set(cacheKey, JSON.stringify(profile), "EX", 60 * 60 * 24 * 5);
  }

  const contactData = {
    name: profile?.name || "",
    number: "",
    profilePicUrl: profile?.profile_pic || profile?.picture || "",
    tenantId: whatsapp.tenantId,
    pushname: profile?.name || "",
    isUser: true,
    isWAContact: false,
    isGroup: false,
    origem: "instagram",
    instagramPK: Number(contactId)
  };

  const contact = await CreateOrUpdateContactService(contactData);

  return contact;
};
