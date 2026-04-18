/**
 * FaCai-B Platform - Admin Dictionary Management Page
 * File: frontend/src/app/(admin)/dictionary/page.tsx
 * 
 * 字典管理頁面（P3-T09）
 */

'use client';

import Link from 'next/link';
import { BookOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DictionaryManager } from '@/components/admin';
import { useDictionaryRequests } from '@/hooks/useDictionary';

export default function AdminDictionaryPage() {
  // 取得待審核申請數量
  const { requests } = useDictionaryRequests('pending');
  const pendingCount = requests.length;

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <BookOpen className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">字典管理</h1>
            <p className="text-sm text-muted-foreground">
              管理品牌、規格、車型等字典資料
            </p>
          </div>
        </div>

        <Link href="/dictionary/requests">
          <Button 
            variant="outline" 
            className="border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          >
            <FileText className="h-4 w-4 mr-2" />
            字典申請審核
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                {pendingCount}
              </span>
            )}
          </Button>
        </Link>
      </div>

      {/* 字典管理元件 */}
      <DictionaryManager />
    </div>
  );
}
