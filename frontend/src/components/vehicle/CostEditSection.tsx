'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins, Loader2, Save, Pencil, X, Plus, Trash2, Check, Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useVehicleActions } from '@/hooks/useVehicles';
import {
  useVehicleExpenses,
  useVehicleExpenseActions,
  type VehicleExpense,
} from '@/hooks/useVehicleExpenses';

interface CostEditSectionProps {
  vehicleId: string;
  initialAcquisitionCost: number | null | undefined;
  initialRepairCost: number | null | undefined;
  listingPrice: number | null | undefined;
  onChanged?: () => void;
  className?: string;
}

function formatAmount(n: number | null | undefined): string {
  if (n == null || n < 0) return '未填寫';
  if (n === 0) return '$ 0';
  return `$ ${n.toLocaleString('zh-TW')}`;
}

/**
 * [v12.1] 私人成本紀錄 + 整備費細項 整合區塊
 *   - 收購成本：可編輯輸入框 (vehicles.acquisition_cost)
 *   - 整備費：展開/收合細項清單 + CRUD + 加總
 *     · 細項存在 vehicle_expenses 表（逐筆）
 *     · 基礎整備費 (vehicles.repair_cost) 維持原欄位，顯示在細項上方
 *     · 整備費總計 = 基礎整備費 + 細項加總
 *   - 預估利潤 = 售價 - 收購成本 - 整備費總計
 *
 *   資料層未改變（只動 UI 整合），原本獨立的 ExpensesSection 已不再需要
 */
export function CostEditSection({
  vehicleId,
  initialAcquisitionCost,
  initialRepairCost,
  listingPrice,
  onChanged,
  className,
}: CostEditSectionProps) {
  const { updateVehicle } = useVehicleActions();

  // ==== 收購成本 ====
  const [isEditingAcq, setIsEditingAcq] = useState(false);
  const [savingAcq, setSavingAcq] = useState(false);
  const [acquisitionCost, setAcquisitionCost] = useState<string>(
    initialAcquisitionCost != null ? String(initialAcquisitionCost) : ''
  );

  useEffect(() => {
    if (!isEditingAcq) {
      setAcquisitionCost(initialAcquisitionCost != null ? String(initialAcquisitionCost) : '');
    }
  }, [initialAcquisitionCost, isEditingAcq]);

  const handleCancelAcq = useCallback(() => {
    setAcquisitionCost(initialAcquisitionCost != null ? String(initialAcquisitionCost) : '');
    setIsEditingAcq(false);
  }, [initialAcquisitionCost]);

  const handleSaveAcq = useCallback(async () => {
    const ac = acquisitionCost === '' ? null : Number(acquisitionCost);
    if (ac !== null && (!Number.isFinite(ac) || ac < 0)) {
      toast.error('收購成本須為 ≥ 0 的整數');
      return;
    }
    setSavingAcq(true);
    try {
      const res = await updateVehicle(vehicleId, { acquisition_cost: ac });
      if (res.success) {
        toast.success('收購成本已更新');
        setIsEditingAcq(false);
        onChanged?.();
      } else {
        toast.error(res.message || '更新失敗');
      }
    } catch {
      toast.error('更新失敗');
    } finally {
      setSavingAcq(false);
    }
  }, [acquisitionCost, updateVehicle, vehicleId, onChanged]);

  // ==== 整備費細項 ====
  const { expenses, total: expensesTotal, isLoading: expLoading, refresh: refreshExp } =
    useVehicleExpenses(vehicleId);
  const { createExpense, updateExpense, deleteExpense } =
    useVehicleExpenseActions(vehicleId);

  const [expExpanded, setExpExpanded] = useState(false);
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

  const handleAddExpense = useCallback(async () => {
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
        toast.success('已新增整備費細項');
        resetNewForm();
        refreshExp();
      } else {
        toast.error(res.message || '新增失敗');
      }
    } catch {
      toast.error('新增失敗');
    } finally {
      setSubmitting(false);
    }
  }, [newItem, newAmount, newNote, createExpense, refreshExp, resetNewForm]);

  const startEdit = useCallback((e: VehicleExpense) => {
    setEditingId(e.id);
    setEditItem(e.item_name);
    setEditAmount(e.amount.toString());
    setEditNote(e.note ?? '');
  }, []);

  const cancelEdit = useCallback(() => setEditingId(null), []);

  const handleSaveEdit = useCallback(async (expenseId: string) => {
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
        refreshExp();
      } else {
        toast.error(res.message || '更新失敗');
      }
    } catch {
      toast.error('更新失敗');
    } finally {
      setSubmitting(false);
    }
  }, [editItem, editAmount, editNote, updateExpense, refreshExp]);

  const handleDelete = useCallback(async (expenseId: string) => {
    if (!confirm('確定要刪除此筆細項？')) return;
    setSubmitting(true);
    try {
      const res = await deleteExpense(expenseId);
      if (res.success) {
        toast.success('已刪除');
        refreshExp();
      } else {
        toast.error(res.message || '刪除失敗');
      }
    } catch {
      toast.error('刪除失敗');
    } finally {
      setSubmitting(false);
    }
  }, [deleteExpense, refreshExp]);

  // ==== 預估利潤 ====
  const baseRepair = initialRepairCost ?? 0;
  const totalRepairCost = baseRepair + expensesTotal;
  const acqForProfit = initialAcquisitionCost ?? 0;
  const estimatedProfit =
    listingPrice != null && listingPrice > 0
      ? listingPrice - acqForProfit - totalRepairCost
      : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-dashed border-primary-300 bg-primary-50/50 p-4',
        className
      )}
    >
      <h3 className="mb-3 flex items-center gap-1.5 text-base font-semibold text-foreground">
        <Coins className="h-4 w-4 text-primary-500" />
        🔒 私人成本紀錄
      </h3>

      {/* ===== 收購成本 ===== */}
      <div className="mb-3 rounded-lg border border-border bg-white p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">收購成本</p>
          {!isEditingAcq ? (
            <button
              type="button"
              onClick={() => setIsEditingAcq(true)}
              className="flex items-center gap-1 rounded-md bg-primary-500 px-2 py-1 text-[11px] font-medium text-white hover:bg-primary-600"
            >
              <Pencil className="h-3 w-3" />
              編輯
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleCancelAcq}
                disabled={savingAcq}
                className="rounded-md border border-border bg-white p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={handleSaveAcq}
                disabled={savingAcq}
                className="flex items-center gap-1 rounded-md bg-primary-500 px-2 py-1 text-[11px] font-medium text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {savingAcq ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                儲存
              </button>
            </div>
          )}
        </div>
        <div className="mt-1">
          {isEditingAcq ? (
            <input
              type="number"
              inputMode="numeric"
              value={acquisitionCost}
              onChange={(e) => setAcquisitionCost(e.target.value)}
              placeholder="未填寫"
              className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-base font-semibold text-foreground focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          ) : (
            <p className="text-lg font-bold text-foreground">
              {formatAmount(initialAcquisitionCost)}
            </p>
          )}
        </div>
      </div>

      {/* ===== 整備費（細項 + 加總） ===== */}
      <div className="mb-3 rounded-lg border border-border bg-white p-3">
        <button
          type="button"
          onClick={() => setExpExpanded((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-1.5">
            <Receipt className="h-4 w-4 text-primary-500" />
            <p className="text-xs text-muted-foreground">整備費</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">
              {formatAmount(totalRepairCost)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {expExpanded ? '收合 ▲' : '展開 ▼'}
            </span>
          </div>
        </button>

        {/* 細項清單（展開） */}
        <AnimatePresence initial={false}>
          {expExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 border-t border-border pt-3">
                {/* 若原本 vehicles.repair_cost 有值，顯示為基礎整備費（不可刪的既有資料） */}
                {baseRepair > 0 && (
                  <div className="mb-2 flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5 text-xs">
                    <span className="text-muted-foreground">基礎整備費（原欄位）</span>
                    <span className="font-semibold text-foreground">{formatAmount(baseRepair)}</span>
                  </div>
                )}

                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">細項清單</p>
                  <button
                    type="button"
                    onClick={() => setIsAdding((v) => !v)}
                    className="flex items-center gap-1 rounded-md bg-primary-500 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-primary-600"
                  >
                    <Plus className="h-3 w-3" />
                    新增
                  </button>
                </div>

                {/* 新增列 */}
                <AnimatePresence>
                  {isAdding && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-2 overflow-hidden"
                    >
                      <div className="space-y-1.5 rounded-md border border-dashed border-primary-300 bg-primary-50/40 p-2">
                        <input
                          type="text"
                          value={newItem}
                          onChange={(e) => setNewItem(e.target.value)}
                          placeholder="項目（例：洗車、鍍膜）"
                          className="w-full rounded-md border border-border bg-white px-2 py-1 text-sm focus:border-primary-400 focus:outline-none"
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                            placeholder="金額"
                            className="w-full rounded-md border border-border bg-white px-2 py-1 text-sm focus:border-primary-400 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="備註（選填）"
                            className="w-full rounded-md border border-border bg-white px-2 py-1 text-sm focus:border-primary-400 focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={resetNewForm}
                            disabled={submitting}
                            className="rounded-md border border-border bg-white px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted"
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            onClick={handleAddExpense}
                            disabled={submitting}
                            className="flex items-center gap-1 rounded-md bg-primary-500 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-primary-600 disabled:opacity-50"
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
                {expLoading ? (
                  <p className="text-center text-xs text-muted-foreground">載入中...</p>
                ) : expenses.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border py-3 text-center text-xs text-muted-foreground">
                    尚未新增細項
                  </p>
                ) : (
                  <ul className="space-y-1">
                    <AnimatePresence>
                      {expenses.map((e) => {
                        const editing = editingId === e.id;
                        return (
                          <motion.li
                            key={e.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="rounded-md border border-border bg-white px-2 py-1.5"
                          >
                            {editing ? (
                              <div className="space-y-1.5">
                                <input
                                  type="text"
                                  value={editItem}
                                  onChange={(ev) => setEditItem(ev.target.value)}
                                  className="w-full rounded-md border border-border bg-white px-2 py-1 text-sm focus:border-primary-400 focus:outline-none"
                                />
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    value={editAmount}
                                    onChange={(ev) => setEditAmount(ev.target.value)}
                                    className="w-full rounded-md border border-border bg-white px-2 py-1 text-sm focus:border-primary-400 focus:outline-none"
                                  />
                                  <input
                                    type="text"
                                    value={editNote}
                                    onChange={(ev) => setEditNote(ev.target.value)}
                                    placeholder="備註"
                                    className="w-full rounded-md border border-border bg-white px-2 py-1 text-sm focus:border-primary-400 focus:outline-none"
                                  />
                                </div>
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    disabled={submitting}
                                    className="rounded-md border border-border bg-white p-1 text-muted-foreground hover:bg-muted"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(e.id)}
                                    disabled={submitting}
                                    className="rounded-md bg-primary-500 p-1 text-white hover:bg-primary-600 disabled:opacity-50"
                                  >
                                    {submitting ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-foreground">
                                    {e.item_name}
                                  </p>
                                  {e.note && (
                                    <p className="truncate text-[11px] text-muted-foreground">
                                      {e.note}
                                    </p>
                                  )}
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                  {formatAmount(e.amount)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => startEdit(e)}
                                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                  aria-label="編輯"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(e.id)}
                                  className="rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                  aria-label="刪除"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 預估利潤 */}
      {estimatedProfit != null && (
        <div className="rounded-lg bg-white/60 p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">預估利潤</span>
            <span
              className={cn(
                'text-sm font-bold',
                estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {estimatedProfit >= 0 ? '+' : ''}
              {formatAmount(estimatedProfit)}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            = 售價 - 收購成本 - 整備費總計
          </p>
        </div>
      )}
    </motion.section>
  );
}
