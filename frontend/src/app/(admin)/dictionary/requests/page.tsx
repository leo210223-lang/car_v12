/**
 * FaCai-B Platform - Admin Dictionary Requests Page
 * File: frontend/src/app/(admin)/dictionary/requests/page.tsx
 * 
 * 字典申請審核頁面（P3-T09）
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileCheck, ArrowLeft, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DictionaryRequestCard } from '@/components/admin';
import { 
  useDictionaryRequests, 
  useDictionaryRequestActions 
} from '@/hooks/useDictionary';

export default function AdminDictionaryRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending');
  
  const { requests, isLoading, refresh } = useDictionaryRequests(statusFilter);
  const { approveRequest, rejectRequest } = useDictionaryRequestActions();

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <FileCheck className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">字典申請審核</h1>
            <p className="text-sm text-muted-foreground">
              審核會員提交的品牌/規格/車型新增申請
            </p>
          </div>
        </div>

        <Link href="/dictionary">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回字典管理
          </Button>
        </Link>
      </div>

      {/* 篩選器 */}
      <div className="flex items-center gap-2">
        <Button
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('pending')}
          className={statusFilter === 'pending' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
        >
          待審核
          {pendingCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
              {pendingCount}
            </span>
          )}
        </Button>
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
          className={statusFilter === 'all' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
        >
          全部記錄
        </Button>
      </div>

      {/* 申請列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 py-16">
          <Inbox className="h-16 w-16 text-gray-300 dark:text-gray-600" />
          <h2 className="mt-4 text-xl font-semibold text-gray-600 dark:text-gray-400">
            {statusFilter === 'pending' ? '沒有待審核的申請' : '沒有任何申請記錄'}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {statusFilter === 'pending' 
              ? '所有字典申請都已處理完畢' 
              : '尚無會員提交字典新增申請'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request) => (
            <DictionaryRequestCard
              key={request.id}
              request={request}
              onApprove={approveRequest}
              onReject={rejectRequest}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
