import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

let clientSingleton: S3Client | null = null;

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
}

function readConfig(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucket ||
    !publicBaseUrl
  ) {
    throw new Error(
      "Cloudflare R2 is not fully configured (missing R2_* env vars)",
    );
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl };
}

function getClient(): { client: S3Client; config: R2Config } {
  const config = readConfig();
  if (!clientSingleton) {
    clientSingleton = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return { client: clientSingleton, config };
}

/**
 * Upload a PDF buffer to the configured Cloudflare R2 bucket. Returns the
 * absolute public URL that can be saved on `InvoiceRecord.pdfUrl`.
 */
export async function uploadInvoicePdf(args: {
  key: string;
  body: Uint8Array | Buffer;
  contentType?: string;
}): Promise<{ url: string; key: string }> {
  const { client, config } = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: args.key,
      Body: args.body,
      ContentType: args.contentType ?? "application/pdf",
      CacheControl: "private, max-age=31536000, immutable",
    }),
  );
  const base = config.publicBaseUrl.replace(/\/+$/, "");
  return { url: `${base}/${args.key}`, key: args.key };
}
