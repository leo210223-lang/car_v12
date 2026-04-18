/**
 * FaCai-B Platform - Admin Users List Page
 * File: frontend/src/app/(admin)/users/page.tsx
 * 
 * 會員管理列表頁面
 */

'use client';

import { useState, useCallback } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { useUsers, useUserActions, type UserListItem } from '@/hooks/useUsers';
import { UserTable, SuspendDialog } from '@/components/admin';
import { useDebounce } from '@/hooks';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export default function AdminUsersPage() {
  // 篩選狀態
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'active' | 'suspended_rejected'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  
  // 防抖搜尋
  const debouncedSearch = useDebounce(searchValue, 300);
  
  // 停權對話框
  const [suspendDialog, setSuspendDialog] = useState<{
    isOpen: boolean;
    user: UserListItem | null;
  }>({ isOpen: false, user: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    user: UserListItem | null;
  }>({ isOpen: false, user: null });
  
  // 取得會員資料
  const { 
    users, 
    total, 
    totalPages, 
    isLoading, 
    refresh 
  } = useUsers({
    status: statusFilter === 'pending' || statusFilter === 'active' ? statusFilter : undefined,
    status_group: statusFilter === 'suspended_rejected' ? 'suspended_rejected' : undefined,
    search: debouncedSearch,
    page: currentPage,
    limit: 20,
  });
  
  // 會員操作
  const { approveUser, rejectUser, suspendUser, reactivateUser, deleteUser, isSubmitting } = useUserActions();

  // 處理搜尋變更
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setCurrentPage(1); // 重置頁碼
  }, []);

  // 處理狀態篩選變更
  const handleStatusFilterChange = useCallback((status: 'pending' | 'active' | 'suspended_rejected') => {
    setStatusFilter(status);
    setCurrentPage(1); // 重置頁碼
  }, []);

  // 開啟停權對話框
  const handleOpenSuspendDialog = useCallback((user: UserListItem) => {
    setSuspendDialog({ isOpen: true, user });
  }, []);

  // 關閉停權對話框
  const handleCloseSuspendDialog = useCallback(() => {
    setSuspendDialog({ isOpen: false, user: null });
  }, []);

  // 確認停權
  const handleConfirmSuspend = useCallback(async (reason: string) => {
    if (!suspendDialog.user) return;
    
    const result = await suspendUser(suspendDialog.user.id, reason);
    if (result.success) {
      toast.success(result.message);
      refresh();
    } else {
      toast.error(result.message);
    }
  }, [suspendDialog.user, suspendUser, refresh]);

  // 解除停權
  const handleReactivate = useCallback(async (user: UserListItem) => {
    const result = await reactivateUser(user.id);
    if (result.success) {
      toast.success(result.message);
      refresh();
    } else {
      toast.error(result.message);
    }
  }, [reactivateUser, refresh]);

  const handleApprove = useCallback(async (user: UserListItem) => {
    const result = await approveUser(user.id);
    if (result.success) {
      toast.success(result.message);
      refresh();
    } else {
      toast.error(result.message);
    }
  }, [approveUser, refresh]);

  const handleReject = useCallback(async (user: UserListItem) => {
    const reason = window.prompt('請輸入退件原因（可留空）') || undefined;
    const result = await rejectUser(user.id, reason);
    if (result.success) {
      toast.success(result.message);
      refresh();
    } else {
      toast.error(result.message);
    }
  }, [rejectUser, refresh]);

  const handleOpenDeleteDialog = useCallback((user: UserListItem) => {
    setDeleteDialog({ isOpen: true, user });
  }, []);

  const handleDeleteUser = useCallback(async () => {
    if (!deleteDialog.user) return;
    const result = await deleteUser(deleteDialog.user.id);
    if (result.success) {
      toast.success(result.message);
      setDeleteDialog({ isOpen: false, user: null });
      refresh();
    } else {
      toast.error(result.message);
    }
  }, [deleteDialog.user, deleteUser, refresh]);

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
            <Users className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">會員管理</h1>
            <p className="text-sm text-muted-foreground">
              共 {total} 位會員
            </p>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="flex gap-4">
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2">
            <p className="text-xs text-green-600">正常</p>
            <p className="text-xl font-bold text-green-700">
              {users.filter(u => u.status === 'active').length}
            </p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2">
            <p className="text-xs text-red-600">停權</p>
            <p className="text-xl font-bold text-red-700">
              {users.filter(u => u.status === 'suspended').length}
            </p>
          </div>
        </div>
      </div>

      {/* 會員列表 */}
      <UserTable
        users={users}
        isLoading={isLoading}
        onApprove={handleApprove}
        onReject={handleReject}
        onSuspend={handleOpenSuspendDialog}
        onReactivate={handleReactivate}
        onDelete={handleOpenDeleteDialog}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* 停權對話框 */}
      <SuspendDialog
        isOpen={suspendDialog.isOpen}
        onClose={handleCloseSuspendDialog}
        onConfirm={handleConfirmSuspend}
        userName={suspendDialog.user?.name}
        shopName={suspendDialog.user?.company_name}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => setDeleteDialog({ isOpen: open, user: open ? deleteDialog.user : null })}
        title="確定要永久刪除此會員嗎？"
        description={(
          <span className="text-red-600">
            警告：該會員發布的所有車輛與調做需求將會一併永久刪除，此操作無法復原！
          </span>
        )}
        confirmLabel="確認永久刪除"
        cancelLabel="取消"
        onConfirm={handleDeleteUser}
        destructive
        loading={isSubmitting}
      />
    </div>
  );
}
