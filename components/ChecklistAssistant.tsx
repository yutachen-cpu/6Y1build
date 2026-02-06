import React, { useState, useRef } from 'react';
import { Event, Equipment, AdHocItem } from '../types';
import { formatDate } from '../utils';
import { ArrowLeft, Box, PenTool, Eraser, Check, X, Printer, Plus, Trash2, ZoomIn } from 'lucide-react';
import { useToast } from './Toast';
import { useImagePreview } from './ImagePreview';

interface ChecklistAssistantProps {
  event: Event;
  inventory: Equipment[];
  onBack: () => void;
  onUpdateEvent: (event: Event) => void;
}

export const ChecklistAssistant: React.FC<ChecklistAssistantProps> = ({ event, inventory, onBack, onUpdateEvent }) => {
  const { showToast } = useToast();
  const { previewImage } = useImagePreview();
  const [filter, setFilter] = useState('');
  
  // Ad-hoc items state
  const [newAdHocName, setNewAdHocName] = useState('');
  const [newAdHocQty, setNewAdHocQty] = useState(1);
  
  // Signature State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureType, setSignatureType] = useState<'checkOut' | 'checkIn' | null>(null);

  // Stats calculation
  const totalItems = event.allocations.reduce((acc, a) => acc + a.quantity, 0);
  const totalCheckedOut = event.allocations.reduce((acc, a) => acc + a.checkedOutCount, 0);
  const totalCheckedIn = event.allocations.reduce((acc, a) => acc + a.checkedInCount, 0);

  const outProgress = totalItems > 0 ? Math.round((totalCheckedOut / totalItems) * 100) : 0;
  const inProgress = totalItems > 0 ? Math.round((totalCheckedIn / totalItems) * 100) : 0;

  // --- Handlers ---
  const handleCheck = (eqId: string, type: 'out' | 'in', delta: number) => {
    const updatedAllocations = event.allocations.map(a => {
      if (a.equipmentId !== eqId) return a;
      if (type === 'out') {
        const newVal = Math.max(0, Math.min(a.quantity, a.checkedOutCount + delta));
        return { ...a, checkedOutCount: newVal };
      } else {
         const newVal = Math.max(0, Math.min(a.quantity, a.checkedInCount + delta));
         return { ...a, checkedInCount: newVal };
      }
    });
    onUpdateEvent({ ...event, allocations: updatedAllocations });
  };

  const handleNoteChange = (eqId: string, newNote: string) => {
    const updatedAllocations = event.allocations.map(a => {
      if (a.equipmentId !== eqId) return a;
      return { ...a, note: newNote };
    });
    onUpdateEvent({ ...event, allocations: updatedAllocations });
  };

  const handleBatchCheck = (type: 'out' | 'in') => {
      const updatedAllocations = event.allocations.map(a => ({
          ...a,
          checkedOutCount: type === 'out' ? a.quantity : a.checkedOutCount,
          checkedInCount: type === 'in' ? a.quantity : a.checkedInCount
      }));
      onUpdateEvent({ ...event, allocations: updatedAllocations });
      showToast(type === 'out' ? '全部已設為出庫' : '全部已設為回收', 'success');
  };

  // --- Ad-hoc Item Handlers ---
  const handleAddAdHoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdHocName.trim()) return;

    const newItem: AdHocItem = {
        id: crypto.randomUUID(),
        name: newAdHocName,
        quantity: newAdHocQty,
        checkedOut: false,
        checkedIn: false,
        note: ''
    };

    const currentAdHoc = event.adHocItems || [];
    onUpdateEvent({ ...event, adHocItems: [...currentAdHoc, newItem] });
    setNewAdHocName('');
    setNewAdHocQty(1);
    showToast('已新增臨時項目', 'success');
  };

  const handleRemoveAdHoc = (id: string) => {
      const currentAdHoc = event.adHocItems || [];
      onUpdateEvent({ ...event, adHocItems: currentAdHoc.filter(i => i.id !== id) });
  };

  const handleToggleAdHocCheck = (id: string, type: 'checkedOut' | 'checkedIn') => {
      const currentAdHoc = event.adHocItems || [];
      const updated = currentAdHoc.map(item => {
          if (item.id === id) return { ...item, [type]: !item[type] };
          return item;
      });
      onUpdateEvent({ ...event, adHocItems: updated });
  };

  // --- Filter ---
  const filteredAllocations = event.allocations.filter(a => {
      const item = inventory.find(i => i.id === a.equipmentId);
      return item?.name.toLowerCase().includes(filter.toLowerCase());
  });

  // --- ROBUST PRINT FUNCTION (Window.open Method) ---
  const handlePrint = () => {
    // Generate Rows HTML
    const allocationRows = filteredAllocations.map((alloc, idx) => {
        const item = inventory.find(i => i.id === alloc.equipmentId);
        const checkOutMark = alloc.checkedOutCount >= alloc.quantity ? '☑' : '☐';
        const checkInMark = alloc.checkedInCount >= alloc.quantity ? '☑' : '☐';
        return `
            <tr>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">${idx + 1}</td>
                <td style="border: 1px solid black; padding: 8px;">
                    <div style="font-weight: bold;">${item?.name}</div>
                    <div style="font-size: 12px; color: #666;">${item?.dimensions || ''}</div>
                </td>
                <td style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">${alloc.quantity}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center; font-size: 18px;">${checkOutMark}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center; font-size: 18px;">${checkInMark}</td>
                <td style="border: 1px solid black; padding: 8px; font-size: 12px;">${alloc.note || ''}</td>
            </tr>
        `;
    }).join('');

    const adHocRows = (event.adHocItems || []).map((item, idx) => {
        const checkOutMark = item.checkedOut ? '☑' : '☐';
        const checkInMark = item.checkedIn ? '☑' : '☐';
        return `
            <tr>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">${filteredAllocations.length + idx + 1}</td>
                <td style="border: 1px solid black; padding: 8px; font-weight: bold;">${item.name} <span style="font-weight: normal; font-size: 10px; color: #666;">(雜項)</span></td>
                <td style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">${item.quantity}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center; font-size: 18px;">${checkOutMark}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center; font-size: 18px;">${checkInMark}</td>
                <td style="border: 1px solid black; padding: 8px; font-size: 12px;">${item.note || ''}</td>
            </tr>
        `;
    }).join('');

    // Empty Filler Rows (Updated: Reduced from 10 to 5)
    const emptyCount = Math.max(0, 5 - (event.adHocItems?.length || 0));
    const emptyRows = Array(emptyCount).fill(0).map((_, idx) => `
        <tr style="height: 40px;">
             <td style="border: 1px solid black; padding: 8px; text-align: center; color: #ccc;">${filteredAllocations.length + (event.adHocItems?.length || 0) + idx + 1}</td>
             <td style="border: 1px solid black; padding: 8px; color: #ccc; font-size: 12px; vertical-align: bottom;">${idx === 0 && (event.adHocItems?.length || 0) === 0 ? '(手寫新增項目...)' : ''}</td>
             <td style="border: 1px solid black;"></td>
             <td style="border: 1px solid black; text-align: center;">☐</td>
             <td style="border: 1px solid black; text-align: center;">☐</td>
             <td style="border: 1px solid black;"></td>
        </tr>
    `).join('');

    // Signatures
    const checkOutSig = event.signatures?.checkOut 
        ? `<img src="${event.signatures.checkOut}" style="max-height: 100%; max-width: 100%;" />` 
        : `<span style="color: #ccc;">請在此處簽名</span>`;
    
    const checkInSig = event.signatures?.checkIn 
        ? `<img src="${event.signatures.checkIn}" style="max-height: 100%; max-width: 100%;" />` 
        : `<span style="color: #ccc;">請在此處簽名</span>`;

    const content = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>列印清單 - ${event.title}</title>
            <style>
                body { font-family: sans-serif; padding: 20px; color: black; background: white; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
                h2 { text-align: center; background-color: #bfdbfe; border: 1px solid black; padding: 10px; margin-bottom: 5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .header-info { display: flex; justify-content: space-between; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
                .sub-info { display: flex; justify-content: space-between; font-size: 12px; color: #444; margin-bottom: 20px; padding: 0 5px;}
                .sig-container { display: flex; justify-content: space-between; gap: 20px; margin-top: 20px; border: 1px solid black; padding: 20px; page-break-inside: avoid; }
                .sig-box { width: 48%; }
                .sig-area { height: 120px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; position: relative; margin-top: 5px; }
                /* Removed text-transform: uppercase to allow 'MiTAC' mixed case */
                .footer { position: fixed; bottom: 0; left: 0; width: 100%; display: flex; justify-content: space-between; padding: 10px 40px; font-size: 10px; color: #666; font-weight: bold; background: white;}
                @page { size: A4 portrait; margin: 1cm; }
            </style>
        </head>
        <body>
            <div class="header-info">
                <div style="width: 33%;">
                    <span style="font-size: 12px; color: #666; display: block;">需求方</span>
                    <strong>${event.logistics.requester || '_________________'}</strong>
                </div>
                <div style="width: 33%; text-align: center;">
                    <span style="font-size: 12px; color: #666; display: block;">地點</span>
                    <strong style="font-size: 18px;">${event.logistics.location || '_________________'}</strong>
                </div>
                <div style="width: 33%; text-align: right;">
                    <span style="font-size: 12px; color: #666; display: block;">列印時間</span>
                    ${new Date().toLocaleString('zh-TW')}
                </div>
            </div>

            <h2>${event.title} - 設備點交清單</h2>
            <div class="sub-info">
                <span>活動期間: ${formatDate(event.startDate)} - ${formatDate(event.endDate)}</span>
                <span>聯絡人: ${event.logistics.contactPerson} / ${event.logistics.personnel}</span>
            </div>

            <table>
                <thead>
                    <tr style="background-color: #bfdbfe; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                        <th style="border: 1px solid black; padding: 8px; width: 50px;">序號</th>
                        <th style="border: 1px solid black; padding: 8px;">物件品項</th>
                        <th style="border: 1px solid black; padding: 8px; width: 60px;">數量</th>
                        <th style="border: 1px solid black; padding: 8px; width: 60px;">點交</th>
                        <th style="border: 1px solid black; padding: 8px; width: 60px;">回收</th>
                        <th style="border: 1px solid black; padding: 8px;">備註</th>
                    </tr>
                </thead>
                <tbody>
                    ${allocationRows}
                    ${adHocRows}
                    ${emptyRows}
                </tbody>
            </table>

            <div class="sig-container">
                <div class="sig-box">
                    <div style="font-weight: bold; border-bottom: 1px solid black; padding-bottom: 5px;">出庫點交確認</div>
                    <div class="sig-area">
                        ${checkOutSig}
                        <div style="position: absolute; bottom: 5px; right: 10px; font-size: 10px; color: #999;">日期: _____________</div>
                    </div>
                </div>
                <div class="sig-box">
                    <div style="font-weight: bold; border-bottom: 1px solid black; padding-bottom: 5px;">撤展回收確認</div>
                    <div class="sig-area">
                        ${checkInSig}
                        <div style="position: absolute; bottom: 5px; right: 10px; font-size: 10px; color: #999;">日期: _____________</div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <div style="width: 33%;"></div>
                <div style="width: 33%; text-align: center;">MiTAC</div>
                <div style="width: 33%; text-align: right;">6Y1</div>
            </div>
            
            <script>
                // Auto print when loaded
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `;

    // Open new window
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
        showToast('無法開啟列印視窗，請允許彈出式視窗', 'error');
        return;
    }

    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
  };

  // --- Signature Logic ---
  const startSigning = (type: 'checkOut' | 'checkIn') => {
      setSignatureType(type);
      setTimeout(() => {
          const canvas = canvasRef.current;
          if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.lineJoin = 'round';
                  ctx.lineCap = 'round';
                  ctx.lineWidth = 2;
                  ctx.strokeStyle = '#000';
              }
          }
      }, 50);
  };

  const handleDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSigning || !canvasRef.current) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
    }
  };

  const beginPath = (e: React.MouseEvent | React.TouchEvent) => {
      setIsSigning(true);
      if(!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      const rect = canvasRef.current.getBoundingClientRect();
      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }
      ctx?.beginPath();
      ctx?.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const saveSignature = () => {
    if (canvasRef.current && signatureType) {
        const dataUrl = canvasRef.current.toDataURL();
        const updatedSignatures = { ...(event.signatures || {}), [signatureType]: dataUrl };
        onUpdateEvent({ ...event, signatures: updatedSignatures });
        setSignatureType(null);
        showToast('簽名已儲存', 'success');
    }
  };

  const clearSignature = () => {
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
  };

  return (
    <div className="bg-white min-h-screen">
        {/* =======================
            Interactive UI (Screen Only - Print handled by Iframe)
           ======================= */}
        <div className="pb-12">
            <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{event.title} - 點交清單</h1>
                        <p className="text-sm text-slate-500">{formatDate(event.startDate)} @ {event.logistics.location}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        type="button"
                        onClick={handlePrint} 
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 shadow-sm transition-colors"
                    >
                        <Printer size={18} /> 列印 / 另存 PDF
                    </button>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
                {/* Progress Cards */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-blue-600">出庫準備度</span>
                        <button onClick={() => handleBatchCheck('out')} className="text-xs text-blue-500 hover:underline">全部出庫</button>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-4 border border-slate-200">
                        <div className="bg-blue-600 h-4 rounded-full transition-all duration-500" style={{ width: `${outProgress}%` }}></div>
                    </div>
                    <p className="text-right text-sm mt-1 text-slate-600">{totalCheckedOut} / {totalItems} ({outProgress}%)</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-green-600">回收完成率</span>
                        <button onClick={() => handleBatchCheck('in')} className="text-xs text-green-500 hover:underline">全部回收</button>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-4 border border-slate-200">
                        <div className="bg-green-600 h-4 rounded-full transition-all duration-500" style={{ width: `${inProgress}%` }}></div>
                    </div>
                    <p className="text-right text-sm mt-1 text-slate-600">{totalCheckedIn} / {totalItems} ({inProgress}%)</p>
                </div>
                
                {/* Search & Ad-Hoc Form */}
                <div className="md:col-span-2 space-y-4">
                    <input 
                        type="text" 
                        placeholder="搜尋清單內設備..." 
                        className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                    
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <p className="text-sm font-bold text-amber-800 mb-2 flex items-center">
                            <Plus className="w-4 h-4 mr-1"/> 新增臨時雜項 (如: 膠帶、剪刀、束帶)
                        </p>
                        <form onSubmit={handleAddAdHoc} className="flex gap-2">
                            <input 
                                className="flex-1 p-2 border border-amber-300 rounded-md text-sm bg-white text-black placeholder:text-slate-400"
                                placeholder="物品名稱"
                                value={newAdHocName}
                                onChange={e => setNewAdHocName(e.target.value)}
                            />
                            <input 
                                type="number"
                                min="1"
                                className="w-20 p-2 border border-amber-300 rounded-md text-sm bg-white text-black"
                                value={newAdHocQty}
                                onChange={e => setNewAdHocQty(parseInt(e.target.value))}
                            />
                            <button type="submit" className="px-3 py-2 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700">新增</button>
                        </form>
                        
                        {/* List Ad-hoc items if any */}
                        {event.adHocItems && event.adHocItems.length > 0 && (
                             <div className="mt-3 space-y-2">
                                 {event.adHocItems.map(item => (
                                     <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded border border-amber-100 text-sm">
                                         <span className="font-medium text-slate-700">{item.name} x {item.quantity}</span>
                                         <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <input type="checkbox" checked={item.checkedOut} onChange={() => handleToggleAdHocCheck(item.id, 'checkedOut')} /> 出
                                                <input type="checkbox" checked={item.checkedIn} onChange={() => handleToggleAdHocCheck(item.id, 'checkedIn')} /> 回
                                            </div>
                                            <button onClick={() => handleRemoveAdHoc(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 max-w-5xl mx-auto space-y-8">
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-700 text-sm border-b border-slate-200">
                            <tr>
                                <th className="p-4 w-16">圖示</th>
                                <th className="p-4">設備名稱 / 規格</th>
                                <th className="p-4 w-24 text-center">應有數量</th>
                                <th className="p-4 w-32 text-center bg-blue-50 text-blue-900">出庫確認</th>
                                <th className="p-4 w-32 text-center bg-green-50 text-green-900">回收確認</th>
                                <th className="p-4">備註</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAllocations.map(alloc => {
                                const item = inventory.find(i => i.id === alloc.equipmentId);
                                if (!item) return null;
                                const isFullyOut = alloc.checkedOutCount >= alloc.quantity;
                                const isFullyIn = alloc.checkedInCount >= alloc.quantity;

                                return (
                                    <tr key={alloc.equipmentId} className={`hover:bg-slate-50 transition-colors ${isFullyIn ? 'bg-green-50/30' : ''}`}>
                                        <td className="p-4">
                                            <div 
                                                className={`w-12 h-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center overflow-hidden relative group ${item.imageUrl ? 'cursor-zoom-in' : ''}`}
                                                onClick={() => item.imageUrl && previewImage(item.imageUrl, item.name)}
                                            >
                                                {item.imageUrl ? (
                                                    <>
                                                        <img src={item.imageUrl} className="w-full h-full object-cover"/>
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                            <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <Box size={20} className="text-slate-300"/>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{item.name}</div>
                                            <div className="text-xs text-slate-500">{item.dimensions} | {item.weight}</div>
                                        </td>
                                        <td className="p-4 text-center font-bold text-lg text-slate-900">{alloc.quantity}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleCheck(item.id, 'out', -1)} className="w-6 h-6 rounded bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600">-</button>
                                                <span className={`font-bold w-6 ${isFullyOut ? 'text-blue-600' : 'text-slate-400'}`}>{alloc.checkedOutCount}</span>
                                                <button onClick={() => handleCheck(item.id, 'out', 1)} className="w-6 h-6 rounded bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600">+</button>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleCheck(item.id, 'in', -1)} className="w-6 h-6 rounded bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600">-</button>
                                                <span className={`font-bold w-6 ${isFullyIn ? 'text-green-600' : 'text-slate-400'}`}>{alloc.checkedInCount}</span>
                                                <button onClick={() => handleCheck(item.id, 'in', 1)} className="w-6 h-6 rounded bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600">+</button>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <input 
                                                type="text"
                                                className="w-full p-1 text-sm border-b border-slate-200 focus:border-blue-500 outline-none bg-transparent"
                                                placeholder="填寫備註..."
                                                value={alloc.note || ''}
                                                onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Digital Signatures Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                     <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center">
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                             <PenTool className="w-4 h-4 mr-2" />
                             出庫簽名 (Check-out)
                         </h3>
                         {event.signatures?.checkOut ? (
                             <div className="w-full h-40 border border-slate-200 rounded flex items-center justify-center bg-slate-50 relative group">
                                 <img src={event.signatures.checkOut} className="max-h-full" alt="Checkout Signature" />
                                 <button 
                                    onClick={() => onUpdateEvent({...event, signatures: {...event.signatures, checkOut: undefined}})}
                                    className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                     <Eraser size={16} />
                                 </button>
                             </div>
                         ) : (
                             <button 
                                onClick={() => startSigning('checkOut')}
                                className="w-full h-40 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors"
                             >
                                 <PenTool size={32} className="mb-2" />
                                 點擊簽名
                             </button>
                         )}
                     </div>

                     <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center">
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                             <PenTool className="w-4 h-4 mr-2" />
                             回收簽名 (Check-in)
                         </h3>
                         {event.signatures?.checkIn ? (
                             <div className="w-full h-40 border border-slate-200 rounded flex items-center justify-center bg-slate-50 relative group">
                                 <img src={event.signatures.checkIn} className="max-h-full" alt="Checkin Signature" />
                                 <button 
                                    onClick={() => onUpdateEvent({...event, signatures: {...event.signatures, checkIn: undefined}})}
                                    className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                     <Eraser size={16} />
                                 </button>
                             </div>
                         ) : (
                             <button 
                                onClick={() => startSigning('checkIn')}
                                className="w-full h-40 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors"
                             >
                                 <PenTool size={32} className="mb-2" />
                                 點擊簽名
                             </button>
                         )}
                     </div>
                </div>
            </div>

            {/* Signature Modal */}
            {signatureType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {signatureType === 'checkOut' ? '出庫簽名確認' : '回收簽名確認'}
                            </h3>
                            <button onClick={() => setSignatureType(null)} className="text-slate-400 hover:text-slate-600"><X /></button>
                        </div>
                        <div className="p-4 bg-slate-100 flex justify-center">
                            <canvas 
                                ref={canvasRef}
                                width={500}
                                height={250}
                                className="bg-white border border-slate-300 shadow-inner rounded cursor-crosshair touch-none w-full"
                                onMouseDown={beginPath}
                                onMouseMove={handleDraw}
                                onMouseUp={() => setIsSigning(false)}
                                onMouseLeave={() => setIsSigning(false)}
                                onTouchStart={beginPath}
                                onTouchMove={handleDraw}
                                onTouchEnd={() => setIsSigning(false)}
                            />
                        </div>
                        <div className="p-4 flex justify-between items-center border-t border-slate-200">
                            <button onClick={clearSignature} className="flex items-center text-slate-500 hover:text-red-600 px-3 py-2 rounded hover:bg-red-50">
                                <Eraser className="w-4 h-4 mr-2" /> 清除
                            </button>
                            <div className="flex gap-3">
                                <button onClick={() => setSignatureType(null)} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">取消</button>
                                <button onClick={saveSignature} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center shadow-lg">
                                    <Check className="w-4 h-4 mr-2" /> 確認簽名
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};