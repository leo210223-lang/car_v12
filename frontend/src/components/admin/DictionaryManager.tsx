/**
 * FaCai-B Platform - 字典管理元件
 * File: frontend/src/components/admin/DictionaryManager.tsx
 * 
 * 管理品牌、規格、車型的 CRUD 操作
 */

'use client';

import { useState, useCallback } from 'react';
import { 
  Plus, 
  Edit2, 
  Check, 
  X, 
  ToggleLeft, 
  ToggleRight,
  Loader2,
  ChevronRight,
  Search,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useBrands,
  useSpecs,
  useModels,
  useDictionaryActions,
  type DictionaryType,
} from '@/hooks/useDictionary';
import type { Brand, Spec, Model } from '@/hooks/useCascadingSelect';

// ============================================================================
// 子元件：字典項目列表
// ============================================================================

interface DictionaryItemRowProps {
  item: Brand | Spec | Model;
  type: DictionaryType;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit: (id: string, name: string) => void;
  onToggle: (id: string, currentActive: boolean) => void;
  isUpdating?: boolean;
  hasChildren?: boolean;
}

function DictionaryItemRow({
  item,
  type,
  isSelected,
  onSelect,
  onEdit,
  onToggle,
  isUpdating,
  hasChildren,
}: DictionaryItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);

  const handleSave = () => {
    if (editName.trim() && editName !== item.name) {
      onEdit(item.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(item.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const typeLabel = {
    brand: '品牌',
    spec: '規格',
    model: '車型',
  }[type];

  return (
    <div
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
        ${isSelected 
          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' 
          : 'border-gray-200 dark:border-gray-700 hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
        }
        ${!item.is_active ? 'opacity-60' : ''}
      `}
    >
      {/* 選擇按鈕（如果有子層級） */}
      {hasChildren && (
        <button
          onClick={onSelect}
          className="shrink-0 p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30"
          title={`選擇此${typeLabel}查看下層`}
        >
          <ChevronRight 
            className={`h-4 w-4 transition-transform ${isSelected ? 'rotate-90 text-amber-600' : 'text-gray-400'}`} 
          />
        </button>
      )}

      {/* 名稱 */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
            autoFocus
          />
        ) : (
          <span className="block truncate">{item.name}</span>
        )}
      </div>

      {/* 狀態標籤 */}
      <Badge 
        variant={item.is_active ? 'default' : 'secondary'}
        className={item.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
      >
        {item.is_active ? '啟用' : '停用'}
      </Badge>

      {/* 操作按鈕 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isEditing ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-7 w-7 p-0 text-gray-600 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 p-0"
              disabled={isUpdating}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggle(item.id, item.is_active)}
              className={`h-7 w-7 p-0 ${item.is_active ? 'text-orange-600' : 'text-green-600'}`}
              disabled={isUpdating}
              title={item.is_active ? '停用' : '啟用'}
            >
              {item.is_active ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 子元件：新增項目對話框
// ============================================================================

interface AddItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  type: DictionaryType;
  parentName?: string;
  isSubmitting: boolean;
}

function AddItemDialog({
  open,
  onClose,
  onSubmit,
  type,
  parentName,
  isSubmitting,
}: AddItemDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const typeLabel = {
    brand: '品牌',
    spec: '規格',
    model: '車型',
  }[type];

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('請輸入名稱');
      return;
    }
    setError(null);
    await onSubmit(name.trim());
    setName('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-amber-500" />
            新增{typeLabel}
          </DialogTitle>
          {parentName && (
            <DialogDescription>
              將新增至「{parentName}」下
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{typeLabel}名稱</label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={`請輸入${typeLabel}名稱`}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
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
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                新增中...
              </>
            ) : (
              '確認新增'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// 子元件：單一字典類型管理面板
// ============================================================================

interface DictionaryPanelProps {
  title: string;
  type: DictionaryType;
  items: (Brand | Spec | Model)[];
  isLoading: boolean;
  selectedId?: string;
  onSelect?: (id: string) => void;
  onAdd: (name: string) => Promise<{ success: boolean; message: string }>;
  onEdit: (id: string, name: string) => Promise<{ success: boolean; message: string }>;
  onToggle: (id: string, currentActive: boolean) => Promise<{ success: boolean; message: string }>;
  parentName?: string;
  hasChildren?: boolean;
  onRefresh: () => void;
}

function DictionaryPanel({
  title,
  type,
  items,
  isLoading,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onToggle,
  parentName,
  hasChildren,
  onRefresh,
}: DictionaryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async (name: string) => {
    setIsSubmitting(true);
    const result = await onAdd(name);
    setIsSubmitting(false);
    
    setMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
    setTimeout(() => setMessage(null), 3000);
    
    if (result.success) {
      onRefresh();
    }
  };

  const handleEdit = async (id: string, name: string) => {
    const result = await onEdit(id, name);
    setMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
    setTimeout(() => setMessage(null), 3000);
    
    if (result.success) {
      onRefresh();
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    const result = await onToggle(id, currentActive);
    setMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
    setTimeout(() => setMessage(null), 3000);
    
    if (result.success) {
      onRefresh();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 標題列 */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            {parentName && (
              <p className="text-xs text-gray-500 mt-0.5">
                屬於「{parentName}」
              </p>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            新增
          </Button>
        </div>
      </div>

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

      {/* 搜尋列 */}
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* 列表 */}
      <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? '找不到符合的項目' : '尚無資料'}
          </div>
        ) : (
          filteredItems.map((item) => (
            <DictionaryItemRow
              key={item.id}
              item={item}
              type={type}
              isSelected={selectedId === item.id}
              onSelect={() => onSelect?.(item.id)}
              onEdit={handleEdit}
              onToggle={handleToggle}
              hasChildren={hasChildren}
            />
          ))
        )}
      </div>

      {/* 統計 */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500">
        共 {items.length} 項，啟用 {items.filter(i => i.is_active).length} 項
      </div>

      {/* 新增對話框 */}
      <AddItemDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAdd}
        type={type}
        parentName={parentName}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

// ============================================================================
// 主元件：字典管理器
// ============================================================================

export function DictionaryManager() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>();
  const [selectedSpecId, setSelectedSpecId] = useState<string | undefined>();

  // 資料 Hooks
  const { brands, isLoading: brandsLoading, refresh: refreshBrands } = useBrands();
  const { specs, isLoading: specsLoading, refresh: refreshSpecs } = useSpecs(selectedBrandId);
  const { models, isLoading: modelsLoading, refresh: refreshModels } = useModels(selectedSpecId);

  // 操作 Hooks
  const actions = useDictionaryActions();

  // 取得選中項目名稱
  const selectedBrand = brands.find(b => b.id === selectedBrandId);
  const selectedSpec = specs.find(s => s.id === selectedSpecId);

  // 處理品牌選擇
  const handleBrandSelect = useCallback((id: string) => {
    if (selectedBrandId === id) {
      setSelectedBrandId(undefined);
      setSelectedSpecId(undefined);
    } else {
      setSelectedBrandId(id);
      setSelectedSpecId(undefined);
    }
  }, [selectedBrandId]);

  // 處理規格選擇
  const handleSpecSelect = useCallback((id: string) => {
    if (selectedSpecId === id) {
      setSelectedSpecId(undefined);
    } else {
      setSelectedSpecId(id);
    }
  }, [selectedSpecId]);

  return (
    <div className="space-y-6">
      {/* 說明區塊 */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <h3 className="font-semibold text-amber-800 dark:text-amber-400 mb-2">
          📚 字典管理說明
        </h3>
        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
          <li>• 字典資料為階層式結構：品牌 → 規格 → 車型</li>
          <li>• 點擊品牌/規格的 ▶ 可展開查看下層項目</li>
          <li>• 停用的項目不會出現在用戶的選單中</li>
          <li>• 編輯名稱後按 Enter 儲存，按 Esc 取消</li>
        </ul>
      </div>

      {/* 三層字典管理面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 品牌面板 */}
        <DictionaryPanel
          title="品牌管理"
          type="brand"
          items={brands}
          isLoading={brandsLoading}
          selectedId={selectedBrandId}
          onSelect={handleBrandSelect}
          onAdd={async (name) => actions.addBrand(name)}
          onEdit={async (id, name) => actions.updateBrand(id, name)}
          onToggle={async (id, currentActive) => actions.toggleBrandActive(id, !currentActive)}
          hasChildren
          onRefresh={refreshBrands}
        />

        {/* 規格面板 */}
        <DictionaryPanel
          title="規格管理"
          type="spec"
          items={specs}
          isLoading={specsLoading}
          selectedId={selectedSpecId}
          onSelect={handleSpecSelect}
          onAdd={async (name) => {
            if (!selectedBrandId) {
              return { success: false, message: '請先選擇品牌' };
            }
            return actions.addSpec(name, selectedBrandId);
          }}
          onEdit={async (id, name) => actions.updateSpec(id, name)}
          onToggle={async (id, currentActive) => actions.toggleSpecActive(id, !currentActive)}
          parentName={selectedBrand?.name}
          hasChildren
          onRefresh={refreshSpecs}
        />

        {/* 車型面板 */}
        <DictionaryPanel
          title="車型管理"
          type="model"
          items={models}
          isLoading={modelsLoading}
          onAdd={async (name) => {
            if (!selectedSpecId) {
              return { success: false, message: '請先選擇規格' };
            }
            return actions.addModel(name, selectedSpecId);
          }}
          onEdit={async (id, name) => actions.updateModel(id, name)}
          onToggle={async (id, currentActive) => actions.toggleModelActive(id, !currentActive)}
          parentName={selectedSpec?.name}
          onRefresh={refreshModels}
        />
      </div>
    </div>
  );
}

export default DictionaryManager;
