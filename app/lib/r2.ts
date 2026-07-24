import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

function getR2Client(): S3Client {
  if (client) return client;

  const accountEndpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountEndpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing CLOUDFLARE_R2_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY_ID, or CLOUDFLARE_R2_SECRET_ACCESS_KEY"
    );
  }

  client = new S3Client({
    region: "auto",
    endpoint: accountEndpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  return client;
}

function getBucket(): string {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  if (!bucket) throw new Error("Missing CLOUDFLARE_R2_BUCKET environment variable");
  return bucket;
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const s3 = getR2Client();
  await s3.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function downloadFromR2(key: string): Promise<Buffer> {
  const s3 = getR2Client();
  const result = await s3.send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key })
  );
  const bytes = await result.Body?.transformToByteArray();
  if (!bytes) throw new Error(`R2 object not found or empty: ${key}`);
  return Buffer.from(bytes);
}

/** Public URL for a stored object - requires the bucket's public dev URL or custom domain. */
export function getR2PublicUrl(key: string): string {
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error("Missing CLOUDFLARE_R2_PUBLIC_URL environment variable");
  }
  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}
