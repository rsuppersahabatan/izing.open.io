import OpenAI from "openai";
import fs from "fs";
import CheckSettingsHelper from "./CheckSettings";

async function createTranscription(
  filePath: string,
  tenantId: number
): Promise<string> {
  try {
    const apiKey = await CheckSettingsHelper("openAiKey", tenantId);

   if (!apiKey) {
      console.error("No OpenAI API key found for tenant", tenantId);
      return "";
    }

    const openai = new OpenAI({
      apiKey
    });

    if (!fs.existsSync(filePath)) {
      throw new Error("Audio file not found");
    }

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "gpt-4o-mini-transcribe"
    });

    return transcription.text;
  } catch (error) {
    console.error("Error in audio transcription:", error);
    return "Ocorreu um erro ao tentar transcrever o áudio";
  }
}

export default createTranscription;
