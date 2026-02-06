import React, { useState, useMemo } from 'react';
import { Event, EventStatus, Equipment, Allocation, ConflictAlert, WorkflowItem } from '../types';
import { formatDate, checkStockAvailability, WORKFLOW_TEMPLATE } from '../utils';
import { api } from '../api';
import { Plus, Calendar as CalendarIcon, List, ArrowLeft, Trash2, Edit, Save, CheckSquare, ChevronLeft, ChevronRight, AlertTriangle, Users, Archive, Layout, PlayCircle, Layers, Clock, Search, X, ClipboardList, RefreshCw, ZoomIn } from 'lucide-react';
import { useToast } from './Toast';
import { useImagePreview } from './ImagePreview';

interface EventManagerProps {
  events: Event[];
  inventory: Equipment[];
  onUpdate: (updatedEvents: Event[]) => void;
  onNavigateToChecklist: (event: Event) => void;
  conflicts?: ConflictAlert[];
}

type TabType = 'active' | 'planning' | 'archived' | 'all';

// --- Sub-component: Equipment Selector Modal ---
// Moved outside main component to avoid Rules of Hooks violation
const EquipmentSelectorModal = ({
  inventory,
  existingIds,
  onClose,
  onConfirm
}: {
  inventory: Equipment[];
  existingIds: Set<string>;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}) => {
  const { previewImage } = useImagePreview();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [tempSelected, setTempSelected] = useState<Set<string>>(new Set());

  const categories = useMemo(() => Array.from(new Set(inventory.map(i => i.category))).sort(), [inventory]);

  const filteredItems = inventory.filter(i =>
    (category === '' || i.category === category) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelect = (id: string) => {
    const newSet = new Set(tempSelected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setTempSelected(newSet);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">選擇設備</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800"><X /></button>
        </div>

        <div className="p-4 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            <input
              autoFocus
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="搜尋設備名稱..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="p-2 border border-slate-300 rounded-md"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">所有分類</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => {
              const isAlreadyAdded = existingIds.has(item.id);
              const isSelected = tempSelected.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => !isAlreadyAdded && toggleSelect(item.id)}
                  className={`relative border rounded-lg p-3 flex gap-3 cursor-pointer transition-all ${isAlreadyAdded ? 'bg-slate-100 opacity-60 border-slate-200' :
                    isSelected ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                >
                  <div
                    className={`w-16 h-16 bg-slate-200 rounded overflow-hidden flex-shrink-0 group relative ${item.imageUrl ? 'cursor-zoom-in' : ''}`}
                    onClick={(e) => {
                      if (item.imageUrl) {
                        e.stopPropagation();
                        previewImage(item.imageUrl, item.name);
                      }
                    }}
                  >
                    {item.imageUrl ? (
                      <>
                        <img src={item.imageUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                        </div>
                      </>
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-slate-900 truncate">{item.name}</h4>
                    <p className="text-xs text-slate-500">{item.category}</p>
                    <p className="text-xs text-slate-500 mt-1">庫存: {item.stock}</p>
                  </div>
                  {isAlreadyAdded && <div className="absolute top-2 right-2 text-green-600 text-xs font-bold">已加入</div>}
                  {isSelected && <div className="absolute top-2 right-2 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">✓</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md">取消</button>
          <button
            type="button"
            onClick={() => onConfirm(Array.from(tempSelected))}
            disabled={tempSelected.size === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            加入選取 ({tempSelected.size})
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
export const EventManager: React.FC<EventManagerProps> = ({ events, inventory, onUpdate, onNavigateToChecklist, conflicts = [] }) => {
  const { showToast } = useToast();
  const { previewImage } = useImagePreview();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [isEditing, setIsEditing] = useState<Event | null>(null);
  const [formData, setFormData] = useState<Partial<Event>>({});

  // Selector Modal State
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Delete Modal State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Common input class
  const inputClass = "w-full mt-1 p-2 border border-slate-300 rounded-md shadow-sm bg-white text-slate-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

  // --- Filtering & Counts Logic ---
  const counts = useMemo(() => {
    return {
      active: events.filter(e => [EventStatus.PREPARATION, EventStatus.TESTING, EventStatus.PACKING, EventStatus.EXHIBITION, EventStatus.DISMANTLE].includes(e.status)).length,
      planning: events.filter(e => [EventStatus.RESERVATION, EventStatus.REQUIREMENT_CONFIRM, EventStatus.PLANNING].includes(e.status)).length,
      archived: events.filter(e => e.status === EventStatus.ENDED).length,
      all: events.length
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    switch (activeTab) {
      case 'active':
        filtered = filtered.filter(e =>
          [EventStatus.PREPARATION, EventStatus.TESTING, EventStatus.PACKING, EventStatus.EXHIBITION, EventStatus.DISMANTLE].includes(e.status)
        );
        return filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      case 'planning':
        filtered = filtered.filter(e =>
          [EventStatus.RESERVATION, EventStatus.REQUIREMENT_CONFIRM, EventStatus.PLANNING].includes(e.status)
        );
        return filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      case 'archived':
        filtered = filtered.filter(e => e.status === EventStatus.ENDED);
        return filtered.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
      case 'all':
      default:
        return filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }
  }, [events, activeTab]);

  // --- Form Logic ---
  const handleAddNew = () => {
    setFormData({
      id: crypto.randomUUID(),
      title: '',
      category: 'Client',
      status: EventStatus.RESERVATION,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      displayContent: '',
      logistics: { requester: '', contactPerson: '', location: '', personnel: '', truckInfo: '', setupTime: '', teardownTime: '' },
      allocations: [],
      workflow: [],
      createdAt: Date.now()
    });
    setIsEditing({} as Event);
  };

  const handleEdit = (evt: Event) => {
    setFormData(JSON.parse(JSON.stringify(evt)));
    setIsEditing(evt);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      try {
        await api.deleteEvent(deletingId);
        onUpdate(events.filter(e => e.id !== deletingId));
        showToast('活動已刪除', 'info');
      } catch (e) {
        console.error(e);
        showToast('刪除失敗，請稍後再試', 'error');
      }
      setDeletingId(null);
    }
  };

  const handleStatusChange = (id: string, newStatus: EventStatus) => {
    onUpdate(events.map(e => e.id === id ? { ...e, status: newStatus } : e));
    showToast('狀態已更新', 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent = formData as Event;
    newEvent.allocations = newEvent.allocations.map(a => ({
      ...a,
      checkedOutCount: a.checkedOutCount ?? 0,
      checkedInCount: a.checkedInCount ?? 0,
      note: a.note || ''
    }));

    // Ensure workflow exists
    newEvent.workflow = newEvent.workflow || [];

    if (events.find(ev => ev.id === newEvent.id)) {
      onUpdate(events.map(ev => ev.id === newEvent.id ? newEvent : ev));
      showToast('活動儲存成功', 'success');
    } else {
      onUpdate([...events, newEvent]);
      showToast('活動建立成功', 'success');
    }
    setIsEditing(null);
  };

  // --- Workflow Logic ---
  const handleLoadWorkflowTemplate = () => {
    const templateItems: WorkflowItem[] = WORKFLOW_TEMPLATE.map(t => ({
      ...t,
      id: crypto.randomUUID()
    }));

    if ((formData.workflow?.length || 0) > 0) {
      if (!confirm('目前已有流程資料。確定要載入模版嗎？(這將會附加在現有項目後)')) return;
    }

    setFormData({
      ...formData,
      workflow: [...(formData.workflow || []), ...templateItems]
    });
    showToast('已載入標準籌備流程', 'success');
  };

  const handleAddWorkflowItem = () => {
    const newItem: WorkflowItem = {
      id: crypto.randomUUID(),
      category: '自訂項目',
      label: '請輸入說明',
      isCompleted: false,
      note: ''
    };
    setFormData({
      ...formData,
      workflow: [...(formData.workflow || []), newItem]
    });
  };

  const handleUpdateWorkflowItem = (id: string, updates: Partial<WorkflowItem>) => {
    setFormData({
      ...formData,
      workflow: (formData.workflow || []).map(w => w.id === id ? { ...w, ...updates } : w)
    });
  };

  const handleDeleteWorkflowItem = (id: string) => {
    setFormData({
      ...formData,
      workflow: (formData.workflow || []).filter(w => w.id !== id)
    });
  };

  // --- Allocation Logic ---
  const addAllocations = (selectedIds: string[]) => {
    const current = formData.allocations || [];
    const newAllocations = [...current];
    let addedCount = 0;

    selectedIds.forEach(eqId => {
      if (!newAllocations.find(a => a.equipmentId === eqId)) {
        newAllocations.push({ equipmentId: eqId, quantity: 1, checkedOutCount: 0, checkedInCount: 0 });
        addedCount++;
      }
    });

    setFormData({ ...formData, allocations: newAllocations });
    setIsSelectorOpen(false);
    if (addedCount > 0) showToast(`已加入 ${addedCount} 項設備`, 'success');
  };

  const updateAllocationQty = (eqId: string, qty: number) => {
    const current = formData.allocations || [];
    setFormData({
      ...formData,
      allocations: current.map(a => a.equipmentId === eqId ? { ...a, quantity: qty } : a)
    });
  };

  const removeAllocation = (eqId: string) => {
    setFormData({
      ...formData,
      allocations: (formData.allocations || []).filter(a => a.equipmentId !== eqId)
    });
  };

  // --- Real-time Stock Check ---
  const getStockStatus = (eqId: string, requestedQty: number) => {
    if (!formData.startDate || !formData.endDate) return { available: 0, isShortage: false };

    // Check available stock in the date range (excluding current editing event)
    const available = checkStockAvailability(
      eqId,
      formData.startDate,
      formData.endDate,
      events,
      inventory,
      formData.id
    );

    // The available number returned is (Total - Other Events Usage).
    // So if available < requestedQty, we have a shortage.
    return {
      available,
      isShortage: requestedQty > available
    };
  };

  // --- Calendar Helpers (Same as before) ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const paddingDays = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const allCells = [...paddingDays, ...days];
    const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    const isDateInRange = (checkDate: Date, start: string, end: string) => {
      const s = new Date(start); const e = new Date(end);
      s.setHours(0, 0, 0, 0); e.setHours(23, 59, 59, 999); checkDate.setHours(12, 0, 0, 0);
      return checkDate >= s && checkDate <= e;
    };
    return (
      <div className="bg-white rounded-lg shadow border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <div className="flex space-x-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><ChevronLeft size={20} /></button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><ChevronRight size={20} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (<div key={day} className="py-2 text-center text-sm font-semibold text-slate-500">{day}</div>))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px border-b border-l border-r border-slate-200">
          {allCells.map((day, idx) => {
            if (!day) return <div key={`pad-${idx}`} className="bg-white min-h-[120px]" />;
            const cellDate = new Date(year, month, day);
            const dayEvents = filteredEvents.filter(e => isDateInRange(new Date(cellDate), e.startDate, e.endDate));
            return (
              <div key={`day-${day}`} className="bg-white min-h-[120px] p-2 flex flex-col hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isSameDay(cellDate, new Date()) ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>{day}</span>
                </div>
                <div className="mt-1 space-y-1 flex-1 overflow-y-auto">
                  {dayEvents.map(evt => {
                    const isStart = isSameDay(new Date(evt.startDate), cellDate);
                    let bgClass = "bg-blue-100 text-blue-800 border-blue-200";
                    if (evt.status === EventStatus.EXHIBITION) bgClass = "bg-green-100 text-green-800 border-green-200";
                    if (evt.status === EventStatus.PLANNING) bgClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
                    if (evt.status === EventStatus.ENDED) bgClass = "bg-slate-100 text-slate-600 border-slate-200";
                    return (
                      <button key={evt.id} onClick={() => handleEdit(evt)} className={`text-xs w-full text-left px-1.5 py-1 rounded border ${bgClass} truncate block`} title={`${evt.title} (${evt.status})`}>
                        {isStart ? '● ' : ''}{evt.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- Render Form ---
  if (isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative">
        {/* Render the Selector Modal conditionally */}
        {isSelectorOpen && (
          <EquipmentSelectorModal
            inventory={inventory}
            existingIds={new Set((formData.allocations || []).map(a => a.equipmentId))}
            onClose={() => setIsSelectorOpen(false)}
            onConfirm={addAllocations}
          />
        )}

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">{formData.id && events.find(e => e.id === formData.id) ? '編輯活動' : '新增活動'}</h2>
          <button onClick={() => setIsEditing(null)} className="text-slate-500 hover:text-slate-800"><ArrowLeft /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">基本資訊</h3>
              <div><label className="block text-sm font-medium text-slate-700">活動標題</label><input required className={inputClass} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700">類別</label><select className={inputClass} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}><option value="Client">Client</option><option value="Exhibition">Exhibition</option><option value="Internal">Internal</option></select></div>
                <div><label className="block text-sm font-medium text-slate-700">狀態</label><select className={inputClass} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as EventStatus })}>{Object.values(EventStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700">開始日期</label><input type="date" required className={inputClass} style={{ colorScheme: 'light' }} value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-slate-700">結束日期</label><input type="date" required className={inputClass} style={{ colorScheme: 'light' }} value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700">進場時間</label><input type="datetime-local" className={inputClass} style={{ colorScheme: 'light' }} value={formData.logistics?.setupTime || ''} onChange={e => setFormData({ ...formData, logistics: { ...formData.logistics!, setupTime: e.target.value } })} /></div>
                <div><label className="block text-sm font-medium text-slate-700">撤場時間</label><input type="datetime-local" className={inputClass} style={{ colorScheme: 'light' }} value={formData.logistics?.teardownTime || ''} onChange={e => setFormData({ ...formData, logistics: { ...formData.logistics!, teardownTime: e.target.value } })} /></div>
              </div>
              {/* New Field: Display Content */}
              <div>
                <label className="block text-sm font-medium text-slate-700">展示內容</label>
                <textarea
                  className={`${inputClass} h-20`}
                  value={formData.displayContent || ''}
                  onChange={e => setFormData({ ...formData, displayContent: e.target.value })}
                  placeholder="描述此活動預計展示的重點內容..."
                />
              </div>
            </div>

            {/* Logistics */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">物流資訊</h3>
              <div><label className="block text-sm font-medium text-slate-700">地點</label><input className={inputClass} value={formData.logistics?.location} onChange={e => setFormData({ ...formData, logistics: { ...formData.logistics!, location: e.target.value } })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700">需求方</label><input className={inputClass} value={formData.logistics?.requester} onChange={e => setFormData({ ...formData, logistics: { ...formData.logistics!, requester: e.target.value } })} /></div>
                <div><label className="block text-sm font-medium text-slate-700">聯絡人</label><input className={inputClass} value={formData.logistics?.contactPerson} onChange={e => setFormData({ ...formData, logistics: { ...formData.logistics!, contactPerson: e.target.value } })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700">進撤場人員</label><input className={inputClass} value={formData.logistics?.personnel} onChange={e => setFormData({ ...formData, logistics: { ...formData.logistics!, personnel: e.target.value } })} /></div>
                <div><label className="block text-sm font-medium text-slate-700">貨車安排</label><input className={inputClass} value={formData.logistics?.truckInfo} onChange={e => setFormData({ ...formData, logistics: { ...formData.logistics!, truckInfo: e.target.value } })} /></div>
              </div>
            </div>
          </div>

          {/* Workflow / Checklist Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-slate-900 flex items-center">
                <ClipboardList className="w-4 h-4 mr-2 text-indigo-500" />
                籌備進度確認
              </h3>
              <div className="flex gap-2">
                <button type="button" onClick={handleLoadWorkflowTemplate} className="text-sm px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 font-medium flex items-center">
                  <RefreshCw className="w-3 h-3 mr-1" /> 載入模版
                </button>
                <button type="button" onClick={handleAddWorkflowItem} className="text-sm px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 font-medium flex items-center">
                  <Plus className="w-3 h-3 mr-1" /> 自訂節點
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              {formData.workflow && formData.workflow.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 w-32">項目</th>
                      <th className="px-4 py-2 w-1/3">說明</th>
                      <th className="px-4 py-2 w-16 text-center">完成</th>
                      <th className="px-4 py-2">備註</th>
                      <th className="px-4 py-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.workflow.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2">
                          <input
                            className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium text-slate-700"
                            value={item.category}
                            onChange={(e) => handleUpdateWorkflowItem(item.id, { category: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-600"
                            value={item.label}
                            onChange={(e) => handleUpdateWorkflowItem(item.id, { label: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                            checked={item.isCompleted}
                            onChange={(e) => handleUpdateWorkflowItem(item.id, { isCompleted: e.target.checked })}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            className="w-full bg-transparent border-b border-transparent focus:border-red-300 focus:ring-0 p-0 text-red-600 placeholder:text-slate-300"
                            placeholder="備註..."
                            value={item.note}
                            onChange={(e) => handleUpdateWorkflowItem(item.id, { note: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button type="button" onClick={() => handleDeleteWorkflowItem(item.id)} className="text-slate-300 hover:text-red-500">
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">
                  尚無籌備節點，請點擊上方按鈕新增或載入模版。
                </div>
              )}
            </div>
          </div>

          {/* Equipment Allocation */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-slate-900">設備分配清單</h3>
              <button type="button" onClick={() => setIsSelectorOpen(true)} className="text-sm px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 font-medium">
                + 添加設備...
              </button>
            </div>

            {formData.allocations && formData.allocations.length > 0 ? (
              <div className="bg-slate-50 rounded-lg p-4 max-h-80 overflow-y-auto border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2">設備名稱</th>
                      <th className="pb-2 w-32">需求數量</th>
                      <th className="pb-2 w-32">即時庫存</th>
                      <th className="pb-2 w-16 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.allocations.map(alloc => {
                      const eq = inventory.find(i => i.id === alloc.equipmentId);
                      const { available, isShortage } = getStockStatus(alloc.equipmentId, alloc.quantity);

                      return (
                        <tr key={alloc.equipmentId} className="border-b border-slate-200 last:border-0 group hover:bg-white transition-colors">
                          <td className="py-2 font-medium text-slate-900">
                            <div className="flex items-center">
                              {eq?.imageUrl && (
                                <img
                                  src={eq.imageUrl}
                                  className="w-8 h-8 rounded object-cover mr-2 bg-slate-200 cursor-zoom-in hover:opacity-80 transition-opacity"
                                  onClick={() => previewImage(eq.imageUrl, eq.name)}
                                />
                              )}
                              <div>{eq?.name || 'Unknown Item'} <span className="text-xs text-slate-400 block">{eq?.category}</span></div>
                            </div>
                          </td>
                          <td className="py-2">
                            <input
                              type="number"
                              min="1"
                              className={`w-24 p-1 border rounded bg-white text-slate-900 focus:ring-2 ${isShortage ? 'border-red-300 ring-red-200 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'}`}
                              value={alloc.quantity}
                              onChange={(e) => updateAllocationQty(alloc.equipmentId, parseInt(e.target.value))}
                            />
                          </td>
                          <td className="py-2">
                            <div className={`flex items-center text-xs font-medium px-2 py-1 rounded w-fit ${isShortage ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {isShortage ? <AlertTriangle className="w-3 h-3 mr-1" /> : null}
                              剩餘: {available}
                            </div>
                          </td>
                          <td className="py-2 text-right">
                            <button type="button" onClick={() => removeAllocation(alloc.equipmentId)} className="text-slate-400 hover:text-red-600 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                <p className="text-slate-500 text-sm">尚未分配任何設備</p>
                <button type="button" onClick={() => setIsSelectorOpen(true)} className="mt-2 text-blue-600 text-sm hover:underline">點擊選擇設備</button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsEditing(null)} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 bg-white hover:bg-slate-50">取消</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center shadow-sm">
              <Save className="w-4 h-4 mr-2" /> 儲存活動
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- Main View (List/Calendar) ---
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
            <p className="text-slate-600 mb-6">確定要刪除此活動嗎？<br />此動作無法復原。</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md">取消</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm">確認刪除</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 pb-1">
          <nav className="flex space-x-4 overflow-x-auto no-scrollbar" aria-label="Tabs">
            <button onClick={() => setActiveTab('active')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><span className="flex items-center"><PlayCircle className="w-4 h-4 mr-2" />進行中<span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>{counts.active}</span></span></button>
            <button onClick={() => setActiveTab('planning')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'planning' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><span className="flex items-center"><Layout className="w-4 h-4 mr-2" />規劃中<span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === 'planning' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-600'}`}>{counts.planning}</span></span></button>
            <button onClick={() => setActiveTab('archived')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'archived' ? 'border-slate-500 text-slate-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><span className="flex items-center"><Archive className="w-4 h-4 mr-2" />歷史歸檔<span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === 'archived' ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600'}`}>{counts.archived}</span></span></button>
            <button onClick={() => setActiveTab('all')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'all' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><span className="flex items-center"><Layers className="w-4 h-4 mr-2" />全部<span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === 'all' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'}`}>{counts.all}</span></span></button>
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
              <button onClick={() => setViewMode('list')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900'}`}><List className="w-4 h-4 mr-2" /> 列表</button>
              <button onClick={() => setViewMode('calendar')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900'}`}><CalendarIcon className="w-4 h-4 mr-2" /> 行事曆</button>
            </div>
            <button onClick={handleAddNew} className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"><Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />建立活動</button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        {viewMode === 'list' ? (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">狀態</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">活動名稱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">展示內容</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">地點 / 人員</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredEvents.map(evt => {
                const hasConflict = conflicts.some(c => c.relatedEventIds.includes(evt.id));
                const workflowProgress = evt.workflow ? `${evt.workflow.filter(w => w.isCompleted).length}/${evt.workflow.length}` : '-';

                return (
                  <tr key={evt.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        className="text-xs font-semibold rounded-full px-2 py-1 border-0 ring-1 ring-inset ring-slate-300 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        value={evt.status}
                        onChange={(e) => handleStatusChange(evt.id, e.target.value as EventStatus)}
                      >
                        {Object.values(EventStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-slate-900">{evt.title}</div>
                        {hasConflict && (
                          <span className="ml-2 flex items-center text-red-600 text-xs bg-red-50 px-1.5 py-0.5 rounded border border-red-200" title="此活動有設備庫存衝突"><AlertTriangle size={12} className="mr-1" /> 衝突</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">{evt.category}</div>
                      {evt.workflow && evt.workflow.length > 0 && (
                        <div className="text-xs text-indigo-500 mt-1 flex items-center">
                          <ClipboardList size={12} className="mr-1" /> 籌備進度: {workflowProgress}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-500 line-clamp-2 max-w-[240px]" title={evt.displayContent}>
                        {evt.displayContent || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(evt.startDate)} <br /> {formatDate(evt.endDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div>{evt.logistics.location || '-'}</div>
                      {evt.logistics.personnel && <div className="flex items-center mt-1 text-slate-400 text-xs"><Users size={12} className="mr-1" />{evt.logistics.personnel}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => onNavigateToChecklist(evt)} className="text-indigo-600 hover:text-indigo-900 mr-4 p-1 hover:bg-indigo-50 rounded" title="點交助手"><CheckSquare className="w-5 h-5" /></button>
                      <button onClick={() => handleEdit(evt)} className="text-blue-600 hover:text-blue-900 mr-4 p-1 hover:bg-blue-50 rounded" title="編輯"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDeleteClick(evt.id)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded" title="刪除"><Trash2 className="w-5 h-5" /></button>
                    </td>
                  </tr>
                );
              })}
              {filteredEvents.length === 0 && (<tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">此分類下尚無活動資料</td></tr>)}
            </tbody>
          </table>
        ) : (renderCalendar())}
      </div>
    </div>
  );
};