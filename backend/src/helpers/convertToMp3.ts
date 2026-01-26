import fs from "fs";
import path from "path";

import ffmpegStatic from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegStatic as string);

export async function convertToMp3(inputFile: string): Promise<string> {
  if (!fs.existsSync(inputFile)) {
    throw new Error(`Arquivo de entrada não encontrado: ${inputFile}`);
  }

  const extension = path.extname(inputFile).toLowerCase();
  if (![".ogg", ".mp4"].includes(extension)) {
    throw new Error("Formato não suportado. Use .ogg ou .mp4");
  }

  const outputFile = inputFile.replace(/\.(ogg|mp4)$/i, ".mp3");

  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .toFormat("mp3")
      .audioBitrate(128)
      .on("start", commandLine => {
        console.log("▶️ FFmpeg iniciado:", commandLine);
      })
      .on("progress", progress => {
        if (progress?.percent) {
          console.log(`⏳ Progresso: ${Math.round(progress.percent)}%`);
        }
      })
      .on("end", () => {
        console.log("✅ Conversão concluída:", outputFile);
        resolve(outputFile);
      })
      .on("error", err => {
        reject(new Error(err?.message || "Erro na conversão para MP3"));
      })
      .save(outputFile);
  });
}

export default convertToMp3;
