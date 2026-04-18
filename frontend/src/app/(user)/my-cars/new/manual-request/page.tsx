'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useManualVehicleRequestActions, useMyManualVehicleRequests } from '@/hooks/useManualVehicleRequests';
import { cn } from '@/lib/utils';

type Transmission = 'auto' | 'manual' | 'semi_auto' | 'cvt';
type FuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const COLOR_OPTIONS = [
  '白色', '黑色', '銀色', '灰色', '紅色', '藍色',
  '綠色', '黃色', '橘色', '棕色', '金色', '其他',
];

const TRANSMISSION_OPTIONS = [
  { value: '', label: '不指定' },
  { value: 'auto', label: '自排' },
  { value: 'manual', label: '手排' },
  { value: 'semi_auto', label: '手自排' },
  { value: 'cvt', label: 'CVT' },
];

const FUEL_OPTIONS = [
  { value: '', label: '不指定' },
  { value: 'gasoline', label: '汽油' },
  { value: 'diesel', label: '柴油' },
  { value: 'hybrid', label: '油電混合' },
  { value: 'electric', label: '純電' },
];

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: '審核中', cls: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已核准', cls: 'bg-green-100 text-green-800' },
  rejected: { label: '已退回', cls: 'bg-red-100 text-red-800' },
};

export default function ManualRequestPage() {
  const router = useRouter();
  const { create } = useManualVehicleRequestActions();
  const { requests, refresh } = useMyManualVehicleRequests();

  const [brandText, setBrandText] = useState('');
  const [specText, setSpecText] = useState('');
  const [modelText, setModelText] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [color, setColor] = useState('');
  const [mileage, setMileage] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [repairCost, setRepairCost] = useState('');
  const [description, setDescription] = useState('');
  const [contactNote, setContactNote] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!brandText.trim()) {
        toast.error('請至少填寫品牌');
        return;
      }
      setSubmitting(true);
      try {
        const payload: Parameters<typeof create>[0] = {
          brand_text: brandText.trim(),
          spec_text: specText.trim() || undefined,
          model_text: modelText.trim() || undefined,
          year: year ? Number(year) : undefined,
          color: color || undefined,
          mileage: mileage ? Number(mileage) : undefined,
          transmission: (transmission || undefined) as Transmission | undefined,
          fuel_type: (fuelType || undefined) as FuelType | undefined,
          listing_price: listingPrice ? Number(listingPrice) : undefined,
          acquisition_cost: acquisitionCost ? Number(acquisitionCost) : undefined,
          repair_cost: repairCost ? Number(repairCost) : undefined,
          description: description.trim() || undefined,
          contact_note: contactNote.trim() || undefined,
          images: [],
        };

        const res = await create(payload);
        if (res.success) {
          toast.success('已送出申請，管理員審核後將通知您');
          // 清空表單
          setBrandText('');
          setSpecText('');
          setModelText('');
          setYear('');
          setColor('');
          setMileage('');
          setTransmission('');
          setFuelType('');
          setListingPrice('');
          setAcquisitionCost('');
          setRepairCost('');
          setDescription('');
          setContactNote('');
          refresh();
        } else {
          toast.error(res.message || '送出失敗');
        }
      } catch {
        toast.error('送出失敗，請稍後再試');
      } finally {
        setSubmitting(false);
      }
    },
    [
      brandText, specText, modelText, year, color, mileage, transmission, fuelType,
      listingPrice, acquisitionCost, repairCost, description, contactNote, create, refresh,
    ]
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-4 pb-24">
      {/* 頂部導航 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-3"
      >
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-amber-700 shadow-lg">
            <HelpCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">申請代上傳</h1>
            <p className="text-xs text-muted-foreground">找不到車輛時由管理員代為建立</p>
          </div>
        </div>
      </motion.div>

      <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
        💡 請盡可能填寫車輛資訊，管理員會手動確認並建立對應的品牌/規格/車型字典，之後審核通過後，車輛將自動歸到您的帳號。
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 品牌 * */}
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">品牌 *</label>
          <input
            type="text"
            value={brandText}
            onChange={(e) => setBrandText(e.target.value)}
            placeholder="例：Tesla、BYD、小米..."
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">規格 / 車系</label>
            <input
              type="text"
              value={specText}
              onChange={(e) => setSpecText(e.target.value)}
              placeholder="例：Model 3"
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">車型</label>
            <input
              type="text"
              value={modelText}
              onChange={(e) => setModelText(e.target.value)}
              placeholder="例：長續航版"
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">年份</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">不指定</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">顏色</label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">不指定</option>
              {COLOR_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">里程 (km)</label>
            <input
              type="number"
              inputMode="numeric"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="選填"
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">變速箱</label>
            <select
              value={transmission}
              onChange={(e) => setTransmission(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {TRANSMISSION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">燃油</label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {FUEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">售價</label>
            <input
              type="number"
              inputMode="numeric"
              value={listingPrice}
              onChange={(e) => setListingPrice(e.target.value)}
              placeholder="選填"
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">收購成本</label>
            <input
              type="number"
              inputMode="numeric"
              value={acquisitionCost}
              onChange={(e) => setAcquisitionCost(e.target.value)}
              placeholder="選填"
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">整備費</label>
            <input
              type="number"
              inputMode="numeric"
              value={repairCost}
              onChange={(e) => setRepairCost(e.target.value)}
              placeholder="選填"
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">車輛描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="請描述車況、配備、其他資訊..."
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-base focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">給管理員的備註</label>
          <textarea
            value={contactNote}
            onChange={(e) => setContactNote(e.target.value)}
            placeholder="例如：想上哪天、有附圖片會另寄給管理員..."
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-base focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full py-3 text-base font-semibold"
          size="lg"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              送出中...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              送出申請
            </span>
          )}
        </Button>
      </form>

      {/* 我已送出的申請 */}
      {requests.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">我的申請</h2>
          <ul className="space-y-2">
            {requests.map((r) => {
              const badge = STATUS_LABEL[r.status] ?? STATUS_LABEL.pending;
              return (
                <li
                  key={r.id}
                  className="rounded-lg border border-border bg-card px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {r.brand_text} {r.spec_text ?? ''} {r.model_text ?? ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString('zh-TW')}
                      </p>
                    </div>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', badge.cls)}>
                      {badge.label}
                    </span>
                  </div>
                  {r.rejection_reason && (
                    <p className="mt-1.5 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
                      退回原因：{r.rejection_reason}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
