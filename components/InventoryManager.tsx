import React, { useState, useMemo } from 'react';
import { Equipment, EquipmentStatus } from '../types';
import { Plus, Search, Box, Trash2, Edit, Save, X, AlertTriangle, ZoomIn } from 'lucide-react';
import { useToast } from './Toast';
import { useImagePreview } from './ImagePreview';
import { api } from '../api';

interface InventoryManagerProps {
  inventory: Equipment[];
  onUpdate: (updatedInventory: Equipment[]) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, onUpdate }) => {
  const { showToast } = useToast();
  const { previewImage } = useImagePreview();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<Equipment | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Equipment>>({});

  // Delete Modal State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract unique categories for autocomplete
  const existingCategories = useMemo(() => {
    return Array.from(new Set(inventory.map(i => i.category))).sort();
  }, [inventory]);

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (item: Equipment) => {
    setFormData(item);
    setIsEditing(item);
    setIsAdding(false);
  };

  const handleAddNew = () => {
    setFormData({
      id: crypto.randomUUID(),
      name: '',
      category: '',
      owner: '6Y1',
      stock: 1,
      status: EquipmentStatus.NORMAL,
      dimensions: '',
      weight: '',
      description: '',
      imageUrl: ''
    });
    setIsAdding(true);
    setIsEditing(null);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      try {
        await api.deleteInventory(deletingId);
        onUpdate(inventory.filter(i => i.id !== deletingId));
        showToast('設備已刪除', 'info');
      } catch (e) {
        console.error(e);
        showToast('刪除失敗，請稍後再試', 'error');
      }
      setDeletingId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem = formData as Equipment;

    if (isEditing) {
      onUpdate(inventory.map(i => i.id === newItem.id ? newItem : i));
      showToast('設備更新成功', 'success');
    } else {
      onUpdate([...inventory, newItem]);
      showToast('設備新增成功', 'success');
    }
    setIsEditing(null);
    setIsAdding(false);
  };

  // Image Compression Utility
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800; // Limit max dimension to 800px

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          // Draw image to canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with 0.6 quality for better compression
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic check
      if (!file.type.startsWith('image/')) {
        showToast('請選擇有效的圖片檔案', 'error');
        return;
      }

      // Notify if large
      if (file.size > 2 * 1024 * 1024) {
        showToast('圖片較大，正在壓縮處理中...', 'info');
      }

      try {
        const compressedDataUrl = await compressImage(file);

        // Convert DataURL to File for Upload
        const res = await fetch(compressedDataUrl);
        const blob = await res.blob();
        const fileToUpload = new File([blob], "uploaded_image.jpg", { type: "image/jpeg" });

        showToast('正在上傳圖片至雲端...', 'info');
        const cloudUrl = await api.uploadImage(fileToUpload);

        setFormData({ ...formData, imageUrl: cloudUrl });
        showToast('圖片上傳成功', 'success');
      } catch (err) {
        console.error("Image processing/upload error:", err);
        showToast('圖片上傳失敗，請稍後再試', 'error');
      }
    }
  };

  if (isAdding || isEditing) {
    return (
      <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">{isAdding ? '新增設備' : '編輯設備'}</h2>
          <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">設備名稱</label>
              <input required className="w-full mt-1 p-2 border border-slate-300 rounded bg-white text-slate-900" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">分類</label>
                <input
                  list="category-list"
                  required
                  className="w-full mt-1 p-2 border border-slate-300 rounded bg-white text-slate-900"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="輸入或選擇..."
                />
                <datalist id="category-list">
                  {existingCategories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">保管單位</label>
                <input required className="w-full mt-1 p-2 border border-slate-300 rounded bg-white text-slate-900" value={formData.owner} onChange={e => setFormData({ ...formData, owner: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">總庫存</label>
                <input type="number" min="0" required className="w-full mt-1 p-2 border border-slate-300 rounded bg-white text-slate-900" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">單位</label>
                <input className="w-full mt-1 p-2 border border-slate-300 rounded bg-white text-slate-900" value={formData.unit || '個'} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">狀態</label>
              <select className="w-full mt-1 p-2 border border-slate-300 rounded bg-white text-slate-900" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as EquipmentStatus })}>
                {Object.values(EquipmentStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">尺寸 (L x W x H)</label>
                <input className="w-full mt-1 p-2 border border-slate-300 rounded bg-white text-slate-900" value={formData.dimensions} onChange={e => setFormData({ ...formData, dimensions: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">重量 (kg)</label>
                <input className="w-full mt-1 p-2 border border-slate-300 rounded bg-white text-slate-900" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">描述</label>
              <textarea className="w-full mt-1 p-2 border border-slate-300 rounded bg-white text-slate-900" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">圖片</label>
              <div className="mt-1 flex items-center gap-4">
                <div
                  className={`w-24 h-24 bg-slate-100 border border-slate-200 rounded flex items-center justify-center overflow-hidden relative group cursor-pointer ${!formData.imageUrl ? 'cursor-default' : ''}`}
                  onClick={() => formData.imageUrl && previewImage(formData.imageUrl, '預覽')}
                >
                  {formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                      </div>
                    </>
                  ) : (
                    <Box className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  <p className="text-xs text-slate-500 mt-2">支援 JPG, PNG. 系統將自動壓縮圖片以節省空間。</p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => { setIsAdding(false); setIsEditing(null); }} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 bg-white hover:bg-slate-50">取消</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center shadow-sm">
              <Save className="w-4 h-4 mr-2" /> 儲存
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full transform transition-all">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">確認刪除</h3>
            </div>
            <p className="text-slate-600 mb-6">確定要刪除此設備嗎？<br />此動作無法復原。</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md">取消</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm">確認刪除</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="搜尋名稱、分類、保管單位..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
        </div>
        <button onClick={handleAddNew} className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
          <Plus className="w-5 h-5 mr-2" /> 新增設備
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredInventory.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
            <div
              className={`aspect-video bg-slate-100 relative overflow-hidden group/image ${item.imageUrl ? 'cursor-zoom-in' : ''}`}
              onClick={() => item.imageUrl && previewImage(item.imageUrl, item.name)}
            >
              {item.imageUrl ? (
                <>
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors flex items-center justify-center">
                    <ZoomIn className="text-white opacity-0 group-hover/image:opacity-100 transition-opacity drop-shadow-md" size={32} />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Box size={48} />
                </div>
              )}
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10">
                {item.category}
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 line-clamp-1" title={item.name}>{item.name}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.stock} {item.unit}
                </span>
              </div>
              <div className="text-sm text-slate-500 mb-4 space-y-1">
                <p>狀態: <span className="text-slate-700">{item.status}</span></p>
                <p>規格: {item.dimensions || '-'} / {item.weight || '-'}</p>
              </div>
              {/* Fixed opacity-0 issue: Buttons always visible on touch devices or simplify hover */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={18} /></button>
                <button onClick={() => handleDeleteClick(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredInventory.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Box size={48} className="mx-auto mb-4 opacity-30" />
          <p>沒有找到符合條件的設備</p>
        </div>
      )}
    </div>
  );
};