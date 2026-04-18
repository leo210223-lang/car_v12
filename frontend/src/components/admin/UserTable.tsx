/**
 * FaCai-B Platform - User Table Component
 * File: frontend/src/components/admin/UserTable.tsx
 * 
 * 會員列表表格元件
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  User, 
  Phone, 
  Car, 
  FileText, 
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn, formatDate } from '@/lib/utils';
import type { UserListItem } from '@/hooks/useUsers';
import type { UserStatus } from '@/types/user';

interface UserTableProps {
  users: UserListItem[];
  isLoading?: boolean;
  onApprove?: (user: UserListItem) => void;
  onReject?: (user: UserListItem) => void;
  onSuspend?: (user: UserListItem) => void;
  onReactivate?: (user: UserListItem) => void;
  onDelete?: (user: UserListItem) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: 'pending' | 'active' | 'suspended_rejected';
  onStatusFilterChange?: (status: 'pending' | 'active' | 'suspended_rejected') => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

/**
 * 會員狀態標籤
 */
function StatusBadge({ status }: { status: UserStatus }) {
  const config = {
    active: {
      className: 'bg-green-100 text-green-700',
      icon: <CheckCircle className="h-3 w-3" />,
      label: '正常',
    },
    suspended: {
      className: 'bg-red-100 text-red-700',
      icon: <Ban className="h-3 w-3" />,
      label: '停權',
    },
    pending: {
      className: 'bg-amber-100 text-amber-700',
      icon: <AlertCircle className="h-3 w-3" />,
      label: '待審核',
    },
    rejected: {
      className: 'bg-gray-100 text-gray-700',
      icon: <AlertCircle className="h-3 w-3" />,
      label: '已拒絕',
    },
  } as const;
  const current = config[status] ?? config.pending;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        current.className
      )}
    >
      {current.icon}
      {current.label}
    </span>
  );
}

/**
 * 會員列表表格
 */
export function UserTable({
  users,
  isLoading = false,
  onApprove,
  onReject,
  onSuspend,
  onReactivate,
  onDelete,
  searchValue = '',
  onSearchChange,
  statusFilter = 'pending',
  onStatusFilterChange,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: UserTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // 狀態篩選選項
  const statusOptions = [
    { value: 'pending', label: '待審核' },
    { value: 'active', label: '正常會員' },
    { value: 'suspended_rejected', label: '停權/退件' },
  ] as const;

  return (
    <div className="space-y-4">
      {/* 工具列 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 搜尋框 */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜尋會員姓名、車行、電話..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* 狀態篩選 */}
        <div className="flex items-center gap-2">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              variant={statusFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusFilterChange?.(option.value)}
              className={cn(
                statusFilter === option.value && 'bg-primary-500 text-white hover:bg-primary-600'
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-hidden rounded-xl border border-primary-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-primary-200 bg-primary-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                  會員資訊
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                  聯絡方式
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                  車輛數
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                  調做數
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                  狀態
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                  加入時間
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {isLoading ? (
                // 載入中骨架
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary-100" />
                        <div className="space-y-2">
                          <div className="h-4 w-24 rounded bg-primary-100" />
                          <div className="h-3 w-32 rounded bg-primary-100" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 rounded bg-primary-100" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="mx-auto h-4 w-8 rounded bg-primary-100" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="mx-auto h-4 w-8 rounded bg-primary-100" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="mx-auto h-6 w-16 rounded-full bg-primary-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 rounded bg-primary-100" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="mx-auto h-8 w-8 rounded bg-primary-100" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <User className="h-10 w-10 opacity-50" />
                      <p>沒有找到會員</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'group transition-colors',
                      hoveredRow === user.id && 'bg-primary-50/50'
                    )}
                    onMouseEnter={() => setHoveredRow(user.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {/* 會員資訊 */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full',
                          user.status === 'active'
                            ? 'bg-primary-100 text-primary-600'
                            : user.status === 'pending'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-red-100 text-red-600'
                        )}>
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.company_name || '未提供'}</p>
                          <p className="text-sm text-muted-foreground">{user.name || '未提供'}</p>
                        </div>
                      </div>
                    </td>

                    {/* 聯絡方式 */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-sm text-foreground">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {user.phone || '未提供'}
                        </span>
                        <span className="text-xs text-muted-foreground">{user.email || '未提供'}</span>
                      </div>
                    </td>

                    {/* 車輛數 */}
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                        <Car className="h-4 w-4 text-primary-500" />
                        {user.vehicle_count}
                      </span>
                    </td>

                    {/* 調做數 */}
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                        <FileText className="h-4 w-4 text-blue-500" />
                        {user.trade_count}
                      </span>
                    </td>

                    {/* 狀態 */}
                    <td className="px-4 py-4 text-center">
                      <div className="relative">
                        <StatusBadge status={user.status} />
                        {/* 停權原因 Tooltip */}
                        {user.status === 'suspended' && user.suspended_reason && (
                          <div className="group/tooltip relative inline-block ml-1">
                            <AlertCircle className="h-4 w-4 text-red-500 cursor-help" />
                            <div className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10">
                              <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap max-w-xs">
                                <p className="font-medium mb-1">停權原因：</p>
                                <p className="text-gray-300">{user.suspended_reason}</p>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 加入時間 */}
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>

                    {/* 操作 */}
                    <td className="px-4 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/users/${user.id}`} className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              查看詳情
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === 'pending' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => onApprove?.(user)}
                                className="text-green-600 focus:text-green-600"
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                核准會員
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onReject?.(user)}
                                className="text-gray-700 focus:text-gray-700"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                退件
                              </DropdownMenuItem>
                            </>
                          )}
                          {(user.status === 'active' || user.status === 'suspended' || user.status === 'rejected') && (
                            <>
                              {user.status === 'active' ? (
                                <DropdownMenuItem
                                  onClick={() => onSuspend?.(user)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  停權會員
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => onReactivate?.(user)}
                                  className="text-green-600 focus:text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  解除停權
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => onDelete?.(user)}
                                className="text-red-700 focus:text-red-700"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                刪除會員
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分頁 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-primary-200 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              第 {currentPage} / {totalPages} 頁
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                上一頁
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                下一頁
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
