'use client';

import { useState, useEffect } from 'react';

/**
 * 防抖 Hook - 延遲更新值
 * @param value 要防抖的值
 * @param delay 延遲時間（毫秒），預設 300ms
 * @returns 防抖後的值
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
