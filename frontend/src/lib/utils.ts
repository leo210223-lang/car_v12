import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合併 Tailwind CSS 類名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化價格（加入千分位）
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * 格式化價格（簡短格式：萬元）
 */
export function formatPriceShort(price: number): string {
  if (price >= 10000) {
    return `${Math.floor(price / 10000)} 萬`;
  }
  return formatPrice(price);
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化相對時間
 */
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return '剛剛';
  if (diffMins < 60) return `${diffMins} 分鐘前`;
  if (diffHours < 24) return `${diffHours} 小時前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`;
  
  return formatDate(date);
}

/**
 * 格式化電話號碼
 */
export function formatPhone(phone: string): string {
  // 將 0912345678 格式化為 0912-345-678
  if (phone.length === 10 && phone.startsWith('09')) {
    return `${phone.slice(0, 4)}-${phone.slice(4, 7)}-${phone.slice(7)}`;
  }
  return phone;
}

/**
 * 截斷文字
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 取得車輛完整名稱
 */
export function getVehicleFullName(
  brandName: string, 
  specName: string, 
  modelName?: string,
  year?: number
): string {
  const parts = [brandName, specName];
  if (modelName) parts.push(modelName);
  if (year) parts.unshift(String(year));
  return parts.join(' ');
}

/**
 * 產生隨機 ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * 延遲執行
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 將車輛圖片來源正規化為可直接渲染的公開 URL
 * 支援：
 * - 完整 URL（直接回傳）
 * - Storage 相對路徑（vehicle-id/xxx.webp）
 * - 含 bucket 的相對路徑（vehicle-images/vehicle-id/xxx.webp）
 */
export function normalizeVehicleImageUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return rawUrl;

  const normalizedPath = rawUrl.startsWith('vehicle-images/')
    ? rawUrl.replace(/^vehicle-images\//, '')
    : rawUrl;

  const baseUrl = supabaseUrl.replace(/\/+$/, '');
  return `${baseUrl}/storage/v1/object/public/vehicle-images/${normalizedPath}`;
}

/**
 * 將 DB 回傳的 images（陣列或 JSON 字串）解析為字串陣列
 */
export function parseVehicleImages(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string');
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

export interface DealerDisplaySource {
  company_name?: string | null;
  name?: string | null;
}

/**
 * 智慧去重顯示車商名稱：
 * - company/name 相同時只顯示一次
 * - 不同時顯示「公司 (聯絡人)」
 */
export function formatDealerName(dealer?: DealerDisplaySource | null): string {
  if (!dealer) return '未提供車商資訊';
  const company = dealer.company_name?.trim() || '';
  const name = dealer.name?.trim() || '';

  if (!company && !name) return '未提供車商資訊';
  if (company && !name) return company;
  if (!company && name) return name;
  if (company === name) return company;
  return `${company} (${name})`;
}
