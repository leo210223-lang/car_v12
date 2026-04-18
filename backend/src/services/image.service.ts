/**
 * FaCai-B Platform - Image Service
 * File: backend/src/services/image.service.ts
 * 
 * 圖片壓縮、上傳與管理服務
 */

import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../config/supabase';

// ============================================================================
// Types
// ============================================================================

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface ImageUploadResult {
  url: string;
  path: string;
  filename: string;
}

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: ImageCompressionOptions = {
  maxWidth: 1200,
  maxHeight: 800,
  quality: 80,
  format: 'webp',
};

const BUCKET_NAME = 'vehicle-images';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================================================
// Image Service
// ============================================================================

export const imageService = {
  /**
   * 壓縮圖片為 WebP 格式
   */
  async compress(
    buffer: Buffer,
    options: ImageCompressionOptions = {}
  ): Promise<ServiceResult<Buffer>> {
    try {
      const opts = { ...DEFAULT_OPTIONS, ...options };

      let pipeline = sharp(buffer);

      // 自動旋轉（依據 EXIF）
      pipeline = pipeline.rotate();

      // 調整大小，保持比例
      pipeline = pipeline.resize({
        width: opts.maxWidth,
        height: opts.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      });

      // 轉換格式
      if (opts.format === 'webp') {
        pipeline = pipeline.webp({ quality: opts.quality });
      } else if (opts.format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality: opts.quality });
      } else if (opts.format === 'png') {
        pipeline = pipeline.png({ quality: opts.quality });
      }

      const compressedBuffer = await pipeline.toBuffer();

      return { success: true, data: compressedBuffer };
    } catch (err) {
      console.error('[ImageService] Compress error:', err);
      return {
        success: false,
        error: { code: 'COMPRESSION_FAILED', message: '圖片壓縮失敗' },
      };
    }
  },

  /**
   * 驗證圖片檔案
   */
  validateFile(
    mimeType: string,
    size: number
  ): ServiceResult<void> {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: `不支援的檔案格式，允許: ${ALLOWED_MIME_TYPES.join(', ')}`,
        },
      };
    }

    if (size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `檔案大小超過限制 (最大 ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
        },
      };
    }

    return { success: true };
  },

  /**
   * 上傳圖片到 Supabase Storage
   */
  async upload(
    vehicleId: string,
    buffer: Buffer,
    _originalFilename?: string
  ): Promise<ServiceResult<ImageUploadResult>> {
    try {
      // 生成唯一檔案名稱
      const filename = `${randomUUID()}.webp`;
      const path = `${vehicleId}/${filename}`;

      // 先壓縮
      const compressResult = await this.compress(buffer);
      if (!compressResult.success) {
        return {
          success: false,
          error: compressResult.error,
        };
      }

      // 上傳到 Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(path, compressResult.data!, {
          contentType: 'image/webp',
          cacheControl: '31536000', // 1 年快取
          upsert: false,
        });

      if (error) {
        console.error('[ImageService] Upload error:', error);
        return {
          success: false,
          error: { code: 'UPLOAD_FAILED', message: error.message },
        };
      }

      // 取得公開 URL
      const { data: urlData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);

      return {
        success: true,
        data: {
          url: urlData.publicUrl,
          path: data.path,
          filename,
        },
      };
    } catch (err) {
      console.error('[ImageService] Upload exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '上傳圖片失敗' },
      };
    }
  },

  /**
   * 刪除單一圖片
   */
  async delete(
    path: string
  ): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove([path]);

      if (error) {
        console.error('[ImageService] Delete error:', error);
        return {
          success: false,
          error: { code: 'DELETE_FAILED', message: error.message },
        };
      }

      return { success: true };
    } catch (err) {
      console.error('[ImageService] Delete exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '刪除圖片失敗' },
      };
    }
  },

  /**
   * 批次刪除圖片
   */
  async deleteMany(
    paths: string[]
  ): Promise<ServiceResult<{ deleted: string[]; failed: string[] }>> {
    try {
      if (paths.length === 0) {
        return {
          success: true,
          data: { deleted: [], failed: [] },
        };
      }

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove(paths);

      if (error) {
        console.error('[ImageService] DeleteMany error:', error);
        return {
          success: false,
          error: { code: 'DELETE_FAILED', message: error.message },
        };
      }

      // 回傳成功刪除的檔案列表
      const deletedPaths = data?.map((item) => item.name) || [];

      return {
        success: true,
        data: {
          deleted: deletedPaths,
          failed: paths.filter((p) => !deletedPaths.includes(p)),
        },
      };
    } catch (err) {
      console.error('[ImageService] DeleteMany exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '批次刪除圖片失敗' },
      };
    }
  },

  /**
   * 列出車輛的所有圖片
   */
  async listByVehicle(
    vehicleId: string
  ): Promise<ServiceResult<string[]>> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list(vehicleId, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'asc' },
        });

      if (error) {
        console.error('[ImageService] List error:', error);
        return {
          success: false,
          error: { code: 'LIST_FAILED', message: error.message },
        };
      }

      const paths = data
        .filter((item) => item.name.endsWith('.webp'))
        .map((item) => `${vehicleId}/${item.name}`);

      return { success: true, data: paths };
    } catch (err) {
      console.error('[ImageService] List exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '列出圖片失敗' },
      };
    }
  },

  /**
   * 刪除車輛的所有圖片
   */
  async deleteAllByVehicle(
    vehicleId: string
  ): Promise<ServiceResult<number>> {
    try {
      // 先列出所有檔案
      const listResult = await this.listByVehicle(vehicleId);
      if (!listResult.success) {
        return {
          success: false,
          error: listResult.error,
        };
      }

      if (listResult.data!.length === 0) {
        return { success: true, data: 0 };
      }

      // 批次刪除
      const deleteResult = await this.deleteMany(listResult.data!);
      if (!deleteResult.success) {
        return {
          success: false,
          error: deleteResult.error,
        };
      }

      return { success: true, data: deleteResult.data!.deleted.length };
    } catch (err) {
      console.error('[ImageService] DeleteAllByVehicle exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '刪除車輛圖片失敗' },
      };
    }
  },

  /**
   * 更新車輛的圖片列表（同步到 DB）
   */
  async syncVehicleImages(
    vehicleId: string
  ): Promise<ServiceResult<string[]>> {
    try {
      // 列出 Storage 中的圖片
      const listResult = await this.listByVehicle(vehicleId);
      if (!listResult.success) {
        return {
          success: false,
          error: listResult.error,
        };
      }

      // 轉換為公開 URL
      const urls = listResult.data!.map((path) => {
        const { data } = supabaseAdmin.storage
          .from(BUCKET_NAME)
          .getPublicUrl(path);
        return data.publicUrl;
      });

      // 更新 DB
      const { error } = await supabaseAdmin
        .from('vehicles')
        .update({ images: urls })
        .eq('id', vehicleId);

      if (error) {
        console.error('[ImageService] SyncImages error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: urls };
    } catch (err) {
      console.error('[ImageService] SyncImages exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '同步圖片失敗' },
      };
    }
  },
};

export default imageService;
