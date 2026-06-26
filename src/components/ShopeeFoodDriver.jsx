import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bike, Calendar, Trash2, Plus, CheckCircle, Fuel, Phone, Coffee, 
  BarChart3, TrendingUp, ClipboardList, ChevronRight, Gauge
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { formatVND } from '../utils/storage';

export default function ShopeeFoodDriver({ activeUser }) {
  // ------------------ SHIFT STATE ------------------
  const [shifts, setShifts] = useState(() => {
    const saved = localStorage.getItem(`fintrack_shopee_shifts_${activeUser}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Shift Form State
  const [shiftDate, setShiftDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [ordersCount, setOrdersCount] = useState('');
  const [earningsApp, setEarningsApp] = useState('');
  const [tipsCount, setTipsCount] = useState('');
  const [gasCost, setGasCost] = useState('');
  const [phoneCost, setPhoneCost] = useState('');
  const [mealsCost, setMealsCost] = useState('');
  const [shiftNote, setShiftNote] = useState('');

  // Save states to local storage
  useEffect(() => {
    localStorage.setItem(`fintrack_shopee_shifts_${activeUser}`, JSON.stringify(shifts));
  }, [shifts, activeUser]);

  // ------------------ ACTIONS ------------------

  // Save Shift Log
  const handleAddShift = (e) => {
    e.preventDefault();

    const orders = parseInt(ordersCount) || 0;
    const earnApp = parseInt(earningsApp) || 0;
    const tips = parseInt(tipsCount) || 0;
    const gas = parseInt(gasCost) || 0;
    const phone = parseInt(phoneCost) || 0;
    const meals = parseInt(mealsCost) || 0;

    if (earnApp === 0 && orders === 0) {
      alert('Vui lòng nhập số đơn hàng hoặc thu nhập từ app.');
      return;
    }

    const newShift = {
      id: Date.now(),
      date: shiftDate,
      orders,
      earningsApp: earnApp,
      tips,
      gas,
      phone,
      meals,
      note: shiftNote,
    };

    setShifts((prev) => [newShift, ...prev]);

    // Reset Form
    setOrdersCount('');
    setEarningsApp('');
    setTipsCount('');
    setGasCost('');
    setPhoneCost('');
    setMealsCost('');
    setShiftNote('');
    alert('Đã ghi nhận ca làm việc thành công!');
  };

  // Delete Shift
  const handleDeleteShift = (id) => {
    if (confirm('Bạn có chắc muốn xóa ca làm việc này khỏi lịch sử?')) {
      setShifts((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // ------------------ CALCULATE PERFORMANCE & STATS ------------------

  const stats = useMemo(() => {
    const totalRev = shifts.reduce((sum, s) => sum + s.earningsApp + s.tips, 0);
    const totalGas = shifts.reduce((sum, s) => sum + s.gas, 0);
    const totalPhone = shifts.reduce((sum, s) => sum + s.phone, 0);
    const totalMeals = shifts.reduce((sum, s) => sum + s.meals, 0);

    const totalExp = totalGas + totalPhone + totalMeals;
    const netProfit = totalRev - totalExp;

    const totalOrders = shifts.reduce((sum, s) => sum + s.orders, 0);
    const avgEarningsPerOrder = totalOrders > 0 ? totalRev / totalOrders : 0;
    const avgGasPerShift = shifts.length > 0 ? totalGas / shifts.length : 0;

    return {
      totalRev,
      totalGas,
      totalPhone,
      totalMeals,
      totalExp,
      netProfit,
      totalOrders,
      avgEarningsPerOrder,
      avgGasPerShift
    };
  }, [shifts]);

  // Chart Data preparation (Last 15 shifts)
  const chartData = useMemo(() => {
    return shifts.slice(0, 15).reverse().map((s) => {
      const dayLabel = s.date.substring(5); // MM-DD
      const revenue = s.earningsApp + s.tips;
      const expenses = s.gas + s.phone + s.meals;
      const net = revenue - expenses;

      return {
        date: dayLabel,
        'Doanh thu': revenue,
        'Chi phí': expenses,
        'Lợi nhuận': net
      };
    });
  }, [shifts]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-slide-up pb-12">
      
      {/* Title Header */}
      <div className="border-b border-slate-900 pb-5">
        <h2 className="text-2xl font-black text-slate-100 font-heading flex items-center gap-2.5">
          <Bike className="w-7 h-7 text-purple-400" />
          <span>ShopeeFood Driver Hub</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Theo dõi cước phí, thưởng mốc, tiền boa, chi phí xăng xe và thống kê hiệu quả thu nhập ròng hàng ngày.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Profit Card */}
        <div className="glass-panel p-4.5 rounded-2xl border border-slate-900/60 bg-slate-950/20 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            stats.netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Lợi nhuận thực nhận</span>
            <span className={`text-base font-black ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatVND(stats.netProfit)}
            </span>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="glass-panel p-4.5 rounded-2xl border border-slate-900/60 bg-slate-950/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex-shrink-0 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Tổng doanh thu thô</span>
            <span className="text-base font-black text-slate-100">{formatVND(stats.totalRev)}</span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="glass-panel p-4.5 rounded-2xl border border-slate-900/60 bg-slate-950/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex-shrink-0 flex items-center justify-center">
            <Fuel className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Tổng chi chạy xe</span>
            <span className="text-base font-black text-slate-100">{formatVND(stats.totalExp)}</span>
          </div>
        </div>

        {/* Efficiency Indicator Card */}
        <div className="glass-panel p-4.5 rounded-2xl border border-slate-900/60 bg-slate-950/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex-shrink-0 flex items-center justify-center">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Trung bình / đơn</span>
            <span className="text-base font-black text-slate-100">{formatVND(stats.avgEarningsPerOrder)}</span>
          </div>
        </div>

      </div>

      {/* Form and Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        
        {/* Daily Shift Logger Form (Span 2) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-purple-500/10 bg-slate-950/20 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2 border-b border-slate-900 pb-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Ghi Nhận Ca Làm Việc Mới</span>
            </h3>

            <form onSubmit={handleAddShift} className="space-y-4 text-xs font-semibold text-slate-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-550 uppercase font-bold block">Ngày làm việc</label>
                  <input 
                    type="date" 
                    required
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    className="glass-input px-3 py-2 rounded-xl w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-550 uppercase font-bold block">Số đơn hàng</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="Ví dụ: 15"
                    value={ordersCount}
                    onChange={(e) => setOrdersCount(e.target.value)}
                    className="glass-input px-3 py-2 rounded-xl w-full text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-550 uppercase font-bold block">Thu nhập App (Cước + Thưởng)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="VND"
                    value={earningsApp}
                    onChange={(e) => setEarningsApp(e.target.value)}
                    className="glass-input px-3 py-2 rounded-xl w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-555 uppercase font-bold block">Tiền Tips (Khách boa)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="VND"
                    value={tipsCount}
                    onChange={(e) => setTipsCount(e.target.value)}
                    className="glass-input px-3 py-2 rounded-xl w-full"
                  />
                </div>
              </div>

              <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider pt-2 border-t border-slate-900/60">Chi phí trong ca chạy xe:</h4>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-550 uppercase font-bold block flex items-center gap-0.5"><Fuel className="w-3 h-3" />Xăng xe</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="VND"
                    value={gasCost}
                    onChange={(e) => setGasCost(e.target.value)}
                    className="glass-input px-2 py-2 rounded-xl w-full text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-550 uppercase font-bold block flex items-center gap-0.5"><Phone className="w-3 h-3" />Mạng/4G</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="VND"
                    value={phoneCost}
                    onChange={(e) => setPhoneCost(e.target.value)}
                    className="glass-input px-2 py-2 rounded-xl w-full text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-550 uppercase font-bold block flex items-center gap-0.5"><Coffee className="w-3 h-3" />Ăn uống</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="VND"
                    value={mealsCost}
                    onChange={(e) => setMealsCost(e.target.value)}
                    className="glass-input px-2 py-2 rounded-xl w-full text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-550 uppercase font-bold block">Ghi chú</label>
                <input 
                  type="text" 
                  placeholder="Ghi chú thêm về ngày chạy xe (nếu có)"
                  value={shiftNote}
                  onChange={(e) => setShiftNote(e.target.value)}
                  className="glass-input px-3 py-2 rounded-xl w-full"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-650 hover:bg-purple-600 text-white font-extrabold rounded-xl transition cursor-pointer btn-click-effect border border-purple-550/20 shadow-lg mt-3"
              >
                Thêm ca làm việc
              </button>
            </form>
          </div>
        </div>

        {/* Performance Charts (Span 3) */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-3xl border border-slate-900/60 bg-slate-950/20 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2 border-b border-slate-900 pb-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>Biểu Đồ Doanh Thu & Lợi Nhuận (15 ca gần nhất)</span>
            </h3>

            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-550 text-xs">
                📊 Nhập ca làm việc để hiển thị phân tích biểu đồ.
              </div>
            ) : (
              <div className="h-64 w-full text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#090d16', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '12px' 
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="Doanh thu" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Chi phí" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Lợi nhuận" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Shift Logs Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-900/60 bg-slate-950/20">
        <h3 className="text-sm font-bold text-slate-200 border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
          <ClipboardList className="w-4.5 h-4.5 text-purple-400" />
          <span>Nhật Ký Lịch Sử Ca Chạy Xe ({shifts.length})</span>
        </h3>

        {shifts.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            📭 Chưa ghi nhận ca chạy nào. Vui lòng ghi lại ca đầu tiên của bạn ở form trên!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-slate-900/60">
                  <th className="py-2.5 font-bold">Ngày</th>
                  <th className="py-2.5 font-bold text-center">Số đơn</th>
                  <th className="py-2.5 font-bold text-right">Thu nhập App</th>
                  <th className="py-2.5 font-bold text-right">Tiền Tips</th>
                  <th className="py-2.5 font-bold text-right">Chi phí ca</th>
                  <th className="py-2.5 font-bold text-right">Lợi nhuận ròng</th>
                  <th className="py-2.5 font-bold">Ghi chú</th>
                  <th className="py-2.5 text-center font-bold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => {
                  const revenue = s.earningsApp + s.tips;
                  const expenses = s.gas + s.phone + s.meals;
                  const net = revenue - expenses;

                  return (
                    <tr key={s.id} className="border-b border-slate-900/40 hover:bg-slate-900/10 transition">
                      <td className="py-3 font-medium text-slate-300">{s.date}</td>
                      <td className="py-3 text-center font-bold text-slate-200">{s.orders}</td>
                      <td className="py-3 text-right font-semibold text-purple-400">{formatVND(s.earningsApp)}</td>
                      <td className="py-3 text-right font-semibold text-amber-400">{s.tips > 0 ? formatVND(s.tips) : '—'}</td>
                      <td className="py-3 text-right font-semibold text-rose-400" title={`Xăng: ${formatVND(s.gas)} | Mạng: ${formatVND(s.phone)} | Ăn uống: ${formatVND(s.meals)}`}>
                        {formatVND(expenses)}
                      </td>
                      <td className={`py-3 text-right font-bold ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatVND(net)}
                      </td>
                      <td className="py-3 text-slate-400 max-w-[150px] truncate" title={s.note}>{s.note || '—'}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleDeleteShift(s.id)}
                          className="p-1.5 rounded-lg text-slate-550 hover:text-rose-400 transition cursor-pointer hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10"
                          title="Xóa ca chạy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
