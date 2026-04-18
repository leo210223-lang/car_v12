'use client';

import { useState, useCallback } from 'react';
import { DollarSign, Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CostInputProps {
  /** 欄位標籤 */
  label: string;
  /** 值 */
  value: number | undefined;
  /** 變更回調 */
  onChange: (value: number | undefined) => void;
  /** 佔位文字 */
  placeholder?: string;
  /** 額外樣式 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 成本輸入元件 - 僅車主可見的金額輸入
 */
export function CostInput({
  label,
  value,
  onChange,
  placeholder = '請輸入金額',
  className,
  disabled = false,
}: CostInputProps) {
  const [showValue, setShowValue] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      if (raw === '') {
        onChange(undefined);
      } else {
        onChange(Number(raw));
      }
    },
    [onChange]
  );

  const displayValue = value !== undefined
    ? showValue
      ? value.toString()
      : '••••••'
    : '';

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Lock className="h-3.5 w-3.5 text-primary-500" />
        {label}
        <span className="text-xs text-muted-foreground">(僅自己可見)</span>
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type={showValue ? 'text' : 'password'}
          inputMode="numeric"
          value={showValue ? (value?.toString() ?? '') : displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-10 text-sm text-foreground transition-colors',
            'placeholder:text-muted-foreground/50',
            'focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />
        <button
          type="button"
          onClick={() => setShowValue(!showValue)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
        >
          {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {value !== undefined && showValue && (
        <p className="text-xs text-muted-foreground">
          {(value / 10000).toFixed(1)} 萬元
        </p>
      )}
    </div>
  );
}
