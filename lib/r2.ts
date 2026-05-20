import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

let _client: S3Client | null = null;
function client(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${required("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
  });
  return _client;
}

export const R2_BUCKET = process.env.R2_BUCKET ?? "";
export const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");

export type SignedUploadResult = {
  url: string;
  key: string;
  expiresIn: number;
};

export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300,
): Promise<SignedUploadResult> {
  const cmd = new PutObjectCommand({
    Bucket: required("R2_BUCKET"),
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(client(), cmd, { expiresIn });
  return { url, key, expiresIn };
}

export async function getDownloadUrl(key: string, expiresIn = 300): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: required("R2_BUCKET"), Key: key });
  return getSignedUrl(client(), cmd, { expiresIn });
}

export async function deleteObject(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: required("R2_BUCKET"), Key: key }));
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await client().send(new HeadObjectCommand({ Bucket: required("R2_BUCKET"), Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** Returns a public URL if R2_PUBLIC_BASE_URL is configured, otherwise null. */
export function publicUrl(key: string): string | null {
  if (!R2_PUBLIC_BASE_URL) return null;
  return `${R2_PUBLIC_BASE_URL}/${encodeURI(key)}`;
}

/** Builds the canonical object key for a ticket attachment. */
export function buildAttachmentKey(opts: {
  ticketId: string;
  filename: string;
  uuid: string;
}): string {
  const safe = opts.filename.replace(/[^\w.\-]+/g, "_");
  return `tickets/${opts.ticketId}/${opts.uuid}-${safe}`;
}
