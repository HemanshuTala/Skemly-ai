import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import logger from '../utils/logger';

class S3Service {
  private s3Client: S3Client | null = null;
  private bucketName: string = '';

  constructor() {
    this.initializeS3();
  }

  private initializeS3(): void {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-east-1';
    this.bucketName = process.env.AWS_S3_BUCKET || '';

    if (accessKeyId && secretAccessKey && 
        accessKeyId !== 'your-aws-access-key' && 
        secretAccessKey !== 'your-aws-secret-key') {
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        maxAttempts: 5,
        requestHandler: new NodeHttpHandler({
          connectionTimeout: 10_000,
          socketTimeout: 120_000,
        }),
      });
      logger.info('✅ AWS S3 Service initialized');
    } else {
      logger.warn('⚠️  AWS S3 Service not configured - S3 storage disabled');
    }
  }

  isAvailable(): boolean {
    return this.s3Client !== null;
  }

  async uploadFile(
    buffer: Buffer,
    key: string,
    format: string
  ): Promise<void> {
    if (!this.s3Client) {
      throw new Error('S3 not configured');
    }

    const contentType = {
      png: 'image/png',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
    }[format] || 'application/octet-stream';

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
  }

  async getPresignedUrl(key: string, expiresInSeconds: number = 15 * 60): Promise<string> {
    if (!this.s3Client) return '';

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }
}

export const s3Service = new S3Service();
