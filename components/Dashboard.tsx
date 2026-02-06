import React from 'react';
import { Equipment, Event, ConflictAlert, EventStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Package, Calendar, Activity, Briefcase, LayoutTemplate, Building2 } from 'lucide-react';
import { formatDate } from '../utils';

interface DashboardProps {
  events: Event[];
  inventory: Equipment[];
  conflicts: ConflictAlert[];
}

export const Dashboard: React.FC<DashboardProps> = ({ events, inventory, conflicts }) => {
  // Stats
  const activeEvents = events.filter(e => e.status !== EventStatus.ENDED && e.status !== EventStatus.DISMANTLE);
  
  // Calculate category breakdowns for active events
  const clientCount = activeEvents.filter(e => e.category === 'Client').length;
  const exhibitionCount = activeEvents.filter(e => e.category === 'Exhibition').length;
  const internalCount = activeEvents.filter(e => e.category === 'Internal').length;
  
  // Future 72h events
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 72 * 60 * 60 * 1000);
  const upcomingEvents = events.filter(e => {
    const start = new Date(e.startDate);
    return start >= now && start <= threeDaysLater;
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Top 5 Assets by Stock Value/Quantity
  const sortedInventory = [...inventory].sort((a, b) => b.stock - a.stock).slice(0, 5);
  const chartData = sortedInventory.map(i => ({ name: i.name, value: i.stock }));

  const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">進行中活動</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{activeEvents.length}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <Activity size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">庫存衝突</p>
            <p className={`text-2xl font-bold mt-1 ${conflicts.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {conflicts.length}
            </p>
          </div>
          <div className={`p-3 rounded-full ${conflicts.length > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">客戶活動</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{clientCount}</p>
          </div>
          <div className="p-3 bg-cyan-50 rounded-full text-cyan-600">
            <Briefcase size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">展會活動</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{exhibitionCount}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-full text-purple-600">
            <LayoutTemplate size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">內部活動</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{internalCount}</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-full text-slate-600">
            <Building2 size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conflict Alert Section - Widened to 2 cols */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
            智慧衝突警報
          </h3>
          {conflicts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Package className="w-12 h-12 mb-2 opacity-50" />
              <p>目前無庫存衝突</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-64">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 sticky top-0">
                  <tr>
                    <th className="p-2">日期</th>
                    <th className="p-2">設備名稱</th>
                    <th className="p-2">影響活動</th>
                    <th className="p-2 text-right">缺口</th>
                  </tr>
                </thead>
                <tbody>
                  {conflicts.map((c, idx) => (
                    <tr key={`${c.date}-${c.equipmentId}-${idx}`} className="border-b border-slate-100 hover:bg-red-50">
                      <td className="p-2 text-slate-600 whitespace-nowrap align-top">{formatDate(c.date)}</td>
                      <td className="p-2 font-medium text-slate-800 align-top">{c.equipmentName}</td>
                      <td className="p-2 text-slate-600 align-top">
                        <div className="flex flex-wrap gap-1">
                          {c.relatedEventTitles.map((title, i) => (
                            <span key={i} className="inline-block bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-xs">
                              {title}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 text-right text-red-600 font-bold align-top">-{c.shortage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Chart - Narrowed to 1 col */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4">核心資產分佈 (Top 5)</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-500" />
          近期活動快照 (72h)
        </h3>
        {upcomingEvents.length === 0 ? (
          <p className="text-slate-500 text-center py-8">未來 3 天無新增活動</p>
        ) : (
          <div className="grid gap-4">
            {upcomingEvents.map(evt => (
              <div key={evt.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">{evt.title}</span>
                  <div className="flex items-center text-sm text-slate-500 mt-1 space-x-3">
                    <span className="bg-white px-2 py-0.5 rounded border text-xs">{evt.category}</span>
                    <span>{formatDate(evt.startDate)} - {formatDate(evt.endDate)}</span>
                    <span>{evt.logistics.location}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                      ${evt.status === EventStatus.PLANNING ? 'bg-yellow-100 text-yellow-800' : 
                        evt.status === EventStatus.EXHIBITION ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>
                      {evt.status}
                    </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
