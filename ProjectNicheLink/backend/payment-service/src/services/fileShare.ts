import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import path from 'path';
import fs from 'fs/promises';

export interface SharedFile {
  id: string;
  uploaderId: string;
  campaignId?: string;
  milestoneId?: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  fileType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'ARCHIVE' | 'OTHER';
  url: string;
  thumbnailUrl?: string;
  description?: string;
  tags: string[];
  isPublic: boolean;
  downloadCount: number;
  version: number;
  parentFileId?: string; // For file versions
  metadata?: FileMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileMetadata {
  dimensions?: { width: number; height: number };
  duration?: number; // For video/audio files
  pages?: number; // For documents
  compression?: string;
  colorSpace?: string;
  location?: { lat: number; lng: number };
  camera?: {
    make?: string;
    model?: string;
    settings?: Record<string, any>;
  };
}

export interface FilePermission {
  id: string;
  fileId: string;
  userId: string;
  permission: 'VIEW' | 'DOWNLOAD' | 'EDIT' | 'DELETE' | 'SHARE';
  grantedBy: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface ContentGallery {
  id: string;
  campaignId: string;
  title: string;
  description?: string;
  type: 'CAMPAIGN_ASSETS' | 'SUBMITTED_CONTENT' | 'APPROVED_CONTENT' | 'REFERENCES' | 'TEMPLATES';
  files: SharedFile[];
  totalFiles: number;
  totalSize: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileUploadResult {
  file: SharedFile;
  uploadUrl?: string; // For direct upload scenarios
  success: boolean;
  message?: string;
}

export interface FileAnalytics {
  totalFiles: number;
  totalSize: number;
  filesByType: Record<string, number>;
  popularFiles: Array<{
    file: SharedFile;
    downloadCount: number;
    viewCount: number;
  }>;
  storageUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
  recentActivity: Array<{
    action: string;
    fileId: string;
    fileName: string;
    userId: string;
    timestamp: Date;
  }>;
}

export class FileShareService {
  private prisma: PrismaClient;
  private uploadPath: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default
    this.allowedMimeTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Videos
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      // Documents
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      // Archives
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
    ];
  }

  // Upload file
  async uploadFile(
    uploaderId: string,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
    options: {
      campaignId?: string;
      milestoneId?: string;
      description?: string;
      tags?: string[];
      isPublic?: boolean;
    } = {}
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      const filePath = path.join(this.uploadPath, uniqueFilename);

      // Ensure upload directory exists
      await fs.mkdir(this.uploadPath, { recursive: true });

      // Save file to disk
      await fs.writeFile(filePath, file.buffer);

      // Determine file type
      const fileType = this.getFileType(file.mimetype);

      // Extract metadata
      const metadata = await this.extractMetadata(filePath, file.mimetype);

      // Generate thumbnail for images/videos
      let thumbnailUrl: string | undefined;
      if (fileType === 'IMAGE' || fileType === 'VIDEO') {
        thumbnailUrl = await this.generateThumbnail(filePath, fileType);
      }

      // Create file record in database
      const sharedFile: any = await (this.prisma as any).sharedFile.create({
        data: {
          uploaderId,
          campaignId: options.campaignId,
          milestoneId: options.milestoneId,
          filename: uniqueFilename,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          fileType,
          url: `/uploads/${uniqueFilename}`,
          thumbnailUrl,
          description: options.description,
          tags: options.tags || [],
          isPublic: options.isPublic || false,
          downloadCount: 0,
          version: 1,
          metadata: metadata || {}
        }
      });

      // Log file upload activity
      await this.logFileActivity('UPLOAD', sharedFile.id, uploaderId);

      return {
        file: this.mapPrismaFileToSharedFile(sharedFile),
        success: true,
        message: 'File uploaded successfully'
      };
    } catch (error) {
      console.error('Upload file failed:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('File upload failed', 500, 'UPLOAD_FAILED');
    }
  }

  // Get files by campaign
  async getCampaignFiles(
    campaignId: string, 
    userId: string, 
    filters: {
      fileType?: string;
      tags?: string[];
      searchQuery?: string;
      sortBy?: 'name' | 'date' | 'size' | 'downloads';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ files: SharedFile[]; total: number; hasMore: boolean }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const whereClause: any = {
        campaignId,
        OR: [
          { isPublic: true },
          { uploaderId: userId },
          {
            permissions: {
              some: {
                userId,
                permission: { in: ['VIEW', 'DOWNLOAD', 'EDIT'] }
              }
            }
          }
        ]
      };

      if (filters.fileType) {
        whereClause.fileType = filters.fileType;
      }

      if (filters.tags && filters.tags.length > 0) {
        whereClause.tags = {
          hasSome: filters.tags
        };
      }

      if (filters.searchQuery) {
        whereClause.OR = [
          { originalName: { contains: filters.searchQuery, mode: 'insensitive' } },
          { description: { contains: filters.searchQuery, mode: 'insensitive' } },
          { tags: { hasSome: [filters.searchQuery] } }
        ];
      }

      // Build order by clause
      let orderBy: any = { createdAt: 'desc' };
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'name':
            orderBy = { originalName: filters.sortOrder || 'asc' };
            break;
          case 'date':
            orderBy = { createdAt: filters.sortOrder || 'desc' };
            break;
          case 'size':
            orderBy = { fileSize: filters.sortOrder || 'desc' };
            break;
          case 'downloads':
            orderBy = { downloadCount: filters.sortOrder || 'desc' };
            break;
        }
      }

      const [files, total]: any[] = await Promise.all([
        (this.prisma as any).sharedFile.findMany({
          where: whereClause,
          include: {
            uploader: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy,
          skip,
          take: limit
        }),
        (this.prisma as any).sharedFile.count({ where: whereClause })
      ]);

      return {
        files: files.map((file: any) => this.mapPrismaFileToSharedFile(file)),
        total,
        hasMore: skip + files.length < total
      };
    } catch (error) {
      console.error('Get campaign files failed:', error);
      throw error;
    }
  }

  // Download file
  async downloadFile(fileId: string, userId: string): Promise<{ filePath: string; filename: string }> {
    try {
      const file: any = await (this.prisma as any).sharedFile.findUnique({
        where: { id: fileId },
        include: {
          permissions: {
            where: { userId }
          }
        }
      });

      if (!file) {
        throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
      }

      // Check permissions
      const hasPermission = file.isPublic || 
                           file.uploaderId === userId ||
                           file.permissions.some((p: any) => 
                             ['VIEW', 'DOWNLOAD', 'EDIT'].includes(p.permission)
                           );

      if (!hasPermission) {
        throw new AppError('No permission to download this file', 403, 'NO_DOWNLOAD_PERMISSION');
      }

      // Increment download count
      await (this.prisma as any).sharedFile.update({
        where: { id: fileId },
        data: { downloadCount: { increment: 1 } }
      });

      // Log download activity
      await this.logFileActivity('DOWNLOAD', fileId, userId);

      const filePath = path.join(this.uploadPath, file.filename);
      return {
        filePath,
        filename: file.originalName
      };
    } catch (error) {
      console.error('Download file failed:', error);
      throw error;
    }
  }

  // Create content gallery
  async createContentGallery(
    campaignId: string,
    creatorId: string,
    galleryData: {
      title: string;
      description?: string;
      type: 'CAMPAIGN_ASSETS' | 'SUBMITTED_CONTENT' | 'APPROVED_CONTENT' | 'REFERENCES' | 'TEMPLATES';
      fileIds?: string[];
      isPublic?: boolean;
    }
  ): Promise<ContentGallery> {
    try {
      const gallery: any = await (this.prisma as any).contentGallery.create({
        data: {
          campaignId,
          title: galleryData.title,
          description: galleryData.description,
          type: galleryData.type,
          isPublic: galleryData.isPublic || false,
          createdBy: creatorId
        },
        include: {
          files: {
            include: {
              uploader: {
                select: { id: true, name: true, avatar: true }
              }
            }
          }
        }
      });

      // Add files to gallery if provided
      if (galleryData.fileIds && galleryData.fileIds.length > 0) {
        await (this.prisma as any).galleryFile.createMany({
          data: galleryData.fileIds.map(fileId => ({
            galleryId: gallery.id,
            fileId
          }))
        });
      }

      return this.mapPrismaGalleryToContentGallery(gallery);
    } catch (error) {
      console.error('Create content gallery failed:', error);
      throw error;
    }
  }

  // Get content galleries for campaign
  async getCampaignGalleries(campaignId: string, userId: string): Promise<ContentGallery[]> {
    try {
      const galleries: any[] = await (this.prisma as any).contentGallery.findMany({
        where: {
          campaignId,
          OR: [
            { isPublic: true },
            { createdBy: userId }
          ]
        },
        include: {
          files: {
            include: {
              file: {
                include: {
                  uploader: {
                    select: { id: true, name: true, avatar: true }
                  }
                }
              }
            }
          },
          _count: {
            select: { files: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return galleries.map(gallery => this.mapPrismaGalleryToContentGallery(gallery));
    } catch (error) {
      console.error('Get campaign galleries failed:', error);
      throw error;
    }
  }

  // Share file with user
  async shareFile(
    fileId: string,
    sharerId: string,
    targetUserId: string,
    permission: 'VIEW' | 'DOWNLOAD' | 'EDIT' = 'VIEW',
    expiresAt?: Date
  ): Promise<FilePermission> {
    try {
      const file: any = await (this.prisma as any).sharedFile.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
      }

      if (file.uploaderId !== sharerId) {
        throw new AppError('Only file owner can share files', 403, 'NOT_FILE_OWNER');
      }

      const filePermission: any = await (this.prisma as any).filePermission.upsert({
        where: {
          fileId_userId: {
            fileId,
            userId: targetUserId
          }
        },
        update: {
          permission,
          expiresAt,
          updatedAt: new Date()
        },
        create: {
          fileId,
          userId: targetUserId,
          permission,
          grantedBy: sharerId,
          expiresAt
        }
      });

      // Log share activity
      await this.logFileActivity('SHARE', fileId, sharerId, { targetUserId, permission });

      return this.mapPrismaPermissionToFilePermission(filePermission);
    } catch (error) {
      console.error('Share file failed:', error);
      throw error;
    }
  }

  // Get file analytics
  async getFileAnalytics(campaignId?: string, userId?: string): Promise<FileAnalytics> {
    try {
      const whereClause: any = {};
      
      if (campaignId) {
        whereClause.campaignId = campaignId;
      }
      
      if (userId) {
        whereClause.uploaderId = userId;
      }

      const [files, recentActivity]: any[] = await Promise.all([
        (this.prisma as any).sharedFile.findMany({
          where: whereClause,
          include: {
            uploader: { select: { id: true, name: true } }
          }
        }),
        (this.prisma as any).fileActivity.findMany({
          where: campaignId ? { file: { campaignId } } : userId ? { userId } : {},
          include: {
            file: { select: { id: true, originalName: true } },
            user: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        })
      ]);

      const totalFiles = files.length;
      const totalSize = files.reduce((sum: number, file: any) => sum + file.fileSize, 0);

      const filesByType = files.reduce((acc: Record<string, number>, file: any) => {
        acc[file.fileType] = (acc[file.fileType] || 0) + 1;
        return acc;
      }, {});

      const popularFiles = files
        .sort((a: any, b: any) => b.downloadCount - a.downloadCount)
        .slice(0, 10)
        .map((file: any) => ({
          file: this.mapPrismaFileToSharedFile(file),
          downloadCount: file.downloadCount,
          viewCount: file.viewCount || 0
        }));

      // Calculate storage usage (example limits)
      const storageLimit = campaignId ? 1024 * 1024 * 1024 * 5 : 1024 * 1024 * 1024 * 2; // 5GB for campaigns, 2GB for users
      const storageUsage = {
        used: totalSize,
        limit: storageLimit,
        percentage: (totalSize / storageLimit) * 100
      };

      return {
        totalFiles,
        totalSize,
        filesByType,
        popularFiles,
        storageUsage,
        recentActivity: recentActivity.map((activity: any) => ({
          action: activity.action,
          fileId: activity.fileId,
          fileName: activity.file?.originalName || 'Unknown',
          userId: activity.userId,
          timestamp: new Date(activity.createdAt)
        }))
      };
    } catch (error) {
      console.error('Get file analytics failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private validateFile(file: { mimetype: string; size: number }): void {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new AppError('File type not allowed', 400, 'INVALID_FILE_TYPE');
    }

    if (file.size > this.maxFileSize) {
      throw new AppError('File size exceeds limit', 400, 'FILE_TOO_LARGE');
    }
  }

  private getFileType(mimeType: string): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'ARCHIVE' | 'OTHER' {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    if (mimeType.includes('pdf') || mimeType.includes('document') || 
        mimeType.includes('word') || mimeType.includes('excel') || 
        mimeType.includes('powerpoint') || mimeType.includes('text/')) return 'DOCUMENT';
    if (mimeType.includes('zip') || mimeType.includes('rar') || 
        mimeType.includes('7z') || mimeType.includes('tar')) return 'ARCHIVE';
    return 'OTHER';
  }

  private async extractMetadata(filePath: string, mimeType: string): Promise<FileMetadata | null> {
    try {
      // This would typically use libraries like sharp, ffprobe, etc.
      // For now, return basic metadata
      const stats = await fs.stat(filePath);
      
      const metadata: FileMetadata = {};
      
      if (mimeType.startsWith('image/')) {
        // Would use sharp or similar to get image dimensions
        metadata.dimensions = { width: 0, height: 0 };
      }
      
      if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
        // Would use ffprobe to get duration
        metadata.duration = 0;
      }

      return metadata;
    } catch (error) {
      console.error('Extract metadata failed:', error);
      return null;
    }
  }

  private async generateThumbnail(filePath: string, fileType: 'IMAGE' | 'VIDEO'): Promise<string | undefined> {
    try {
      // This would typically use sharp for images or ffmpeg for videos
      // For now, return a placeholder
      const thumbnailFilename = `thumb_${path.basename(filePath, path.extname(filePath))}.jpg`;
      return `/thumbnails/${thumbnailFilename}`;
    } catch (error) {
      console.error('Generate thumbnail failed:', error);
      return undefined;
    }
  }

  private async logFileActivity(
    action: string, 
    fileId: string, 
    userId: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await (this.prisma as any).fileActivity.create({
        data: {
          action,
          fileId,
          userId,
          metadata: metadata || {}
        }
      });
    } catch (error) {
      console.error('Log file activity failed:', error);
      // Don't throw error as this is not critical
    }
  }

  // Helper methods to map Prisma objects to interfaces
  private mapPrismaFileToSharedFile(prismaFile: any): SharedFile {
    const mapped: any = {
      id: prismaFile.id,
      uploaderId: prismaFile.uploaderId,
      filename: prismaFile.filename,
      originalName: prismaFile.originalName,
      fileSize: prismaFile.fileSize,
      mimeType: prismaFile.mimeType,
      fileType: prismaFile.fileType,
      url: prismaFile.url,
      tags: prismaFile.tags || [],
      isPublic: prismaFile.isPublic,
      downloadCount: prismaFile.downloadCount,
      version: prismaFile.version,
      createdAt: new Date(prismaFile.createdAt),
      updatedAt: new Date(prismaFile.updatedAt)
    };

    // Add optional fields only if they exist
    if (prismaFile.campaignId) mapped.campaignId = prismaFile.campaignId;
    if (prismaFile.milestoneId) mapped.milestoneId = prismaFile.milestoneId;
    if (prismaFile.thumbnailUrl) mapped.thumbnailUrl = prismaFile.thumbnailUrl;
    if (prismaFile.description) mapped.description = prismaFile.description;
    if (prismaFile.parentFileId) mapped.parentFileId = prismaFile.parentFileId;
    if (prismaFile.metadata) mapped.metadata = prismaFile.metadata;

    return mapped as SharedFile;
  }

  private mapPrismaGalleryToContentGallery(prismaGallery: any): ContentGallery {
    const files = prismaGallery.files?.map((gf: any) => this.mapPrismaFileToSharedFile(gf.file)) || [];
    const totalSize = files.reduce((sum: number, file: SharedFile) => sum + file.fileSize, 0);

    const mapped: any = {
      id: prismaGallery.id,
      campaignId: prismaGallery.campaignId,
      title: prismaGallery.title,
      type: prismaGallery.type,
      files,
      totalFiles: files.length,
      totalSize,
      isPublic: prismaGallery.isPublic,
      createdBy: prismaGallery.createdBy,
      createdAt: new Date(prismaGallery.createdAt),
      updatedAt: new Date(prismaGallery.updatedAt)
    };

    if (prismaGallery.description) {
      mapped.description = prismaGallery.description;
    }

    return mapped as ContentGallery;
  }

  private mapPrismaPermissionToFilePermission(prismaPermission: any): FilePermission {
    const mapped: any = {
      id: prismaPermission.id,
      fileId: prismaPermission.fileId,
      userId: prismaPermission.userId,
      permission: prismaPermission.permission,
      grantedBy: prismaPermission.grantedBy,
      createdAt: new Date(prismaPermission.createdAt)
    };

    if (prismaPermission.expiresAt) {
      mapped.expiresAt = new Date(prismaPermission.expiresAt);
    }

    return mapped as FilePermission;
  }

  // Delete file
  async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      const file: any = await (this.prisma as any).sharedFile.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
      }

      if (file.uploaderId !== userId) {
        throw new AppError('Only file owner can delete files', 403, 'NOT_FILE_OWNER');
      }

      // Delete physical file
      const filePath = path.join(this.uploadPath, file.filename);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Failed to delete physical file:', error);
      }

      // Delete thumbnail if exists
      if (file.thumbnailUrl) {
        const thumbnailPath = path.join(this.uploadPath, '../thumbnails', path.basename(file.thumbnailUrl));
        try {
          await fs.unlink(thumbnailPath);
        } catch (error) {
          console.error('Failed to delete thumbnail:', error);
        }
      }

      // Delete from database
      await (this.prisma as any).sharedFile.delete({
        where: { id: fileId }
      });

      // Log delete activity
      await this.logFileActivity('DELETE', fileId, userId);
    } catch (error) {
      console.error('Delete file failed:', error);
      throw error;
    }
  }
}

export default FileShareService;
