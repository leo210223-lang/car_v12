'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface SearchBoxProps {
  /** 佔位文字 */
  placeholder?: string;
  /** 搜尋值改變時的回調 */
  onSearch: (value: string) => void;
  /** 防抖延遲時間（毫秒） */
  debounceMs?: number;
  /** 是否載入中 */
  loading?: boolean;
  /** 額外的樣式類別 */
  className?: string;
  /** 初始值 */
  defaultValue?: string;
  /** 自動完成建議 */
  suggestions?: string[];
  /** 選擇建議時的回調 */
  onSelectSuggestion?: (value: string) => void;
}

/**
 * 搜尋框元件 - 帶防抖與自動完成
 */
export function SearchBox({
  placeholder = '搜尋...',
  onSearch,
  debounceMs = 300,
  loading = false,
  className,
  defaultValue = '',
  suggestions = [],
  onSelectSuggestion,
}: SearchBoxProps) {
  const [value, setValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 防抖處理
  const debouncedValue = useDebounce(value, debounceMs);

  // 防抖值改變時觸發搜尋
  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  // 點擊外部關閉建議列表
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 清除搜尋
  const handleClear = useCallback(() => {
    setValue('');
    inputRef.current?.focus();
  }, []);

  // 選擇建議
  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setValue(suggestion);
    setShowSuggestions(false);
    onSelectSuggestion?.(suggestion);
    inputRef.current?.focus();
  }, [onSelectSuggestion]);

  // 過濾建議
  const filteredSuggestions = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s !== value
  ).slice(0, 5);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        {/* 搜尋圖示 */}
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        
        {/* 輸入框 */}
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            'pl-10 pr-10',
            isFocused && 'ring-2 ring-primary-500 ring-offset-2'
          )}
        />
        
        {/* 右側圖示：清除或載入中 */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : value ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 hover:bg-transparent"
              onClick={handleClear}
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Button>
          ) : null}
        </div>
      </div>

      {/* 建議列表 */}
      <AnimatePresence>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-4 py-3 text-left text-base hover:bg-muted first:rounded-t-lg last:rounded-b-lg"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
