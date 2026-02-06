import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  PackageSearch,
  Settings,
  Upload,
  Download,
  Menu,
  X,
  Database
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { InventoryManager } from './components/InventoryManager';
import { EventManager } from './components/EventManager';
import { ChecklistAssistant } from './components/ChecklistAssistant';
import {
  calculateConflicts,
  exportBackup,
  importBackup,
  readFileAsJSON
} from './utils';
import { api } from './api';
import { Event, Equipment } from './types';

type View = 'dashboard' | 'events' | 'inventory' | 'checklist';

function App() {
  // Global State
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile toggle
  const [selectedEventForChecklist, setSelectedEventForChecklist] = useState<Event | null>(null);

  // Data State
  const [events, setEvents] = useState<Event[]>([]);
  const [inventory, setInventory] = useState<Equipment[]>([]);

  // Init Data
  // Init Data (Async with API)
  useEffect(() => {
    const initData = async () => {
      try {
        // 1. Try fetch from Backend
        let loadedInv = await api.getInventory();
        let loadedEvt = await api.getEvents();

        // 2. Migration Check: If Backend is empty but LocalStorage has data, sync it up!
        const localInvStr = localStorage.getItem('eventgrid_inventory_v1');
        const localEvtStr = localStorage.getItem('eventgrid_events_v1');

        let didMigrate = false;

        if (loadedInv.length === 0 && localInvStr) {
          console.log("Migrating Inventory from LocalStorage to Cloud...");
          loadedInv = JSON.parse(localInvStr);
          await api.syncInventory(loadedInv);
          didMigrate = true;
        }

        if (loadedEvt.length === 0 && localEvtStr) {
          console.log("Migrating Events from LocalStorage to Cloud...");
          loadedEvt = JSON.parse(localEvtStr);
          await api.syncEvents(loadedEvt);
          didMigrate = true;
        }

        // 3. Demo Data Seeding (If both Cloud and Local are empty)
        if (loadedInv.length === 0) {
          const demoInv: Equipment[] = [
            { id: '1', name: 'LED Wall 500x500', category: 'Video', owner: '6Y1', stock: 24, unit: '箱', status: '正常' as any, dimensions: '50x50x10cm', weight: '8kg', description: 'P2.9 Indoor', imageUrl: '' },
            { id: '2', name: 'PA Speaker JBL', category: 'Audio', owner: '6Y1', stock: 4, unit: '支', status: '正常' as any, dimensions: '40x40x80cm', weight: '20kg', description: 'Active Speaker', imageUrl: '' },
            { id: '3', name: 'Laptop MacBook Pro', category: 'IT', owner: 'IT Dept', stock: 5, unit: '台', status: '正常' as any, dimensions: '14 inch', weight: '1.5kg', description: 'M1 Pro', imageUrl: '' },
          ];
          loadedInv = demoInv;
          await api.syncInventory(demoInv);
        }

        // Set State
        setInventory(loadedInv);
        setEvents(loadedEvt);
        if (didMigrate) alert("已成功將舊資料同步至雲端資料庫！");

      } catch (e) {
        console.error("Failed to initialize data", e);
        alert("連線後端失敗，請確認 API 是否啟動。");
      }
    };

    initData();
  }, []);

  // Persistence Effects (Debounced or Direct Sync)
  // Note: Syncing entire list on every edit is not efficient for large data, 
  // but acceptable for this MVP scale.
  useEffect(() => {
    if (inventory.length > 0) {
      api.syncInventory(inventory).catch(e => console.error("Sync Inv Failed", e));
    }
  }, [inventory]);

  useEffect(() => {
    if (events.length > 0) {
      api.syncEvents(events).catch(e => console.error("Sync Event Failed", e));
    }
  }, [events]);

  // Logic
  const conflicts = calculateConflicts(events, inventory);

  // Handlers
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Check if it's a zip or json
        if (file.name.endsWith('.json')) {
          // Legacy JSON support
          const data = await readFileAsJSON(file);
          if (data.events && data.inventory) {
            setEvents(data.events);
            setInventory(data.inventory);
            alert('舊版資料還原成功！');
          } else {
            alert('無效的備份檔案格式');
          }
        } else {
          // New ZIP support
          const data = await importBackup(file);
          if (data.events && data.inventory) {
            setEvents(data.events);
            setInventory(data.inventory);
            alert('資料還原成功！');
          }
        }
      } catch (err) {
        console.error(err);
        alert('讀取檔案失敗，請確認檔案格式');
      }
      // Reset input
      e.target.value = '';
    }
  };

  const handleNavigateChecklist = (evt: Event) => {
    setSelectedEventForChecklist(evt);
    setActiveView('checklist');
  };

  // --- Render ---

  // Special full-screen view for Checklist
  if (activeView === 'checklist' && selectedEventForChecklist) {
    return (
      <ChecklistAssistant
        event={selectedEventForChecklist}
        inventory={inventory}
        onBack={() => setActiveView('events')}
        onUpdateEvent={(updatedEvt) => {
          setEvents(events.map(e => e.id === updatedEvt.id ? updatedEvt : e));
          setSelectedEventForChecklist(updatedEvt);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">

      {/* Sidebar - Desktop (Light Theme) */}
      <aside className={`hidden md:flex flex-col w-64 bg-white text-slate-600 transition-all duration-300 border-r border-slate-200 shadow-sm`}>
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-lg font-bold text-slate-900 tracking-wide flex items-center">
            <Database className="mr-2 text-blue-600 flex-shrink-0" /> 活動展期與設備管理
          </h1>
          <p className="text-xs text-slate-500 mt-1">Ver. 1.0</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center p-3 rounded-lg transition-colors font-medium ${activeView === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> 數據看板
          </button>
          <button
            onClick={() => setActiveView('events')}
            className={`w-full flex items-center p-3 rounded-lg transition-colors font-medium ${activeView === 'events' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <CalendarDays className="w-5 h-5 mr-3" /> 活動排程
          </button>
          <button
            onClick={() => setActiveView('inventory')}
            className={`w-full flex items-center p-3 rounded-lg transition-colors font-medium ${activeView === 'inventory' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <PackageSearch className="w-5 h-5 mr-3" /> 資產管理
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2">
          <p className="text-xs text-slate-500 px-2 mb-2 uppercase font-semibold">System</p>
          <button
            onClick={() => exportBackup(events, inventory)}
            className="w-full flex items-center px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
          >
            <Download className="w-4 h-4 mr-3" /> 備份數據 (ZIP)
          </button>
          <label className="w-full flex items-center px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer">
            <Upload className="w-4 h-4 mr-3" />
            <span>還原數據</span>
            <input type="file" className="hidden" accept=".zip,.json" onChange={handleImport} />
          </label>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay (Light Theme) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsSidebarOpen(false)}>
          <div className="w-64 h-full bg-white p-4 shadow-xl border-r border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
              <h1 className="text-lg font-bold text-slate-900 flex items-center"><Database className="mr-2 text-blue-600 flex-shrink-0" size={20} /> 活動展期與設備管理</h1>
              <button onClick={() => setIsSidebarOpen(false)}><X className="text-slate-500 hover:text-slate-900" /></button>
            </div>
            <nav className="space-y-2">
              <button onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false) }} className="block w-full text-left p-3 text-blue-600 bg-blue-50 font-medium rounded-lg">數據看板</button>
              <button onClick={() => { setActiveView('events'); setIsSidebarOpen(false) }} className="block w-full text-left p-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg">活動排程</button>
              <button onClick={() => { setActiveView('inventory'); setIsSidebarOpen(false) }} className="block w-full text-left p-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg">資產管理</button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
          <div className="flex items-center font-bold text-slate-900">
            <Database className="w-6 h-6 mr-2 text-blue-600 flex-shrink-0" /> 活動展期與設備管理
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white rounded hover:bg-slate-100 border border-slate-200">
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                {activeView === 'dashboard' && '數據總覽'}
                {activeView === 'events' && '活動排程管理'}
                {activeView === 'inventory' && '設備資產清單'}
              </h2>
              <p className="text-slate-500 mt-1">
                {activeView === 'dashboard' && '即時監控庫存狀態與專案進度'}
                {activeView === 'events' && '規劃展會檔期與分配資源'}
                {activeView === 'inventory' && '維護設備規格與狀態'}
              </p>
            </div>

            {activeView === 'dashboard' && <Dashboard events={events} inventory={inventory} conflicts={conflicts} />}
            {activeView === 'inventory' && <InventoryManager inventory={inventory} onUpdate={setInventory} />}
            {activeView === 'events' && (
              <EventManager
                events={events}
                inventory={inventory}
                onUpdate={setEvents}
                onNavigateToChecklist={handleNavigateChecklist}
                conflicts={conflicts}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;