import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { preferences } from "./global";
import FormData from "form-data";
import https from "https";
import { showHUD } from "@raycast/api";

async function addFile(filename: string, file: string | Buffer) {
  const params = new FormData();
  params.append("torrent_file", file, { filename, contentType: "application/x-bittorrent" });

  return new Promise((resolve, reject) => {
    try {
      const auth = Buffer.from(`${preferences.username}:${preferences.password || ""}`).toString("base64");

      const req = https.request(
        `https://${preferences.host}:${preferences.port}${preferences.path}/php/addtorrent.php`,
        {
          method: "POST",
          headers: {
            authorization: `Basic ${auth}`,
            ...params.getHeaders(),
          },
          rejectUnauthorized: false,
        },
        (res) => {
          console.log("Done");
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            console.log("finally");
            if (res.statusCode === 200) {
              resolve(JSON.parse(data));
            }else if (res.statusCode === 302) {
              resolve(true);
            } else {
              reject(new Error(`Status: ${res.statusCode}`));
            }
          });
        }
      );

      req.on("error", (error) => {
        console.error("Erreur requête:", error);
        reject(error);
      });

      params.pipe(req);
    } catch (error) {
      console.error("Erreur dans addFile:", error);
      reject(error);
    }
  });
}

async function uploadAndRenameTorrent(downloadsPath: string, file: string) {
  const oldPath = path.join(downloadsPath, file);
  console.log(oldPath);

  try {
    const fileBuffer = await fs.readFile(oldPath);
    await addFile(file, fileBuffer).then(console.log).catch(console.error);
    await fs.rename(oldPath, path.join(downloadsPath, `${file}.done`));
    await showHUD(`Raycast Torrent uploader, ${file} uploaded successfully`);
  } catch (err) {
    await fs.rename(oldPath, path.join(downloadsPath, `${file}.error`));
    console.error(err);
    await showHUD(`Raycast Torrent uploader, ${file} error`);
  }
}

const process = async () => {
  const downloadsPath = path.join(os.homedir(), "Downloads");

  const files = await fs.readdir(downloadsPath);

  const torrentFiles = files.filter((file) => file.endsWith(".torrent"));

  if (torrentFiles.length === 0) {
    return;
  }

  for (const file of torrentFiles) {
    await uploadAndRenameTorrent(downloadsPath, file);
  }
};
export default function Script() {
  process().then();
}
