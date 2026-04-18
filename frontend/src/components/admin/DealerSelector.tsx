'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Check, Store, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Dealer } from '@/hooks/useAudit';

interface DealerSelectorProps {
  dealers: Dealer[];
  value: string | null;
  onChange: (dealerId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

/**
 * 車行選擇器元件
 * 用於代客建檔時選擇要綁定的車行
 */
export function DealerSelector({
  dealers,
  value,
  onChange,
  placeholder = '選擇車行...',
  disabled = false,
  error,
}: DealerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 選中的車行
  const selectedDealer = useMemo(
    () => dealers.find((d) => d.id === value),
    [dealers, value]
  );

  // 篩選後的車行列表
  const filteredDealers = useMemo(() => {
    if (!searchQuery.trim()) return dealers;
    const query = searchQuery.toLowerCase();
    return dealers.filter(
      (d) =>
        d.shop_name.toLowerCase().includes(query) ||
        d.contact_name.toLowerCase().includes(query) ||
        d.phone.includes(query)
    );
  }, [dealers, searchQuery]);

  const handleSelect = (dealerId: string) => {
    onChange(dealerId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      {/* 觸發按鈕 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
          disabled
            ? 'cursor-not-allowed bg-muted opacity-60'
            : 'bg-white hover:bg-primary-50',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : isOpen
              ? 'border-primary-500 ring-2 ring-primary-200'
              : 'border-primary-200'
        )}
      >
        {selectedDealer ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
              <Store className="h-4 w-4 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">{selectedDealer.shop_name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedDealer.contact_name} · {selectedDealer.phone}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* 下拉選單 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 點擊外部關閉 */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setIsOpen(false);
                setSearchQuery('');
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-hidden rounded-xl border border-primary-200 bg-card shadow-lg"
            >
              {/* 搜尋框 */}
              <div className="border-b border-primary-100 p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋車行名稱、聯絡人..."
                    className="w-full rounded-lg border border-primary-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    autoFocus
                  />
                </div>
              </div>

              {/* 車行列表 */}
              <div className="max-h-60 overflow-y-auto p-1">
                {filteredDealers.length > 0 ? (
                  filteredDealers.map((dealer) => (
                    <button
                      key={dealer.id}
                      type="button"
                      onClick={() => handleSelect(dealer.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                        value === dealer.id
                          ? 'bg-primary-100'
                          : 'hover:bg-primary-50'
                      )}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                        <Store className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{dealer.shop_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{dealer.contact_name}</span>
                          <span className="mx-1">·</span>
                          <Phone className="h-3 w-3" />
                          <span>{dealer.phone}</span>
                        </div>
                      </div>
                      {value === dealer.id && (
                        <Check className="h-5 w-5 text-primary-600" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    找不到符合的車行
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
