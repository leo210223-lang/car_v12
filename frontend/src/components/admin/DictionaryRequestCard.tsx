/**
 * FaCai-B Platform - 字典申請審核卡片元件
 * File: frontend/src/components/admin/DictionaryRequestCard.tsx
 * 
 * 用於審核用戶提交的字典新增申請
 */

'use client';

import { useState } from 'react';
import { 
  Check, 
  X, 
  Loader2, 
  User,
  Clock,
  Tag,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DictionaryRequest, DictionaryType } from '@/hooks/useDictionary';

// ============================================================================
// 型別標籤對應
// ============================================================================

const typeConfig: Record<DictionaryType, { label: string; color: string }> = {
  brand: { label: '品牌', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  spec: { label: '規格', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  model: { label: '車型', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

const statusConfig = {
  pending: { label: '待審核', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: '已核准', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: '已拒絕', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

// ============================================================================
// 拒絕對話框
// ============================================================================

interface RejectDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting: boolean;
  requestName: string;
}

function RejectDialog({ open, onClose, onConfirm, isSubmitting, requestName }: RejectDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('請輸入拒絕原因');
      return;
    }
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <X className="h-5 w-5" />
            拒絕申請
          </DialogTitle>
          <DialogDescription>
            您即將拒絕「{requestName}」的新增申請，請輸入拒絕原因。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">拒絕原因</label>
            <Input
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              placeholder="例如：該項目已存在、命名不符規範..."
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isSubmitting}
            variant="destructive"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                處理中...
              </>
            ) : (
              '確認拒絕'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// 字典申請卡片
// ============================================================================

interface DictionaryRequestCardProps {
  request: DictionaryRequest;
  onApprove: (id: string) => Promise<{ success: boolean; message: string }>;
  onReject: (id: string, reason: string) => Promise<{ success: boolean; message: string }>;
  onRefresh: () => void;
}

export function DictionaryRequestCard({
  request,
  onApprove,
  onReject,
  onRefresh,
}: DictionaryRequestCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const typeInfo = typeConfig[request.request_type];
  const statusInfo = statusConfig[request.status];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} 分鐘前`;
    } else if (hours < 24) {
      return `${hours} 小時前`;
    } else if (days < 7) {
      return `${days} 天前`;
    } else {
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    const result = await onApprove(request.id);
    setIsApproving(false);
    
    setMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
    
    if (result.success) {
      onRefresh();
    }
    
    setTimeout(() => setMessage(null), 3000);
  };

  const handleReject = async (reason: string) => {
    setIsRejecting(true);
    const result = await onReject(request.id, reason);
    setIsRejecting(false);
    setShowRejectDialog(false);
    
    setMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
    
    if (result.success) {
      onRefresh();
    }
    
    setTimeout(() => setMessage(null), 3000);
  };

  const isPending = request.status === 'pending';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* 訊息提示 */}
      {message && (
        <div className={`px-4 py-2 text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="p-4">
        {/* 標題區 */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={typeInfo.color}>
                {typeInfo.label}
              </Badge>
              <Badge className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {request.suggested_name}
            </h3>
            {request.parent_name && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Tag className="h-3 w-3" />
                屬於「{request.parent_name}」
              </p>
            )}
          </div>
        </div>

        {/* 申請資訊 */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <User className="h-4 w-4" />
            <span>申請者：{request.user.shop_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>申請時間：{formatDate(request.created_at)}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MessageSquare className="h-4 w-4 mt-0.5" />
            <span>申請原因：{request.reason}</span>
          </div>
        </div>

        {/* 拒絕原因（如果已拒絕） */}
        {request.status === 'rejected' && request.rejection_reason && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400">
              <strong>拒絕原因：</strong>{request.rejection_reason}
            </p>
          </div>
        )}

        {/* 操作按鈕（僅待審核顯示） */}
        {isPending && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Button
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  處理中...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  核准
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowRejectDialog(true)}
              disabled={isApproving || isRejecting}
              variant="destructive"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              拒絕
            </Button>
          </div>
        )}
      </div>

      {/* 拒絕對話框 */}
      <RejectDialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={handleReject}
        isSubmitting={isRejecting}
        requestName={request.suggested_name}
      />
    </div>
  );
}

export default DictionaryRequestCard;
