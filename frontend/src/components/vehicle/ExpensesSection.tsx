'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, X, Check, Loader2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useVehicleExpenses,
  useVehicleExpenseActions,
  type VehicleExpense,
} from '@/hooks/useVehicleExpenses';

interface ExpensesSectionProps {
  vehicleId: string;
  /** 車輛基礎整備費（vehicles.repair_cost），僅顯示用 */
  baseRepairCost?: number | null;
  className?: string;
}

function formatAmount(n: number): string {
  return `$ ${n.toLocaleString('zh-TW')}`;
}

/**
 * 整備費細項區塊 — 供「我的車編輯」頁使用
 * 車行可以逐筆記錄：洗車 800 / 鍍膜 2000 …，自動加總
 */
export function ExpensesSection({
  vehicleId,
  baseRepairCost,
  className,
}: ExpensesSectionProps) {
  const { expenses, total, isLoading, refresh } = useVehicleExpenses(vehicleId);
  const { createExpense, updateExpense, deleteExpense } =
    useVehicleExpenseActions(vehicleId);

  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');

  const resetNewForm = useCallback(() => {
    setIsAdding(false);
    setNewItem('');
    setNewAmount('');
    setNewNote('');
  }, []);

  const handleAdd = useCallback(async () => {
    const item = newItem.trim();
    const amount = Number(newAmount);
    if (!item) {
      toast.error('請輸入項目名稱');
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error('金額格式不正確');
      return;
    }
    setSubmitting(true);
    try {
      const res = await createExpense({
        item_name: item,
        amount,
        note: newNote.trim() || undefined,
      });
      if (res.success) {
        toast.success('已新增細項');
        resetNewForm();
        refresh();
      } else {
        toast.error(res.message || '新增失敗');
      }
    } catch {
      toast.error('新增失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }, [newItem, newAmount, newNote, createExpense, refresh, resetNewForm]);

  const startEdit = useCallback((expense: VehicleExpense) => {
    setEditingId(expense.id);
    setEditItem(expense.item_name);
    setEditAmount(expense.amount.toString());
    setEditNote(expense.note ?? '');
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleSaveEdit = useCallback(
    async (expenseId: string) => {
      const item = editItem.trim();
      const amount = Number(editAmount);
      if (!item) {
        toast.error('請輸入項目名稱');
        return;
      }
      if (!Number.isFinite(amount) || amount < 0) {
        toast.error('金額格式不正確');
        return;
      }
      setSubmitting(true);
      try {
        const res = await updateExpense(expenseId, {
          item_name: item,
          amount,
          note: editNote.trim() || undefined,
        });
        if (res.success) {
          toast.success('已更新');
          setEditingId(null);
          refresh();
        } else {
          toast.error(res.message || '更新失敗');
        }
      } catch {
        toast.error('更新失敗');
      } finally {
        setSubmitting(false);
      }
    },
    [editItem, editAmount, editNote, updateExpense, refresh]
  );

  const handleDelete = useCallback(
    async (expenseId: string) => {
      if (!confirm('確定要刪除此筆整備費？')) return;
      setSubmitting(true);
      try {
        const res = await deleteExpense(expenseId);
        if (res.success) {
          toast.success('已刪除');
          refresh();
        } else {
          toast.error(res.message || '刪除失敗');
        }
      } catch {
        toast.error('刪除失敗');
      } finally {
        setSubmitting(false);
      }
    },
    [deleteExpense, refresh]
  );

  const baseAmount = baseRepairCost ?? 0;
  const grandTotal = baseAmount + total;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-border bg-card p-4',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
          <Receipt className="h-4 w-4 text-primary-500" />
          整備費細項做帳
        </h3>
        <button
          type="button"
          onClick={() => setIsAdding((v) => !v)}
          className="flex items-center gap-1 rounded-md bg-primary-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary-600 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          新增
        </button>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        逐筆記錄每一項開銷（洗車、鍍膜、鈑金…），系統會自動加總。此資訊僅您自己可見。
      </p>

      {/* 新增列 */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="space-y-2 rounded-lg border border-dashed border-primary-300 bg-primary-50/40 p-3">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="項目名稱（例如：洗車、鍍膜）"
                className="w-full rounded-md border border-border bg-white px-2.5 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="金額"
                  className="w-full rounded-md border border-border bg-white px-2.5 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="備註（選填）"
                  className="w-full rounded-md border border-border bg-white px-2.5 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetNewForm}
                  disabled={submitting}
                  className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={submitting}
                  className="flex items-center gap-1 rounded-md bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  儲存
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 細項列表 */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          尚未新增任何整備費細項
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          <AnimatePresence>
            {expenses.map((e) => {
              const isEditing = editingId === e.id;
              return (
                <motion.li
                  key={e.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 py-2"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editItem}
                        onChange={(ev) => setEditItem(ev.target.value)}
                        className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={editAmount}
                          onChange={(ev) => setEditAmount(ev.target.value)}
                          className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                        />
                        <input
                          type="text"
                          value={editNote}
                          onChange={(ev) => setEditNote(ev.target.value)}
                          placeholder="備註"
                          className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                        />
                      </div>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={submitting}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(e.id)}
                          disabled={submitting}
                          className="rounded-md bg-primary-500 p-1.5 text-white hover:bg-primary-600 disabled:opacity-50"
                        >
                          {submitting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {e.item_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {e.expense_date}
                          </span>
                        </div>
                        {e.note && (
                          <p className="truncate text-xs text-muted-foreground">
                            {e.note}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="mr-1 text-sm font-semibold text-foreground">
                          {formatAmount(e.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEdit(e)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="編輯"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(e.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                          title="刪除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {/* 加總 */}
      <div className="mt-3 space-y-1 rounded-lg bg-muted/60 px-3 py-2 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>基礎整備費（vehicles.repair_cost）</span>
          <span>{formatAmount(baseAmount)}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>細項加總</span>
          <span>{formatAmount(total)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-1 font-semibold text-foreground">
          <span>整備費總計</span>
          <span>{formatAmount(grandTotal)}</span>
        </div>
      </div>
    </motion.section>
  );
}
