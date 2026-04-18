/**
 * FaCai-B Platform - Constants
 * File: frontend/src/lib/constants.ts
 * 
 * 應用程式常數定義
 */

// ============================================================================
// Vehicle Status
// ============================================================================

export const VEHICLE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
} as const;

export const VEHICLE_STATUS_LABELS: Record<string, string> = {
  pending: '審核中',
  approved: '已上架',
  rejected: '已拒絕',
  archived: '已下架',
};

export const VEHICLE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-800',
};

// ============================================================================
// User Status & Role
// ============================================================================

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;

export const USER_STATUS_LABELS: Record<string, string> = {
  active: '正常',
  suspended: '已停權',
};

export const USER_ROLE = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  user: '一般會員',
  admin: '管理員',
};

// ============================================================================
// Notification Types
// ============================================================================

export const NOTIFICATION_TYPE = {
  VEHICLE_APPROVED: 'vehicle_approved',
  VEHICLE_REJECTED: 'vehicle_rejected',
  TRADE_MATCH: 'trade_match',
  SYSTEM: 'system',
  ACCOUNT_SUSPENDED: 'account_suspended',
  ACCOUNT_REACTIVATED: 'account_reactivated',
} as const;

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  vehicle_approved: '車輛上架通知',
  vehicle_rejected: '車輛審核未通過',
  trade_match: '盤車媒合通知',
  system: '系統通知',
  account_suspended: '帳號停權通知',
  account_reactivated: '帳號解除停權',
};

// ============================================================================
// Shop Product Categories
// ============================================================================

export const SHOP_CATEGORY = {
  CAR_WASH: 'car_wash',
  ANDROID_DEVICE: 'android_device',
  OTHER: 'other',
} as const;

export const SHOP_CATEGORY_LABELS: Record<string, string> = {
  car_wash: '洗車用品',
  android_device: 'Android 設備',
  other: '其他',
};

// ============================================================================
// Pagination
// ============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ============================================================================
// Navigation
// ============================================================================

export const NAV_ITEMS = [
  { href: '/find-car', label: '尋車', icon: 'Search' },
  { href: '/my-cars', label: '我的車', icon: 'Car' },
  { href: '/trades', label: '盤車', icon: 'Repeat' },
  { href: '/more', label: '更多', icon: 'Menu' },
] as const;

export const ADMIN_NAV_ITEMS = [
  { href: '/admin/dashboard', label: '儀表板', icon: 'LayoutDashboard' },
  { href: '/admin/audit', label: '車輛審核', icon: 'ClipboardCheck' },
  { href: '/admin/users', label: '會員管理', icon: 'Users' },
  { href: '/admin/dictionary', label: '字典管理', icon: 'BookOpen' },
  { href: '/admin-shop', label: '商城管理', icon: 'ShoppingBag' },
] as const;

// ============================================================================
// Form Validation
// ============================================================================

export const VALIDATION = {
  PHONE_REGEX: /^09\d{8}$/,
  YEAR_MIN: 1990,
  YEAR_MAX: new Date().getFullYear() + 2,
  PRICE_MAX: 100000000, // 1 億
  DESCRIPTION_MAX_LENGTH: 2000,
} as const;

// ============================================================================
// App Info
// ============================================================================

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || '發財B平台';
export const APP_DESCRIPTION = '車行間車輛交易與盤車媒合平台';
