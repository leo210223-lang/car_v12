/**
 * FaCai-B Platform - Clean Orphan Images Job
 * File: backend/src/cron/jobs/clean-orphan-images.ts
 * 
 * 每日 04:00 執行 - 清理孤兒圖片
 * 刪除 Storage 中存在但沒有被任何車輛引用的圖片
 */

import { supabaseAdmin } from '../../config/supabase';

const BUCKET_NAME = 'vehicle-images';

/**
 * 清理孤兒圖片任務
 * - 掃描 Storage 中的所有圖片
 * - 比對 vehicles.images 陣列
 * - 刪除未被引用的圖片
 */
export async function cleanOrphanImagesJob(): Promise<void> {
  console.log('[CleanOrphanImages] Starting...');

  try {
    // Step 1: 取得 Storage 中所有車輛資料夾
    const { data: folders, error: listFoldersError } = await supabaseAdmin
      .storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 1000,
        offset: 0,
      });

    if (listFoldersError) {
      console.error('[CleanOrphanImages] List folders error:', listFoldersError);
      throw listFoldersError;
    }

    if (!folders || folders.length === 0) {
      console.log('[CleanOrphanImages] No folders found in bucket');
      return;
    }

    // 過濾出車輛 ID 資料夾（UUID 格式）
    const vehicleFolders = folders.filter((f) => 
      f.name && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(f.name)
    );

    console.log(`[CleanOrphanImages] Found ${vehicleFolders.length} vehicle folders`);

    let totalDeleted = 0;
    let totalErrors = 0;

    // Step 2: 逐一檢查每個車輛資料夾
    for (const folder of vehicleFolders) {
      try {
        const vehicleId = folder.name;
        
        // 檢查車輛是否存在
        const { data: vehicle, error: vehicleError } = await supabaseAdmin
          .from('vehicles')
          .select('id, images')
          .eq('id', vehicleId)
          .single();

        if (vehicleError && vehicleError.code !== 'PGRST116') {
          console.error(`[CleanOrphanImages] Error checking vehicle ${vehicleId}:`, vehicleError);
          totalErrors++;
          continue;
        }

        // 如果車輛不存在，刪除整個資料夾
        if (!vehicle) {
          console.log(`[CleanOrphanImages] Vehicle ${vehicleId} not found, cleaning folder...`);
          
          // 列出資料夾中的所有檔案
          const { data: files, error: listFilesError } = await supabaseAdmin
            .storage
            .from(BUCKET_NAME)
            .list(vehicleId, { limit: 100 });

          if (listFilesError) {
            console.error(`[CleanOrphanImages] List files error for ${vehicleId}:`, listFilesError);
            totalErrors++;
            continue;
          }

          if (files && files.length > 0) {
            const filePaths = files.map((f) => `${vehicleId}/${f.name}`);
            const { error: deleteError } = await supabaseAdmin
              .storage
              .from(BUCKET_NAME)
              .remove(filePaths);

            if (deleteError) {
              console.error(`[CleanOrphanImages] Delete error for ${vehicleId}:`, deleteError);
              totalErrors++;
            } else {
              totalDeleted += files.length;
              console.log(`[CleanOrphanImages] Deleted ${files.length} orphan files from ${vehicleId}`);
            }
          }
          continue;
        }

        // Step 3: 車輛存在，檢查是否有未被引用的圖片
        const { data: files, error: listFilesError } = await supabaseAdmin
          .storage
          .from(BUCKET_NAME)
          .list(vehicleId, { limit: 100 });

        if (listFilesError) {
          console.error(`[CleanOrphanImages] List files error for ${vehicleId}:`, listFilesError);
          totalErrors++;
          continue;
        }

        if (!files || files.length === 0) {
          continue;
        }

        // 取得車輛引用的圖片 URL（提取檔名）
        const vehicleImages = (vehicle.images || []) as string[];
        const referencedFileNames = new Set(
          vehicleImages.map((url) => {
            const parts = url.split('/');
            return parts[parts.length - 1]; // 取得檔名
          })
        );

        // 找出未被引用的檔案
        const orphanFiles = files.filter((f) => !referencedFileNames.has(f.name));

        if (orphanFiles.length > 0) {
          const filePaths = orphanFiles.map((f) => `${vehicleId}/${f.name}`);
          const { error: deleteError } = await supabaseAdmin
            .storage
            .from(BUCKET_NAME)
            .remove(filePaths);

          if (deleteError) {
            console.error(`[CleanOrphanImages] Delete orphan files error for ${vehicleId}:`, deleteError);
            totalErrors++;
          } else {
            totalDeleted += orphanFiles.length;
            console.log(`[CleanOrphanImages] Deleted ${orphanFiles.length} orphan files from ${vehicleId}`);
          }
        }
      } catch (folderError) {
        console.error(`[CleanOrphanImages] Error processing folder ${folder.name}:`, folderError);
        totalErrors++;
        // 繼續處理下一個資料夾
      }
    }

    console.log(`[CleanOrphanImages] Completed: ${totalDeleted} files deleted, ${totalErrors} errors`);
  } catch (error) {
    console.error('[CleanOrphanImages] Job failed:', error);
    throw error;
  }
}

export default cleanOrphanImagesJob;
