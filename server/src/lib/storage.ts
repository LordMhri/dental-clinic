import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://127.0.0.1:9000'
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'sysadmin'
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'lewi_secure_storage_pass_2026'
export const BUCKET_NAME = process.env.S3_BUCKET || 'dental-assets'

export const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
})

/**
 * Ensures that the required dental storage bucket exists in MinIO.
 */
export async function initStorage(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }))
    console.log(`📦 [sys-storage] MinIO bucket '${BUCKET_NAME}' verified.`)
  } catch {
    try {
      console.log(`📦 [sys-storage] Creating MinIO bucket '${BUCKET_NAME}'...`)
      await s3.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }))
      console.log(`✅ [sys-storage] Bucket '${BUCKET_NAME}' created successfully.`)
    } catch (createErr) {
      console.error(`⚠️ [sys-storage] Failed to ensure bucket:`, createErr)
    }
  }
}

/**
 * Uploads a file buffer directly to MinIO.
 */
export async function uploadToStorage(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )
  return key
}

/**
 * Generates a temporary pre-signed URL to view or download a file from MinIO.
 */
export async function getFileDownloadUrl(key: string, expiresInSeconds = 7200): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds })
}

/**
 * Deletes an object from MinIO.
 */
export async function deleteFromStorage(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  )
}

/**
 * Retrieves an object stream directly from MinIO.
 */
export async function getFileStream(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })
  return s3.send(command)
}
