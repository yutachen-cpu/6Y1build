import { Event, Equipment, Allocation, ConflictAlert, WorkflowItem } from './types';
import JSZip from 'jszip';

// --- Data Persistence ---
const STORAGE_KEY_EQUIPMENT = 'eventgrid_inventory_v1';
const STORAGE_KEY_EVENTS = 'eventgrid_events_v1';

export const loadInventory = (): Equipment[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EQUIPMENT);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to load inventory", e);
    return [];
  }
};

export const saveInventory = (data: Equipment[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_EQUIPMENT, JSON.stringify(data));
  } catch (e) {
    console.error("Storage failed", e);
    // Silent fail or alert if needed, preventing crash
  }
};

export const loadEvents = (): Event[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to load events", e);
    return [];
  }
};

export const saveEvents = (data: Event[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(data));
  } catch (e) {
    console.error("Storage failed", e);
  }
};

// --- Date Helpers ---
export const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getDatesInRange = (startDate: string, endDate: string): string[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateArray = [];
  const currentDate = new Date(start);

  while (currentDate <= end) {
    dateArray.push(new Date(currentDate).toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dateArray;
};

// --- Templates ---
export const WORKFLOW_TEMPLATE: Omit<WorkflowItem, 'id'>[] = [
  { category: '攤位確認', label: '確認攤位位置與尺寸', isCompleted: false, note: '' },
  { category: '展出時間', label: '確認展期', isCompleted: false, note: '' },
  { category: '知識文件', label: '確認已取得知識文件', isCompleted: false, note: '' },
  { category: '物品清單確認', label: '確認展品', isCompleted: false, note: '' },
  { category: '現場網路', label: '現場是否提供攤位網路專線', isCompleted: false, note: '' },
  { category: '布展時間', label: '確認進場時間', isCompleted: false, note: '' },
  { category: '現場人力', label: '協助每日開關機', isCompleted: false, note: '' },
  { category: '撤展時間', label: '確認撤場時間', isCompleted: false, note: '' },
  { category: '展品回運', label: '展品拆卸與回運安排', isCompleted: false, note: '' },
  { category: '物流安排與費用', label: '展品運輸、貨車、上下貨', isCompleted: false, note: '' },
];

// --- Logic ---

export const calculateConflicts = (events: Event[], inventory: Equipment[]): ConflictAlert[] => {
  // Structure: { '2023-10-01': { 'equip_1': { quantity: 5, events: [{id, title}] } } }
  const dailyUsage: Record<string, Record<string, { quantity: number, events: {id: string, title: string}[] }>> = {};

  // 1. Aggregate demand
  events.forEach(evt => {
    // Only count events that are not cancelled or ended if needed
    if (evt.status === '結束') return; 

    const range = getDatesInRange(evt.startDate, evt.endDate);
    range.forEach(date => {
      if (!dailyUsage[date]) dailyUsage[date] = {};
      
      evt.allocations.forEach(alloc => {
        if (!dailyUsage[date][alloc.equipmentId]) {
            dailyUsage[date][alloc.equipmentId] = { quantity: 0, events: [] };
        }
        dailyUsage[date][alloc.equipmentId].quantity += alloc.quantity;
        // Track unique events for this day/equipment
        if (!dailyUsage[date][alloc.equipmentId].events.find(e => e.id === evt.id)) {
            dailyUsage[date][alloc.equipmentId].events.push({ id: evt.id, title: evt.title });
        }
      });
    });
  });

  // 2. Compare with stock
  const conflicts: ConflictAlert[] = [];
  
  Object.keys(dailyUsage).forEach(date => {
    const usages = dailyUsage[date];
    Object.keys(usages).forEach(eqId => {
      const item = inventory.find(i => i.id === eqId);
      if (item) {
        const usageData = usages[eqId];
        if (usageData.quantity > item.stock) {
          conflicts.push({
            date,
            equipmentId: eqId,
            equipmentName: item.name,
            shortage: usageData.quantity - item.stock,
            totalDemand: usageData.quantity,
            totalStock: item.stock,
            relatedEventTitles: usageData.events.map(e => e.title),
            relatedEventIds: usageData.events.map(e => e.id)
          });
        }
      }
    });
  });

  // Sort by date
  return conflicts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Check availability for a specific item during a specific range, excluding a specific event (the one being edited)
export const checkStockAvailability = (
  equipmentId: string, 
  startDate: string, 
  endDate: string, 
  events: Event[], 
  inventory: Equipment[], 
  excludeEventId?: string
): number => {
  const item = inventory.find(i => i.id === equipmentId);
  if (!item) return 0;
  
  const dates = getDatesInRange(startDate, endDate);
  let maxUsed = 0;

  dates.forEach(date => {
     let dailyUsed = 0;
     events.forEach(evt => {
         if (evt.id === excludeEventId || evt.status === '結束') return;

         const evtRange = getDatesInRange(evt.startDate, evt.endDate);
         if (evtRange.includes(date)) {
             const alloc = evt.allocations.find(a => a.equipmentId === equipmentId);
             if (alloc) dailyUsed += alloc.quantity;
         }
     });
     if (dailyUsed > maxUsed) maxUsed = dailyUsed;
  });

  return item.stock - maxUsed;
};

// --- Helpers for Binary Conversion ---
function dataURItoBlob(dataURI: string) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: mimeString});
}

// --- Export/Import with ZIP ---

export const exportBackup = async (events: Event[], inventory: Equipment[]) => {
  const zip = new JSZip();
  const imgFolder = zip.folder("images");
  
  // Clone inventory to avoid mutating state
  const inventoryToSave = JSON.parse(JSON.stringify(inventory)) as Equipment[];
  
  // Process images
  inventoryToSave.forEach((item) => {
    if (item.imageUrl && item.imageUrl.startsWith('data:image')) {
      try {
        const blob = dataURItoBlob(item.imageUrl);
        // Determine extension
        let ext = 'jpg';
        if (blob.type.includes('png')) ext = 'png';
        else if (blob.type.includes('gif')) ext = 'gif';
        
        const filename = `img_${item.id}.${ext}`;
        if (imgFolder) {
            imgFolder.file(filename, blob);
        }
        
        // Replace Base64 with path in the JSON
        item.imageUrl = `images/${filename}`;
      } catch (err) {
        console.warn(`Failed to process image for item ${item.name}`, err);
        // If fail, keep original base64 or empty it? Keeping it safe by leaving it.
      }
    }
  });

  const data = {
    timestamp: new Date().toISOString(),
    version: "1.0",
    events,
    inventory: inventoryToSave
  };

  zip.file("data.json", JSON.stringify(data, null, 2));

  try {
      const content = await zip.generateAsync({type:"blob"});
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `eventgrid_backup_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  } catch (err) {
      console.error("Failed to generate zip", err);
      alert("備份失敗");
  }
};

export const importBackup = async (file: File): Promise<{events: Event[], inventory: Equipment[]}> => {
  return new Promise(async (resolve, reject) => {
    try {
        const zip = await JSZip.loadAsync(file);
        
        // Read data.json
        const dataFile = zip.file("data.json");
        if (!dataFile) {
            reject(new Error("找不到 data.json，請確認備份檔格式正確"));
            return;
        }

        const dataStr = await dataFile.async("string");
        const data = JSON.parse(dataStr);

        if (!data.events || !data.inventory) {
             reject(new Error("資料格式不符"));
             return;
        }

        const restoredInventory = [...data.inventory];

        // Rehydrate images
        for (let item of restoredInventory) {
            if (item.imageUrl && item.imageUrl.startsWith('images/')) {
                const imgFile = zip.file(item.imageUrl);
                if (imgFile) {
                    const base64 = await imgFile.async("base64");
                    // Detect mime based on extension in path
                    let mime = 'image/jpeg';
                    if (item.imageUrl.endsWith('.png')) mime = 'image/png';
                    
                    item.imageUrl = `data:${mime};base64,${base64}`;
                } else {
                    // Image missing in zip, clear it
                    item.imageUrl = '';
                }
            }
        }

        resolve({
            events: data.events,
            inventory: restoredInventory
        });

    } catch (err) {
        reject(err);
    }
  });
};

// Fallback for old JSON only files (Legacy support)
export const readFileAsJSON = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
};