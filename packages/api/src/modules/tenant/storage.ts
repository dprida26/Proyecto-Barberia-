import fs from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env, r2Enabled } from "../../config/env";

const s3Client = r2Enabled
  ? new S3Client({
      region: "auto",
      endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.r2.accessKeyId!,
        secretAccessKey: env.r2.secretAccessKey!,
      },
    })
  : null;

/**
 * Sube un archivo de logo y devuelve su URL publica.
 * Usa Cloudflare R2 si esta configurado (R2_* env vars); si no, guarda en el
 * filesystem local del contenedor api (solo apto para desarrollo, ya que en
 * plataformas como Render el filesystem es efimero entre deploys).
 */
export async function uploadLogo(fileName: string, buffer: Buffer, contentType: string): Promise<string> {
  const key = `logos/${fileName}`;

  if (s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.r2.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return `${env.r2.publicUrl}/${key}`;
  }

  const logosDir = path.join(env.uploadsDir, "logos");
  await fs.mkdir(logosDir, { recursive: true });
  await fs.writeFile(path.join(logosDir, fileName), buffer);
  return `/uploads/logos/${fileName}`;
}

/** Borra un logo previo, dada la URL guardada por uploadLogo. No falla si no existe. */
export async function deleteLogo(logoUrl: string): Promise<void> {
  if (s3Client && env.r2.publicUrl && logoUrl.startsWith(env.r2.publicUrl)) {
    const key = logoUrl.slice(env.r2.publicUrl.length + 1);
    await s3Client
      .send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: key }))
      .catch(() => undefined);
    return;
  }

  if (logoUrl.startsWith("/uploads/")) {
    const filePath = path.join(env.uploadsDir, logoUrl.replace(/^\/uploads\//, ""));
    await fs.unlink(filePath).catch(() => undefined);
  }
}
