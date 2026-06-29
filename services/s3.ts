import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IntegrationConfigError } from "@/lib/errors";

let s3Client: S3Client | null = null;

function getS3Config() {
  const required = ["AWS_REGION", "AWS_S3_BUCKET", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"] as const;
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new IntegrationConfigError("AWS S3", missing);
  }

  return {
    region: process.env.AWS_REGION!,
    bucket: process.env.AWS_S3_BUCKET!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  };
}

function getS3() {
  const config = getS3Config();
  s3Client ??= new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });

  return { s3: s3Client, bucket: config.bucket, region: config.region };
}

export function buildFileKey(organizationId: string, projectId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  return `${organizationId}/projects/${projectId}/${crypto.randomUUID()}-${safeName}`;
}

export async function createUploadUrl(params: {
  key: string;
  contentType: string;
  expiresIn?: number;
}) {
  const { s3, bucket } = getS3();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType
  });

  return getSignedUrl(s3, command, { expiresIn: params.expiresIn ?? 900 });
}

export async function createDownloadUrl(key: string, expiresIn = 300) {
  const { s3, bucket } = getS3();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  });

  return getSignedUrl(s3, command, { expiresIn });
}

export function publicS3Url(key: string) {
  const { bucket, region } = getS3();
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
