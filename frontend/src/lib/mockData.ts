/**
 * FaCai-B Platform - Mock Data (開發模式專用)
 * File: frontend/src/lib/mockData.ts
 * 
 * 當後端 API 尚未啟動時，提供模擬資料讓前端可以展示
 */

import type { Vehicle } from '@/hooks/useVehicles';
import type { Brand, Spec, Model } from '@/hooks/useCascadingSelect';
import type { DictionaryRequest } from '@/hooks/useDictionary';
import type { ExternalService, AppSettings } from '@/types';

// ============================================================================
// 品牌資料
// ============================================================================

export const mockBrands: Brand[] = [
  { id: '1', name: 'Toyota', logo_url: undefined, is_active: true },
  { id: '2', name: 'Honda', logo_url: undefined, is_active: true },
  { id: '3', name: 'BMW', logo_url: undefined, is_active: true },
  { id: '4', name: 'Mercedes-Benz', logo_url: undefined, is_active: true },
  { id: '5', name: 'Lexus', logo_url: undefined, is_active: true },
  { id: '6', name: 'Mazda', logo_url: undefined, is_active: true },
  { id: '7', name: 'Nissan', logo_url: undefined, is_active: true },
  { id: '8', name: 'Ford', logo_url: undefined, is_active: true },
];

// ============================================================================
// 規格資料
// ============================================================================

export const mockSpecs: Spec[] = [
  // Toyota
  { id: '101', brand_id: '1', name: 'Camry', is_active: true },
  { id: '102', brand_id: '1', name: 'Corolla Cross', is_active: true },
  { id: '103', brand_id: '1', name: 'RAV4', is_active: true },
  { id: '104', brand_id: '1', name: 'Yaris', is_active: true },
  { id: '105', brand_id: '1', name: 'Corolla', is_active: true },
  { id: '106', brand_id: '1', name: 'Altis', is_active: true },
  { id: '107', brand_id: '1', name: 'Crown', is_active: true },
  { id: '108', brand_id: '1', name: 'Prius', is_active: true },
  // Honda
  { id: '201', brand_id: '2', name: 'CR-V', is_active: true },
  { id: '202', brand_id: '2', name: 'HR-V', is_active: true },
  { id: '203', brand_id: '2', name: 'Fit', is_active: true },
  // BMW
  { id: '301', brand_id: '3', name: '3 Series', is_active: true },
  { id: '302', brand_id: '3', name: '5 Series', is_active: true },
  { id: '303', brand_id: '3', name: 'X3', is_active: true },
  { id: '304', brand_id: '3', name: 'X5', is_active: true },
  // Mercedes-Benz
  { id: '401', brand_id: '4', name: 'C-Class', is_active: true },
  { id: '402', brand_id: '4', name: 'E-Class', is_active: true },
  { id: '403', brand_id: '4', name: 'GLC', is_active: true },
  // Lexus
  { id: '501', brand_id: '5', name: 'ES', is_active: true },
  { id: '502', brand_id: '5', name: 'NX', is_active: true },
  { id: '503', brand_id: '5', name: 'RX', is_active: true },
];

// ============================================================================
// 車型資料
// ============================================================================

export const mockModels: Model[] = [
  // Toyota Camry
  { id: '1001', spec_id: '101', name: '2.0 尊爵', is_active: true },
  { id: '1002', spec_id: '101', name: '2.5 Hybrid 旗艦', is_active: true },
  { id: '1003', spec_id: '101', name: '2.5 Hybrid 尊爵', is_active: true },
  // Toyota Corolla Cross
  { id: '1011', spec_id: '102', name: '1.8 汽油 經典', is_active: true },
  { id: '1012', spec_id: '102', name: '1.8 Hybrid 旗艦', is_active: true },
  // Toyota RAV4
  { id: '1021', spec_id: '103', name: '2.0 經典', is_active: true },
  { id: '1022', spec_id: '103', name: '2.5 Hybrid 旗艦', is_active: true },
  // Toyota Yaris
  { id: '1041', spec_id: '104', name: '1.5 經典', is_active: true },
  { id: '1042', spec_id: '104', name: '1.5 豪華', is_active: true },
  // Toyota Corolla (轎車)
  { id: '1051', spec_id: '105', name: '1.8 經典', is_active: true },
  { id: '1052', spec_id: '105', name: '1.8 豪華', is_active: true },
  { id: '1053', spec_id: '105', name: '1.8 Hybrid', is_active: true },
  // Toyota Altis
  { id: '1061', spec_id: '106', name: '1.8 經典', is_active: true },
  { id: '1062', spec_id: '106', name: '1.8 尊爵', is_active: true },
  { id: '1063', spec_id: '106', name: '1.8 Hybrid', is_active: true },
  // Toyota Crown
  { id: '1071', spec_id: '107', name: '2.5 Hybrid', is_active: true },
  { id: '1072', spec_id: '107', name: '2.5 Hybrid 旗艦', is_active: true },
  // Toyota Prius
  { id: '1081', spec_id: '108', name: 'Hybrid', is_active: true },
  { id: '1082', spec_id: '108', name: 'PHV', is_active: true },
  // BMW 3 Series
  { id: '3011', spec_id: '301', name: '318i Luxury', is_active: true },
  { id: '3012', spec_id: '301', name: '320i M Sport', is_active: true },
  { id: '3013', spec_id: '301', name: '330i M Sport', is_active: true },
  // BMW 5 Series
  { id: '3021', spec_id: '302', name: '520i Luxury', is_active: true },
  { id: '3022', spec_id: '302', name: '530i M Sport', is_active: true },
];

// ============================================================================
// 車輛資料
// ============================================================================

export const mockVehicles: Vehicle[] = [
  {
    id: 'v001',
    dealer_id: 'd001',
    brand_id: '1',
    spec_id: '101',
    model_id: '1002',
    brand_name: 'Toyota',
    spec_name: 'Camry',
    model_name: '2.5 Hybrid 旗艦',
    year: 2024,
    color: '珍珠白',
    mileage: 5200,
    transmission: 'auto',
    fuel_type: 'hybrid',
    images: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
      'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800',
    ],
    listing_price: 1350000,
    description: '原廠保固中，一手車，車況極佳。配備智能駕駛輔助、360度環景、JBL音響系統。',
    status: 'approved',
    created_at: '2026-03-15T10:00:00Z',
    updated_at: '2026-03-15T10:00:00Z',
    dealer: {
      id: 'd001',
      shop_name: '發財汽車',
      contact_name: '王大明',
      phone: '0912345678',
    },
  },
  {
    id: 'v002',
    dealer_id: 'd002',
    brand_id: '3',
    spec_id: '301',
    model_id: '3012',
    brand_name: 'BMW',
    spec_name: '3 Series',
    model_name: '320i M Sport',
    year: 2023,
    color: '礦石灰',
    mileage: 18500,
    transmission: 'auto',
    fuel_type: 'gasoline',
    images: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
    ],
    listing_price: 1680000,
    description: 'M Sport套件，抬頭顯示器、全景天窗、Harman Kardon音響。',
    status: 'approved',
    created_at: '2026-03-14T14:30:00Z',
    updated_at: '2026-03-14T14:30:00Z',
    dealer: {
      id: 'd002',
      shop_name: '皇家車業',
      contact_name: '李小華',
      phone: '0923456789',
    },
  },
  {
    id: 'v003',
    dealer_id: 'd001',
    brand_id: '4',
    spec_id: '401',
    model_id: '',
    brand_name: 'Mercedes-Benz',
    spec_name: 'C-Class',
    model_name: 'C300 AMG Line',
    year: 2024,
    color: '曜石黑',
    mileage: 3200,
    transmission: 'auto',
    fuel_type: 'gasoline',
    images: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
      'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800',
    ],
    listing_price: 2150000,
    description: 'AMG Line外觀套件、Burmester音響、數位儀表、環繞氣氛燈。幾乎全新車況！',
    status: 'approved',
    created_at: '2026-03-13T09:15:00Z',
    updated_at: '2026-03-13T09:15:00Z',
    dealer: {
      id: 'd001',
      shop_name: '發財汽車',
      contact_name: '王大明',
      phone: '0912345678',
    },
  },
  {
    id: 'v004',
    dealer_id: 'd003',
    brand_id: '5',
    spec_id: '502',
    model_id: '',
    brand_name: 'Lexus',
    spec_name: 'NX',
    model_name: 'NX350h 旗艦版',
    year: 2025,
    color: '星燦銀',
    mileage: 850,
    transmission: 'auto',
    fuel_type: 'hybrid',
    images: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
    ],
    listing_price: 2380000,
    description: '全新到港！頂級配備、Mark Levinson 音響、全速域ACC、車道維持。',
    status: 'approved',
    created_at: '2026-03-18T16:45:00Z',
    updated_at: '2026-03-18T16:45:00Z',
    dealer: {
      id: 'd003',
      shop_name: '明星車坊',
      contact_name: '張志明',
      phone: '0934567890',
    },
  },
  {
    id: 'v005',
    dealer_id: 'd002',
    brand_id: '2',
    spec_id: '201',
    model_id: '',
    brand_name: 'Honda',
    spec_name: 'CR-V',
    model_name: '1.5 VTi-S',
    year: 2022,
    color: '晶鑽藍',
    mileage: 32000,
    transmission: 'auto',
    fuel_type: 'gasoline',
    images: [
      'https://images.unsplash.com/photo-1568844293986-8c2a5053efc3?w=800',
    ],
    listing_price: 920000,
    description: '家庭用車首選，空間寬敞，Honda Sensing 安全系統，定期原廠保養。',
    status: 'approved',
    created_at: '2026-03-10T11:20:00Z',
    updated_at: '2026-03-10T11:20:00Z',
    dealer: {
      id: 'd002',
      shop_name: '皇家車業',
      contact_name: '李小華',
      phone: '0923456789',
    },
  },
  {
    id: 'v006',
    dealer_id: 'd003',
    brand_id: '1',
    spec_id: '103',
    model_id: '1022',
    brand_name: 'Toyota',
    spec_name: 'RAV4',
    model_name: '2.5 Hybrid 旗艦',
    year: 2023,
    color: '鋼鐵灰',
    mileage: 21500,
    transmission: 'auto',
    fuel_type: 'hybrid',
    images: [
      'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800',
      'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800',
    ],
    listing_price: 1280000,
    description: '省油神車，油電混合，原廠保固至2027年。配備TSS 2.0、電動尾門。',
    status: 'approved',
    created_at: '2026-03-12T08:00:00Z',
    updated_at: '2026-03-12T08:00:00Z',
    dealer: {
      id: 'd003',
      shop_name: '明星車坊',
      contact_name: '張志明',
      phone: '0934567890',
    },
  },
];

// ============================================================================
// Mock API 回應生成器
// ============================================================================

/**
 * 模擬 API 延遲
 */
function delay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 取得 Mock 品牌列表
 */
export async function getMockBrands() {
  await delay(200);
  return {
    success: true,
    data: mockBrands,
    meta: { total: mockBrands.length },
  };
}

/**
 * 取得 Mock 規格列表（依品牌篩選）
 */
export async function getMockSpecs(brandId?: string) {
  await delay(150);
  const filtered = brandId 
    ? mockSpecs.filter(s => s.brand_id === brandId) 
    : mockSpecs;
  return {
    success: true,
    data: filtered,
    meta: { total: filtered.length },
  };
}

/**
 * 取得 Mock 車型列表（依規格篩選）
 */
export async function getMockModels(specId?: string) {
  await delay(150);
  const filtered = specId 
    ? mockModels.filter(m => m.spec_id === specId) 
    : mockModels;
  return {
    success: true,
    data: filtered,
    meta: { total: filtered.length },
  };
}

/**
 * 取得 Mock 車輛列表（支援篩選與分頁）
 */
export async function getMockVehicles(params: {
  brand_id?: string;
  spec_id?: string;
  model_id?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}) {
  await delay(400);
  
  let filtered = [...mockVehicles];
  
  // 篩選品牌
  if (params.brand_id) {
    filtered = filtered.filter(v => v.brand_id === params.brand_id);
  }
  
  // 篩選規格
  if (params.spec_id) {
    filtered = filtered.filter(v => v.spec_id === params.spec_id);
  }
  
  // 搜尋
  if (params.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(v => 
      v.brand_name.toLowerCase().includes(search) ||
      v.spec_name.toLowerCase().includes(search) ||
      v.model_name.toLowerCase().includes(search)
    );
  }
  
  // 分頁
  const limit = params.limit || 20;
  const cursorIndex = params.cursor 
    ? filtered.findIndex(v => v.id === params.cursor) + 1 
    : 0;
  const paged = filtered.slice(cursorIndex, cursorIndex + limit);
  const hasMore = cursorIndex + limit < filtered.length;
  const nextCursor = hasMore ? paged[paged.length - 1]?.id : null;
  
  return {
    success: true,
    data: paged,
    meta: {
      total: filtered.length,
      hasMore,
      nextCursor,
    },
  };
}

/**
 * 取得單一車輛詳情
 */
export async function getMockVehicle(id: string) {
  await delay(250);
  const vehicle = mockVehicles.find(v => v.id === id);
  
  if (!vehicle) {
    return {
      success: false,
      message: '找不到車輛',
      code: 'NOT_FOUND',
    };
  }
  
  return {
    success: true,
    data: vehicle,
  };
}

/**
 * 取得 Mock 通知
 */
export async function getMockNotifications() {
  await delay(200);
  return {
    success: true,
    data: [],
    meta: { total: 0, hasMore: false },
  };
}

/**
 * 取得未讀通知數量
 */
export async function getMockUnreadCount() {
  await delay(100);
  return {
    success: true,
    data: { count: 3 },
  };
}

// ============================================================================
// 調做需求資料
// ============================================================================

export interface MockTradeRequest {
  id: string;
  dealer_id: string;
  target_brand_id: string;
  target_spec_id: string | null;
  target_model_id: string | null;
  brand_name: string;
  spec_name: string | null;
  model_name: string | null;
  year_from: number | null;
  year_to: number | null;
  price_range_min: number | null;
  price_range_max: number | null;
  conditions: string;
  contact_info: string;
  expires_at: string;
  is_active: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
  dealer: {
    id: string;
    shop_name: string;
    contact_name: string;
    phone: string;
  };
}

export const mockTradeRequests: MockTradeRequest[] = [
  {
    id: 'tr001',
    dealer_id: 'd001',
    target_brand_id: '1',
    target_spec_id: '103',
    target_model_id: null,
    brand_name: 'Toyota',
    spec_name: 'RAV4',
    model_name: null,
    year_from: 2022,
    year_to: 2025,
    price_range_min: 900000,
    price_range_max: 1400000,
    conditions: '原廠保養，無事故，里程 5 萬內，黑/白/灰色優先',
    contact_info: '王大明 0912-345-678，可 LINE 聯繫',
    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: '2026-03-15T10:00:00Z',
    dealer: {
      id: 'd001',
      shop_name: '發財汽車',
      contact_name: '王大明',
      phone: '0912345678',
    },
  },
  {
    id: 'tr002',
    dealer_id: 'd002',
    target_brand_id: '3',
    target_spec_id: '301',
    target_model_id: '3012',
    brand_name: 'BMW',
    spec_name: '3 Series',
    model_name: '320i M Sport',
    year_from: 2021,
    year_to: 2024,
    price_range_min: 1200000,
    price_range_max: 1800000,
    conditions: 'M Sport 套件必備，里程不限，車況好即可',
    contact_info: '李小華 0923-456-789',
    expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: '2026-03-14T14:30:00Z',
    dealer: {
      id: 'd002',
      shop_name: '皇家車業',
      contact_name: '李小華',
      phone: '0923456789',
    },
  },
  {
    id: 'tr003',
    dealer_id: 'd003',
    target_brand_id: '4',
    target_spec_id: '403',
    target_model_id: null,
    brand_name: 'Mercedes-Benz',
    spec_name: 'GLC',
    model_name: null,
    year_from: 2023,
    year_to: null,
    price_range_min: 2000000,
    price_range_max: null,
    conditions: 'GLC 300 以上，AMG Line 或 4MATIC，客戶急需',
    contact_info: '張志明 0934-567-890 (24H)',
    expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: '2026-03-18T16:45:00Z',
    dealer: {
      id: 'd003',
      shop_name: '明星車坊',
      contact_name: '張志明',
      phone: '0934567890',
    },
  },
  {
    id: 'tr004',
    dealer_id: 'd001',
    target_brand_id: '5',
    target_spec_id: '503',
    target_model_id: null,
    brand_name: 'Lexus',
    spec_name: 'RX',
    model_name: null,
    year_from: 2020,
    year_to: 2024,
    price_range_min: 1500000,
    price_range_max: 2200000,
    conditions: 'RX350 或 RX450h，七人座優先，顏色不限',
    contact_info: '王大明 LINE: car_boss_wang',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: '2026-03-16T09:00:00Z',
    dealer: {
      id: 'd001',
      shop_name: '發財汽車',
      contact_name: '王大明',
      phone: '0912345678',
    },
  },
  {
    id: 'tr005',
    dealer_id: 'd002',
    target_brand_id: '2',
    target_spec_id: '201',
    target_model_id: null,
    brand_name: 'Honda',
    spec_name: 'CR-V',
    model_name: null,
    year_from: 2018,
    year_to: 2022,
    price_range_min: 600000,
    price_range_max: 1000000,
    conditions: '1.5 VTi-S 或以上，里程 8 萬內，無泡水',
    contact_info: '李小華 電話/LINE: 0923456789',
    expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: '2026-03-17T11:30:00Z',
    dealer: {
      id: 'd002',
      shop_name: '皇家車業',
      contact_name: '李小華',
      phone: '0923456789',
    },
  },
  {
    id: 'tr006',
    dealer_id: 'd003',
    target_brand_id: '1',
    target_spec_id: '101',
    target_model_id: '1002',
    brand_name: 'Toyota',
    spec_name: 'Camry',
    model_name: '2.5 Hybrid 旗艦',
    year_from: 2024,
    year_to: null,
    price_range_min: 1200000,
    price_range_max: 1500000,
    conditions: '全新或準新車，珍珠白優先，客戶急件',
    contact_info: '張志明 直撥 0934567890',
    expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: '2026-03-19T08:00:00Z',
    dealer: {
      id: 'd003',
      shop_name: '明星車坊',
      contact_name: '張志明',
      phone: '0934567890',
    },
  },
];

// ============================================================================
// 字典申請資料
// ============================================================================

export const mockDictionaryRequests: DictionaryRequest[] = [
  {
    id: 'req001',
    user_id: 'd001',
    request_type: 'brand',
    parent_id: null,
    parent_name: null,
    suggested_name: 'Porsche',
    reason: '保時捷是常見的高端品牌，希望能新增方便刊登',
    status: 'pending',
    rejection_reason: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: 'd001',
      shop_name: '發財汽車',
      name: '王小明',
    },
  },
  {
    id: 'req002',
    user_id: 'd002',
    request_type: 'spec',
    parent_id: '1',
    parent_name: 'Toyota',
    suggested_name: 'Alphard',
    reason: '阿法是熱門車款，建議新增',
    status: 'pending',
    rejection_reason: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: 'd002',
      shop_name: '順發汽車',
      name: '李大華',
    },
  },
  {
    id: 'req003',
    user_id: 'd003',
    request_type: 'model',
    parent_id: '101',
    parent_name: 'Camry',
    suggested_name: '2.0 GR Sport',
    reason: '新增 GR Sport 運動版車型',
    status: 'pending',
    rejection_reason: null,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    user: {
      id: 'd003',
      shop_name: '金發汽車',
      name: '張小華',
    },
  },
  {
    id: 'req004',
    user_id: 'd001',
    request_type: 'brand',
    parent_id: null,
    parent_name: null,
    suggested_name: 'Audi',
    reason: '奧迪也是常見品牌，希望新增',
    status: 'approved',
    rejection_reason: null,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: 'd001',
      shop_name: '發財汽車',
      name: '王小明',
    },
  },
  {
    id: 'req005',
    user_id: 'd002',
    request_type: 'spec',
    parent_id: '2',
    parent_name: 'Honda',
    suggested_name: 'Accord',
    reason: '已經很久沒賣了',
    status: 'rejected',
    rejection_reason: '此規格已存在',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: 'd002',
      shop_name: '順發汽車',
      name: '李大華',
    },
  },
];

// ============================================================================
// 字典申請相關函式
// ============================================================================

/**
 * 取得字典申請列表
 */
export async function getMockDictionaryRequests(
  status: 'pending' | 'all' = 'pending'
): Promise<{ data: DictionaryRequest[] }> {
  await delay(300);
  
  if (status === 'pending') {
    return {
      data: mockDictionaryRequests.filter(r => r.status === 'pending'),
    };
  }
  
  return {
    data: [...mockDictionaryRequests],
  };
}

/**
 * 核准字典申請
 */
export async function approveMockDictionaryRequest(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  await delay(400);
  
  const requestIndex = mockDictionaryRequests.findIndex(r => r.id === id);
  
  if (requestIndex === -1) {
    return {
      success: false,
      message: '找不到申請',
    };
  }
  
  const request = mockDictionaryRequests[requestIndex];
  
  if (request.status !== 'pending') {
    return {
      success: false,
      message: '該申請已處理',
    };
  }
  
  // 根據申請類型新增到對應的字典
  if (request.request_type === 'brand') {
    const newId = String(mockBrands.length + 10);
    mockBrands.push({
      id: newId,
      name: request.suggested_name,
      logo_url: undefined,
      is_active: true,
    });
  } else if (request.request_type === 'spec' && request.parent_id) {
    const newId = String(Number(mockSpecs[mockSpecs.length - 1]?.id || '600') + 1);
    mockSpecs.push({
      id: newId,
      brand_id: request.parent_id,
      name: request.suggested_name,
      is_active: true,
    });
  } else if (request.request_type === 'model' && request.parent_id) {
    const newId = String(Number(mockModels[mockModels.length - 1]?.id || '4000') + 1);
    mockModels.push({
      id: newId,
      spec_id: request.parent_id,
      name: request.suggested_name,
      is_active: true,
    });
  }
  
  // 更新申請狀態
  mockDictionaryRequests[requestIndex] = {
    ...request,
    status: 'approved',
  };
  
  return {
    success: true,
    message: `已核准「${request.suggested_name}」的新增申請`,
  };
}

/**
 * 拒絕字典申請
 */
export async function rejectMockDictionaryRequest(
  id: string,
  reason: string
): Promise<{
  success: boolean;
  message: string;
}> {
  await delay(400);
  
  const requestIndex = mockDictionaryRequests.findIndex(r => r.id === id);
  
  if (requestIndex === -1) {
    return {
      success: false,
      message: '找不到申請',
    };
  }
  
  const request = mockDictionaryRequests[requestIndex];
  
  if (request.status !== 'pending') {
    return {
      success: false,
      message: '該申請已處理',
    };
  }
  
  // 更新申請狀態
  mockDictionaryRequests[requestIndex] = {
    ...request,
    status: 'rejected',
    rejection_reason: reason,
  };
  
  return {
    success: true,
    message: `已拒絕「${request.suggested_name}」的新增申請`,
  };
}

// ============================================================================
// 品牌 CRUD 函式
// ============================================================================

/**
 * 新增品牌
 */
export async function addMockBrand(name: string): Promise<{
  success: boolean;
  data?: Brand;
  message: string;
}> {
  await delay(400);
  
  // 檢查是否已存在
  if (mockBrands.some(b => b.name.toLowerCase() === name.toLowerCase())) {
    return {
      success: false,
      message: '該品牌已存在',
    };
  }
  
  const newBrand: Brand = {
    id: String(mockBrands.length + 100),
    name,
    logo_url: undefined,
    is_active: true,
  };
  
  mockBrands.push(newBrand);
  
  return {
    success: true,
    data: newBrand,
    message: `品牌「${name}」新增成功`,
  };
}

/**
 * 更新品牌
 */
export async function updateMockBrand(id: string, name: string): Promise<{
  success: boolean;
  message: string;
}> {
  await delay(400);
  
  const brandIndex = mockBrands.findIndex(b => b.id === id);
  
  if (brandIndex === -1) {
    return {
      success: false,
      message: '找不到品牌',
    };
  }
  
  // 檢查新名稱是否與其他品牌重複
  if (mockBrands.some(b => b.id !== id && b.name.toLowerCase() === name.toLowerCase())) {
    return {
      success: false,
      message: '該品牌名稱已存在',
    };
  }
  
  mockBrands[brandIndex] = {
    ...mockBrands[brandIndex],
    name,
  };
  
  return {
    success: true,
    message: `品牌「${name}」更新成功`,
  };
}

/**
 * 切換品牌啟用狀態
 */
export async function toggleMockBrandActive(id: string): Promise<{
  success: boolean;
  data?: { is_active: boolean };
  message: string;
}> {
  await delay(300);
  
  const brandIndex = mockBrands.findIndex(b => b.id === id);
  
  if (brandIndex === -1) {
    return {
      success: false,
      message: '找不到品牌',
    };
  }
  
  const newStatus = !mockBrands[brandIndex].is_active;
  mockBrands[brandIndex] = {
    ...mockBrands[brandIndex],
    is_active: newStatus,
  };
  
  return {
    success: true,
    data: { is_active: newStatus },
    message: newStatus ? '品牌已啟用' : '品牌已停用',
  };
}

// ============================================================================
// 規格 CRUD 函式
// ============================================================================

/**
 * 新增規格
 */
export async function addMockSpec(name: string, brandId: string): Promise<{
  success: boolean;
  data?: Spec;
  message: string;
}> {
  await delay(400);
  
  // 檢查品牌是否存在
  const brand = mockBrands.find(b => b.id === brandId);
  if (!brand) {
    return {
      success: false,
      message: '找不到品牌',
    };
  }
  
  // 檢查是否已存在
  if (mockSpecs.some(s => s.brand_id === brandId && s.name.toLowerCase() === name.toLowerCase())) {
    return {
      success: false,
      message: '該規格已存在於此品牌下',
    };
  }
  
  const newSpec: Spec = {
    id: String(Number(mockSpecs[mockSpecs.length - 1]?.id || '700') + 1),
    brand_id: brandId,
    name,
    is_active: true,
  };
  
  mockSpecs.push(newSpec);
  
  return {
    success: true,
    data: newSpec,
    message: `規格「${name}」新增成功`,
  };
}

/**
 * 更新規格
 */
export async function updateMockSpec(id: string, name: string): Promise<{
  success: boolean;
  message: string;
}> {
  await delay(400);
  
  const specIndex = mockSpecs.findIndex(s => s.id === id);
  
  if (specIndex === -1) {
    return {
      success: false,
      message: '找不到規格',
    };
  }
  
  const spec = mockSpecs[specIndex];
  
  // 檢查新名稱是否與同品牌其他規格重複
  if (mockSpecs.some(s => s.id !== id && s.brand_id === spec.brand_id && s.name.toLowerCase() === name.toLowerCase())) {
    return {
      success: false,
      message: '該規格名稱已存在於此品牌下',
    };
  }
  
  mockSpecs[specIndex] = {
    ...mockSpecs[specIndex],
    name,
  };
  
  return {
    success: true,
    message: `規格「${name}」更新成功`,
  };
}

/**
 * 切換規格啟用狀態
 */
export async function toggleMockSpecActive(id: string): Promise<{
  success: boolean;
  data?: { is_active: boolean };
  message: string;
}> {
  await delay(300);
  
  const specIndex = mockSpecs.findIndex(s => s.id === id);
  
  if (specIndex === -1) {
    return {
      success: false,
      message: '找不到規格',
    };
  }
  
  const newStatus = !mockSpecs[specIndex].is_active;
  mockSpecs[specIndex] = {
    ...mockSpecs[specIndex],
    is_active: newStatus,
  };
  
  return {
    success: true,
    data: { is_active: newStatus },
    message: newStatus ? '規格已啟用' : '規格已停用',
  };
}

// ============================================================================
// 車型 CRUD 函式
// ============================================================================

/**
 * 新增車型
 */
export async function addMockModel(name: string, specId: string): Promise<{
  success: boolean;
  data?: Model;
  message: string;
}> {
  await delay(400);
  
  // 檢查規格是否存在
  const spec = mockSpecs.find(s => s.id === specId);
  if (!spec) {
    return {
      success: false,
      message: '找不到規格',
    };
  }
  
  // 檢查是否已存在
  if (mockModels.some(m => m.spec_id === specId && m.name.toLowerCase() === name.toLowerCase())) {
    return {
      success: false,
      message: '該車型已存在於此規格下',
    };
  }
  
  const newModel: Model = {
    id: String(Number(mockModels[mockModels.length - 1]?.id || '5000') + 1),
    spec_id: specId,
    name,
    is_active: true,
  };
  
  mockModels.push(newModel);
  
  return {
    success: true,
    data: newModel,
    message: `車型「${name}」新增成功`,
  };
}

/**
 * 更新車型
 */
export async function updateMockModel(id: string, name: string): Promise<{
  success: boolean;
  message: string;
}> {
  await delay(400);
  
  const modelIndex = mockModels.findIndex(m => m.id === id);
  
  if (modelIndex === -1) {
    return {
      success: false,
      message: '找不到車型',
    };
  }
  
  const model = mockModels[modelIndex];
  
  // 檢查新名稱是否與同規格其他車型重複
  if (mockModels.some(m => m.id !== id && m.spec_id === model.spec_id && m.name.toLowerCase() === name.toLowerCase())) {
    return {
      success: false,
      message: '該車型名稱已存在於此規格下',
    };
  }
  
  mockModels[modelIndex] = {
    ...mockModels[modelIndex],
    name,
  };
  
  return {
    success: true,
    message: `車型「${name}」更新成功`,
  };
}

/**
 * 切換車型啟用狀態
 */
export async function toggleMockModelActive(id: string): Promise<{
  success: boolean;
  data?: { is_active: boolean };
  message: string;
}> {
  await delay(300);
  
  const modelIndex = mockModels.findIndex(m => m.id === id);
  
  if (modelIndex === -1) {
    return {
      success: false,
      message: '找不到車型',
    };
  }
  
  const newStatus = !mockModels[modelIndex].is_active;
  mockModels[modelIndex] = {
    ...mockModels[modelIndex],
    is_active: newStatus,
  };
  
  return {
    success: true,
    data: { is_active: newStatus },
    message: newStatus ? '車型已啟用' : '車型已停用',
  };
}

/**
 * 取得 Mock 調做列表
 */
export async function getMockTradeRequests(params: {
  brand_id?: string;
  is_active?: boolean;
  my_only?: boolean;
  dealer_id?: string;
  status?: 'pending' | 'approved' | 'rejected';
  limit?: number;
  cursor?: string;
}) {
  await delay(350);
  
  let filtered = [...mockTradeRequests];
  
  // 篩選品牌
  if (params.brand_id) {
    filtered = filtered.filter(t => t.target_brand_id === params.brand_id);
  }
  
  // 篩選啟用狀態
  if (params.is_active !== undefined) {
    filtered = filtered.filter(t => t.is_active === params.is_active);
  }
  
  // 只顯示我的（模擬用 d001）
  if (params.my_only) {
    const myDealerId = params.dealer_id || 'd001';
    filtered = filtered.filter(t => t.dealer_id === myDealerId);
  }

  if (params.status) {
    filtered = filtered.filter(
      (t) => (t.status ?? 'approved') === params.status
    );
  }
  
  // 分頁
  const limit = params.limit || 20;
  const cursorIndex = params.cursor 
    ? filtered.findIndex(t => t.id === params.cursor) + 1 
    : 0;
  const paged = filtered.slice(cursorIndex, cursorIndex + limit);
  const hasMore = cursorIndex + limit < filtered.length;
  const nextCursor = hasMore ? paged[paged.length - 1]?.id : null;
  
  return {
    success: true,
    data: paged,
    meta: {
      total: filtered.length,
      hasMore,
      nextCursor,
    },
  };
}

/**
 * 取得單一調做詳情
 */
export async function getMockTradeRequest(id: string) {
  await delay(200);
  const trade = mockTradeRequests.find(t => t.id === id);
  
  if (!trade) {
    return {
      success: false,
      message: '找不到調做需求',
      code: 'NOT_FOUND',
    };
  }
  
  return {
    success: true,
    data: trade,
  };
}

/**
 * 新增調做需求（模擬）
 */
export async function createMockTradeRequest(input: {
  target_brand_id: string;
  target_spec_id?: string;
  target_model_id?: string;
  year_from?: number;
  year_to?: number;
  price_range_min?: number;
  price_range_max?: number;
  conditions?: string;
  contact_info: string;
  expires_at?: string;
}) {
  await delay(500);
  
  const brand = mockBrands.find(b => b.id === input.target_brand_id);
  const spec = input.target_spec_id ? mockSpecs.find(s => s.id === input.target_spec_id) : null;
  const model = input.target_model_id ? mockModels.find(m => m.id === input.target_model_id) : null;
  
  const newTrade: MockTradeRequest = {
    id: `tr${Date.now()}`,
    dealer_id: 'd001',
    target_brand_id: input.target_brand_id,
    target_spec_id: input.target_spec_id || null,
    target_model_id: input.target_model_id || null,
    brand_name: brand?.name || '未知品牌',
    spec_name: spec?.name || null,
    model_name: model?.name || null,
    year_from: input.year_from || null,
    year_to: input.year_to || null,
    price_range_min: input.price_range_min || null,
    price_range_max: input.price_range_max || null,
    conditions: input.conditions || '',
    contact_info: input.contact_info,
    expires_at: input.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    status: 'pending',
    created_at: new Date().toISOString(),
    dealer: {
      id: 'd001',
      shop_name: '發財汽車',
      contact_name: '王大明',
      phone: '0912345678',
    },
  };
  
  mockTradeRequests.unshift(newTrade);
  
  return {
    success: true,
    data: newTrade,
    message: '調做需求已發布',
  };
}

/**
 * 更新調做需求（模擬）
 */
export async function updateMockTradeRequest(id: string, input: Partial<MockTradeRequest>) {
  await delay(400);
  
  const index = mockTradeRequests.findIndex(t => t.id === id);
  if (index === -1) {
    return {
      success: false,
      message: '找不到調做需求',
      code: 'NOT_FOUND',
    };
  }
  
  mockTradeRequests[index] = { ...mockTradeRequests[index], ...input };
  
  return {
    success: true,
    data: mockTradeRequests[index],
    message: '調做需求已更新',
  };
}

/**
 * 刪除調做需求（模擬）
 */
export async function deleteMockTradeRequest(id: string) {
  await delay(300);
  
  const index = mockTradeRequests.findIndex(t => t.id === id);
  if (index === -1) {
    return {
      success: false,
      message: '找不到調做需求',
      code: 'NOT_FOUND',
    };
  }
  
  mockTradeRequests.splice(index, 1);
  
  return {
    success: true,
    message: '調做需求已刪除',
  };
}

/**
 * 續期調做需求（模擬）
 */
export async function extendMockTradeRequest(id: string, days: number = 7) {
  await delay(300);
  
  const index = mockTradeRequests.findIndex(t => t.id === id);
  if (index === -1) {
    return {
      success: false,
      message: '找不到調做需求',
      code: 'NOT_FOUND',
    };
  }
  
  const newExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  mockTradeRequests[index].expires_at = newExpiry;
  mockTradeRequests[index].is_active = true;
  
  return {
    success: true,
    data: mockTradeRequests[index],
    message: `調做需求已續期 ${days} 天`,
  };
}

// ============================================================================
// Admin 審核相關資料
// ============================================================================

/**
 * 待審核車輛資料
 */
export const mockPendingVehicles: Vehicle[] = [
  {
    id: 'pv001',
    dealer_id: 'd001',
    brand_id: '1',
    spec_id: '102',
    model_id: '1012',
    brand_name: 'Toyota',
    spec_name: 'Corolla Cross',
    model_name: '1.8 Hybrid 旗艦',
    year: 2025,
    color: '蒼穹藍',
    mileage: 1200,
    transmission: 'auto',
    fuel_type: 'hybrid',
    images: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
    ],
    listing_price: 1080000,
    description: '全新車，原廠保固，ACC全速域、車道維持、Apple CarPlay。',
    status: 'pending',
    created_at: '2026-03-19T14:30:00Z',
    updated_at: '2026-03-19T14:30:00Z',
    dealer: {
      id: 'd001',
      shop_name: '發財汽車',
      contact_name: '王大明',
      phone: '0912345678',
    },
  },
  {
    id: 'pv002',
    dealer_id: 'd002',
    brand_id: '3',
    spec_id: '303',
    model_id: '',
    brand_name: 'BMW',
    spec_name: 'X3',
    model_name: 'xDrive30i M Sport',
    year: 2024,
    color: '碳黑',
    mileage: 8500,
    transmission: 'auto',
    fuel_type: 'gasoline',
    images: [
      'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800',
    ],
    listing_price: 2580000,
    description: 'M Sport套件、全景天窗、HUD抬頭顯示、360環景、Harman Kardon音響',
    status: 'pending',
    created_at: '2026-03-19T10:15:00Z',
    updated_at: '2026-03-19T10:15:00Z',
    dealer: {
      id: 'd002',
      shop_name: '皇家車業',
      contact_name: '李小華',
      phone: '0923456789',
    },
  },
  {
    id: 'pv003',
    dealer_id: 'd003',
    brand_id: '4',
    spec_id: '403',
    model_id: '',
    brand_name: 'Mercedes-Benz',
    spec_name: 'GLC',
    model_name: 'GLC300 4MATIC',
    year: 2024,
    color: '極地白',
    mileage: 5200,
    transmission: 'auto',
    fuel_type: 'gasoline',
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800',
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800',
    ],
    listing_price: 2850000,
    description: 'AMG Line、Burmester 3D音響、柏林之音、MBUX系統',
    status: 'pending',
    created_at: '2026-03-18T16:00:00Z',
    updated_at: '2026-03-18T16:00:00Z',
    dealer: {
      id: 'd003',
      shop_name: '明星車坊',
      contact_name: '張志明',
      phone: '0934567890',
    },
  },
  {
    id: 'pv004',
    dealer_id: 'd001',
    brand_id: '2',
    spec_id: '202',
    model_id: '',
    brand_name: 'Honda',
    spec_name: 'HR-V',
    model_name: '1.5 VTi-S',
    year: 2025,
    color: '晶鑽紅',
    mileage: 500,
    transmission: 'auto',
    fuel_type: 'gasoline',
    images: [
      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800',
    ],
    listing_price: 920000,
    description: '全新到港，Honda Sensing全配，LED頭燈、無線充電、倒車顯影',
    status: 'pending',
    created_at: '2026-03-20T08:30:00Z',
    updated_at: '2026-03-20T08:30:00Z',
    dealer: {
      id: 'd001',
      shop_name: '發財汽車',
      contact_name: '王大明',
      phone: '0912345678',
    },
  },
];

/**
 * 車行列表（用於代客建檔選擇）
 */
export const mockDealers = [
  { id: 'd001', shop_name: '發財汽車', contact_name: '王大明', phone: '0912345678', status: 'active' },
  { id: 'd002', shop_name: '皇家車業', contact_name: '李小華', phone: '0923456789', status: 'active' },
  { id: 'd003', shop_name: '明星車坊', contact_name: '張志明', phone: '0934567890', status: 'active' },
  { id: 'd004', shop_name: '順風車行', contact_name: '陳建宏', phone: '0945678901', status: 'active' },
  { id: 'd005', shop_name: '大吉汽車', contact_name: '林志玲', phone: '0956789012', status: 'suspended' },
];

/**
 * Admin 儀表板統計
 */
export interface DashboardStats {
  pendingAuditCount: number;
  totalVehicles: number;
  activeTradeRequests: number;
  totalUsers: number;
  todayNewVehicles: number;
  todayNewTrades: number;
}

/**
 * 取得 Mock 待審核車輛列表
 */
export async function getMockPendingVehicles(params: {
  status?: 'pending' | 'rejected';
  limit?: number;
  cursor?: string;
}) {
  await delay(350);
  
  let filtered = [...mockPendingVehicles];
  
  // 篩選狀態
  if (params.status) {
    filtered = filtered.filter(v => v.status === params.status);
  } else {
    // 預設只顯示 pending
    filtered = filtered.filter(v => v.status === 'pending');
  }
  
  // 分頁
  const limit = params.limit || 20;
  const cursorIndex = params.cursor 
    ? filtered.findIndex(v => v.id === params.cursor) + 1 
    : 0;
  const paged = filtered.slice(cursorIndex, cursorIndex + limit);
  const hasMore = cursorIndex + limit < filtered.length;
  const nextCursor = hasMore ? paged[paged.length - 1]?.id : null;
  
  return {
    success: true,
    data: paged,
    meta: {
      total: filtered.length,
      hasMore,
      nextCursor,
    },
  };
}

/**
 * 取得單一待審核車輛詳情
 */
export async function getMockPendingVehicle(id: string) {
  await delay(200);
  
  const vehicle = mockPendingVehicles.find(v => v.id === id);
  
  if (!vehicle) {
    return {
      success: false,
      message: '找不到車輛',
      code: 'NOT_FOUND',
    };
  }
  
  return {
    success: true,
    data: vehicle,
  };
}

/**
 * 核准車輛（模擬）
 */
export async function approveMockVehicle(id: string) {
  await delay(400);
  
  const index = mockPendingVehicles.findIndex(v => v.id === id);
  if (index === -1) {
    return {
      success: false,
      message: '找不到車輛',
      code: 'NOT_FOUND',
    };
  }
  
  const vehicle = mockPendingVehicles[index];
  vehicle.status = 'approved';
  
  // 移到已核准列表
  mockVehicles.push({ ...vehicle });
  mockPendingVehicles.splice(index, 1);
  
  return {
    success: true,
    data: vehicle,
    message: '車輛已核准上架',
  };
}

/**
 * 拒絕車輛（模擬）
 */
export async function rejectMockVehicle(id: string, reason: string) {
  await delay(400);
  
  const index = mockPendingVehicles.findIndex(v => v.id === id);
  if (index === -1) {
    return {
      success: false,
      message: '找不到車輛',
      code: 'NOT_FOUND',
    };
  }
  
  mockPendingVehicles[index].status = 'rejected';
  mockPendingVehicles[index].rejection_reason = reason;
  
  return {
    success: true,
    data: mockPendingVehicles[index],
    message: '車輛已退件',
  };
}

/**
 * 取得 Mock 車行列表
 */
export async function getMockDealers() {
  await delay(200);
  
  return {
    success: true,
    data: mockDealers.filter(d => d.status === 'active'),
    meta: { total: mockDealers.filter(d => d.status === 'active').length },
  };
}

/**
 * 代客建檔（模擬）
 */
export async function createProxyMockVehicle(input: {
  owner_dealer_id: string;
  brand_id: string;
  spec_id: string;
  model_id: string;
  year: number;
  listing_price: number;
  acquisition_cost?: number;
  repair_cost?: number;
  description?: string;
}) {
  await delay(500);
  
  const dealer = mockDealers.find(d => d.id === input.owner_dealer_id);
  if (!dealer) {
    return {
      success: false,
      message: '找不到車行',
      code: 'DEALER_NOT_FOUND',
    };
  }
  
  const brand = mockBrands.find(b => b.id === input.brand_id);
  const spec = mockSpecs.find(s => s.id === input.spec_id);
  const model = mockModels.find(m => m.id === input.model_id);
  
  const newVehicle: Vehicle = {
    id: `proxy-${Date.now()}`,
    dealer_id: input.owner_dealer_id,
    brand_id: input.brand_id,
    spec_id: input.spec_id,
    model_id: input.model_id,
    brand_name: brand?.name || '未知品牌',
    spec_name: spec?.name || '',
    model_name: model?.name || '',
    year: input.year,
    color: '示範顏色',
    transmission: 'auto',
    fuel_type: 'gasoline',
    images: [],
    listing_price: input.listing_price,
    acquisition_cost: input.acquisition_cost,
    repair_cost: input.repair_cost,
    description: input.description,
    status: 'approved', // 代客建檔直接核准
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    dealer: {
      id: dealer.id,
      shop_name: dealer.shop_name,
      contact_name: dealer.contact_name,
      phone: dealer.phone,
    },
  };
  
  mockVehicles.push(newVehicle);
  
  return {
    success: true,
    data: newVehicle,
    message: '已為車行建立車輛，並直接上架',
  };
}

/**
 * 取得 Mock Dashboard 統計
 */
export async function getMockDashboardStats(): Promise<{ success: boolean; data: DashboardStats }> {
  await delay(250);
  
  return {
    success: true,
    data: {
      pendingAuditCount: mockPendingVehicles.filter(v => v.status === 'pending').length,
      totalVehicles: mockVehicles.length,
      activeTradeRequests: mockTradeRequests.filter(t => t.is_active).length,
      totalUsers: mockDealers.length,
      todayNewVehicles: 2,
      todayNewTrades: 3,
    },
  };
}

// ============================================================================
// 會員管理 Mock Data
// ============================================================================

import type { User, UserStatus } from '@/types/user';
import type { TradeRequest } from '@/hooks/useTradeRequests';

export interface MockUser extends User {
  shop_name: string;
  vehicle_count: number;
  trade_count: number;
}

export interface UserDetail extends MockUser {
  vehicles?: Vehicle[];
  trades?: TradeRequest[];
}

/**
 * Mock 會員資料
 */
export const mockUsers: MockUser[] = [
  {
    id: 'd001',
    email: 'wang@facai.com',
    name: '王大明',
    phone: '0912345678',
    company_name: '發財汽車',
    shop_name: '發財汽車',
    status: 'active',
    suspended_at: null,
    suspended_reason: null,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2026-03-10T14:30:00Z',
    vehicle_count: 12,
    trade_count: 3,
  },
  {
    id: 'd002',
    email: 'lee@royal.com',
    name: '李小華',
    phone: '0923456789',
    company_name: '皇家車業',
    shop_name: '皇家車業',
    status: 'active',
    suspended_at: null,
    suspended_reason: null,
    created_at: '2025-02-20T09:00:00Z',
    updated_at: '2026-03-12T16:20:00Z',
    vehicle_count: 8,
    trade_count: 5,
  },
  {
    id: 'd003',
    email: 'zhang@star.com',
    name: '張志明',
    phone: '0934567890',
    company_name: '明星車坊',
    shop_name: '明星車坊',
    status: 'active',
    suspended_at: null,
    suspended_reason: null,
    created_at: '2025-03-05T11:30:00Z',
    updated_at: '2026-03-15T08:45:00Z',
    vehicle_count: 15,
    trade_count: 2,
  },
  {
    id: 'd004',
    email: 'chen@fortune.com',
    name: '陳福財',
    phone: '0945678901',
    company_name: '福財車行',
    shop_name: '福財車行',
    status: 'suspended',
    suspended_at: '2026-03-10T09:00:00Z',
    suspended_reason: '多次發布不實車輛資訊，經警告仍未改善',
    created_at: '2025-04-10T14:00:00Z',
    updated_at: '2026-03-10T09:00:00Z',
    vehicle_count: 5,
    trade_count: 0,
  },
  {
    id: 'd005',
    email: 'lin@auto.com',
    name: '林建宏',
    phone: '0956789012',
    company_name: '宏達汽車',
    shop_name: '宏達汽車',
    status: 'active',
    suspended_at: null,
    suspended_reason: null,
    created_at: '2025-05-15T08:30:00Z',
    updated_at: '2026-03-18T10:15:00Z',
    vehicle_count: 20,
    trade_count: 8,
  },
  {
    id: 'd006',
    email: 'wu@golden.com',
    name: '吳金德',
    phone: '0967890123',
    company_name: '金德車業',
    shop_name: '金德車業',
    status: 'active',
    suspended_at: null,
    suspended_reason: null,
    created_at: '2025-06-01T13:45:00Z',
    updated_at: '2026-03-17T11:30:00Z',
    vehicle_count: 7,
    trade_count: 4,
  },
  {
    id: 'd007',
    email: 'huang@sunrise.com',
    name: '黃日升',
    phone: '0978901234',
    company_name: '旭日車行',
    shop_name: '旭日車行',
    status: 'suspended',
    suspended_at: '2026-02-28T14:00:00Z',
    suspended_reason: '帳戶異常活動，暫時停權調查中',
    created_at: '2025-07-20T16:00:00Z',
    updated_at: '2026-02-28T14:00:00Z',
    vehicle_count: 3,
    trade_count: 1,
  },
  {
    id: 'd008',
    email: 'liu@premium.com',
    name: '劉明輝',
    phone: '0989012345',
    company_name: '明輝名車',
    shop_name: '明輝名車',
    status: 'active',
    suspended_at: null,
    suspended_reason: null,
    created_at: '2025-08-10T10:20:00Z',
    updated_at: '2026-03-19T09:00:00Z',
    vehicle_count: 25,
    trade_count: 6,
  },
];

/**
 * 取得 Mock 會員列表
 */
export async function getMockUsers(filters: {
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ 
  success: boolean; 
  data: MockUser[]; 
  meta: { total: number; page: number; totalPages: number } 
}> {
  await delay(300);
  
  let filtered = [...mockUsers];
  
  // 狀態篩選
  if (filters.status) {
    filtered = filtered.filter(u => u.status === filters.status);
  }
  
  // 搜尋
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      u.shop_name.toLowerCase().includes(search) ||
      u.phone.includes(search)
    );
  }
  
  // 分頁
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paged = filtered.slice(startIndex, startIndex + limit);
  
  return {
    success: true,
    data: paged,
    meta: { total, page, totalPages },
  };
}

/**
 * 取得 Mock 會員詳情
 */
export async function getMockUserDetail(id: string): Promise<{ 
  success: boolean; 
  data?: UserDetail; 
  message?: string 
}> {
  await delay(250);
  
  const user = mockUsers.find(u => u.id === id);
  
  if (!user) {
    return {
      success: false,
      message: '找不到會員',
    };
  }
  
  // 取得該會員的車輛
  const userVehicles = mockVehicles.filter(v => v.dealer_id === id);
  
  // 取得該會員的調做
  const userTrades = mockTradeRequests.filter(t => t.dealer_id === id);
  
  return {
    success: true,
    data: {
      ...user,
      vehicles: userVehicles,
      trades: userTrades.map((t) => ({
        ...t,
        status: t.status ?? 'approved',
        dealer: {
          id: t.dealer.id,
          name: t.dealer.contact_name,
          company_name: t.dealer.shop_name,
          phone: t.dealer.phone,
        },
      })),
    },
  };
}

/**
 * Mock 停權會員
 */
export async function suspendMockUser(id: string, reason: string): Promise<{
  success: boolean;
  message: string;
}> {
  await delay(400);
  
  const userIndex = mockUsers.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return {
      success: false,
      message: '找不到會員',
    };
  }
  
  if (mockUsers[userIndex].status === 'suspended') {
    return {
      success: false,
      message: '該會員已被停權',
    };
  }
  
  // 更新會員狀態
  mockUsers[userIndex] = {
    ...mockUsers[userIndex],
    status: 'suspended',
    suspended_at: new Date().toISOString(),
    suspended_reason: reason,
    updated_at: new Date().toISOString(),
  };
  
  // 將該會員的所有車輛設為 archived
  mockVehicles.forEach((v, idx) => {
    if (v.dealer_id === id && v.status === 'approved') {
      mockVehicles[idx] = {
        ...v,
        status: 'archived',
        updated_at: new Date().toISOString(),
      };
    }
  });
  
  return {
    success: true,
    message: `已停權會員「${mockUsers[userIndex].shop_name}」，其車輛已自動下架`,
  };
}

/**
 * Mock 解除停權
 */
export async function reactivateMockUser(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  await delay(400);
  
  const userIndex = mockUsers.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return {
      success: false,
      message: '找不到會員',
    };
  }
  
  if (mockUsers[userIndex].status !== 'suspended') {
    return {
      success: false,
      message: '該會員並未被停權',
    };
  }
  
  // 更新會員狀態
  mockUsers[userIndex] = {
    ...mockUsers[userIndex],
    status: 'active',
    suspended_at: null,
    suspended_reason: null,
    updated_at: new Date().toISOString(),
  };
  
  return {
    success: true,
    message: `已解除「${mockUsers[userIndex].shop_name}」的停權狀態`,
  };
}

// ============================================================================
// 商城商品資料
// ============================================================================

import type { ShopProduct, ShopProductCategory } from '@/types';

export const mockShopProducts: ShopProduct[] = [
  {
    id: 'p001',
    category: 'car_wash',
    name: '尊榮洗車券（10次）',
    image_url: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600',
    purchase_url: 'https://shop.example.com/car-wash-10',
    sort_order: 1,
    is_active: true,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'p002',
    category: 'android_device',
    name: '車用 Android 智慧主機',
    image_url: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=600',
    purchase_url: 'https://shop.example.com/android-headunit',
    sort_order: 2,
    is_active: true,
    created_at: '2026-03-02T10:00:00Z',
    updated_at: '2026-03-02T10:00:00Z',
  },
  {
    id: 'p003',
    category: 'other',
    name: '高效能汽車空氣清淨機',
    image_url: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=600',
    purchase_url: 'https://shop.example.com/air-purifier',
    sort_order: 3,
    is_active: false,
    created_at: '2026-03-03T10:00:00Z',
    updated_at: '2026-03-03T10:00:00Z',
  },
];

export async function getMockShopProducts(category?: ShopProductCategory) {
  await new Promise(r => setTimeout(r, 200));
  if (category) {
    return mockShopProducts.filter(p => p.category === category);
  }
  return [...mockShopProducts];
}

export async function getMockShopProductById(id: string) {
  await new Promise(r => setTimeout(r, 150));
  return mockShopProducts.find(p => p.id === id) || null;
}

export async function updateMockShopProductStatus(id: string, is_active: boolean) {
  const idx = mockShopProducts.findIndex(p => p.id === id);
  if (idx !== -1) {
    mockShopProducts[idx].is_active = is_active;
    mockShopProducts[idx].updated_at = new Date().toISOString();
    return { success: true };
  }
  return { success: false };
}

// ============================================================================
// 外部服務資料 (Entertainment, Relaxation, Comfort, Shop)
// ============================================================================

export const mockExternalServices: ExternalService[] = [
  {
    id: 'svc-001',
    type: 'entertainment',
    name: '娛樂城',
    description: '線上娛樂城，享受刺激的遊戲體驗',
    url: null, // 管理員可編輯
    sort_order: 1,
    is_active: true,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'svc-002',
    type: 'relaxation',
    name: '紓壓專區',
    description: '放鬆身心，享受生活',
    url: null, // 管理員可編輯

    sort_order: 2,
    is_active: true,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'svc-003',
    type: 'comfort',
    name: '舒服專區',
    description: '提供舒適的服務',
    url: null, // 管理員可編輯
    sort_order: 3,
    is_active: true,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'svc-004',
    type: 'shop',
    name: '線上商城',
    description: '汽車用品、安卓機及其他商品',
    url: '/shop',
    sort_order: 4,
    is_active: true,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
  },
];

export async function getMockExternalServices() {
  await delay(200);
  return {
    success: true,
    data: mockExternalServices.filter(s => s.is_active),
  };
}

export async function updateMockExternalService(id: string, updates: Partial<ExternalService>) {
  await delay(300);
  
  const serviceIndex = mockExternalServices.findIndex(s => s.id === id);
  if (serviceIndex === -1) {
    return { success: false, message: '找不到服務' };
  }
  
  mockExternalServices[serviceIndex] = {
    ...mockExternalServices[serviceIndex],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  return { 
    success: true, 
    message: '服務已更新',
    data: mockExternalServices[serviceIndex],
  };
}

// ============================================================================
// 應用設定資料 (App Settings)
// ============================================================================

export const mockAppSettings: Record<string, AppSettings> = {
  'customer_service_phone': {
    id: 'setting-001',
    key: 'customer_service_phone',
    value: '0800-123-456',
    description: '客服專線',
  },
  'customer_service_email': {
    id: 'setting-002',
    key: 'customer_service_email',
    value: 'support@facai-b.com',
    description: '客服信箱',
  },
};

export async function getMockAppSetting(key: string) {
  await delay(100);
  return mockAppSettings[key] || null;
}

export async function updateMockAppSetting(key: string, value: string) {
  await delay(200);
  
  if (!mockAppSettings[key]) {
    return { success: false, message: '找不到設定' };
  }
  
  mockAppSettings[key].value = value;
  mockAppSettings[key].updated_at = new Date().toISOString();
  
  return { 
    success: true, 
    message: '設定已更新',
    data: mockAppSettings[key],
  };
}