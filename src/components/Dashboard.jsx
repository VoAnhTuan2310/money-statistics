import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, TrendingDown, Wallet, Target, AlertTriangle, 
  ArrowUpRight, ArrowDownLeft, Calendar, HelpCircle, ChevronRight, Edit, X
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import { formatVND, formatNumberInput } from '../utils/storage';

export default function Dashboard({ transactions, budget, savingsPots, onNavigate, onAddTransaction }) {
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [newBalanceValue, setNewBalanceValue] = useState('');

  const handleBalanceSubmit = (e) => {
    e.preventDefault();
    const targetVal = Number(newBalanceValue);
    if (isNaN(targetVal)) return;

    const diff = targetVal - stats.activeBalance;
    if (diff !== 0) {
      onAddTransaction({
        type: diff > 0 ? 'income' : 'expense',
        amount: Math.abs(diff),
        category: 'Điều chỉnh số dư',
        date: new Date().toISOString().split('T')[0],
        note: 'Điều chỉnh số dư tài khoản thực tế'
      });
    }
    setShowBalanceModal(false);
  };

  // Memoized Calculations
  const stats = useMemo(() => {
    // Current month transactions
    const monthTxs = transactions.filter(t => t.date.startsWith(currentMonth));
    
    const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    // Total savings across all pots
    const totalSavings = savingsPots.reduce((sum, p) => sum + p.currentAmount, 0);
    
    // Active balance = Total Income - Total Expense (all time or just current month? Let's do all time active balance)
    const allIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const allExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const activeBalance = allIncome - allExpense;

    return {
      monthlyIncome: income,
      monthlyExpense: expense,
      activeBalance,
      totalSavings,
      monthTxs
    };
  }, [transactions, savingsPots, currentMonth]);

  // Process data for Line Chart (Cashflow trend this month)
  const lineChartData = useMemo(() => {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dataMap = {};
    
    // Initialize days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = `${currentMonth}-${String(i).padStart(2, '0')}`;
      dataMap[dayStr] = { day: `${i}`, 'Tiền vào': 0, 'Tiền ra': 0 };
    }

    // Populate data
    stats.monthTxs.forEach(tx => {
      if (dataMap[tx.date]) {
        if (tx.type === 'income') {
          dataMap[tx.date]['Tiền vào'] += tx.amount;
        } else {
          dataMap[tx.date]['Tiền ra'] += tx.amount;
        }
      }
    });

    return Object.values(dataMap);
  }, [stats.monthTxs, currentMonth]);

  // Process data for Pie Chart (Expenses by Category)
  const pieChartData = useMemo(() => {
    const categoryTotals = {};
    
    stats.monthTxs
      .filter(t => t.type === 'expense')
      .forEach(tx => {
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
      });

    return Object.keys(categoryTotals).map(cat => ({
      name: cat,
      value: categoryTotals[cat]
    })).sort((a, b) => b.value - a.value);
  }, [stats.monthTxs]);

  // Process data for Bar Chart (Income vs Expense comparison for last 6 months)
  const monthlyComparisonData = useMemo(() => {
    const dataMap = {};
    const last6Months = [];
    const date = new Date();
    
    // Generate list of YYYY-MM for the last 6 months (chronological order)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const mStr = d.toISOString().substring(0, 7); // YYYY-MM
      last6Months.push(mStr);
      dataMap[mStr] = { 
        month: `Tháng ${d.getMonth() + 1}`, 
        'Tiền vào': 0, 
        'Tiền ra': 0 
      };
    }

    // Populate data
    transactions.forEach(tx => {
      const txMonth = tx.date.substring(0, 7);
      if (dataMap[txMonth]) {
        if (tx.type === 'income') {
          dataMap[txMonth]['Tiền vào'] += tx.amount;
        } else {
          dataMap[txMonth]['Tiền ra'] += tx.amount;
        }
      }
    });

    return last6Months.map(m => dataMap[m]);
  }, [transactions]);

  const COLORS = ['#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#6366f1', '#ec4899', '#8b5cf6', '#64748b'];

  // Budgets Progress
  const expenseLimitPercent = Math.round((stats.monthlyExpense / budget.monthlyExpenseLimit) * 100) || 0;
  const incomeTargetPercent = Math.min(100, Math.round((stats.monthlyIncome / budget.monthlyIncomeTarget) * 100)) || 0;

  // Budget Alert Level
  const budgetAlertColor = () => {
    if (expenseLimitPercent >= 100) return 'text-red-400 border-red-500/20 bg-red-500/5';
    if (expenseLimitPercent >= 80) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-purple-400 border-purple-500/20 bg-purple-500/5';
  };

  return (
    <div className="space-y-6">
      {/* 1. Welcome and General Stats Cards */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-100 font-heading">Tổng Quan Tài Chính</h2>
          <p className="text-slate-400 mt-1">Thống kê tài chính cá nhân tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Balance Card */}
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5 relative overflow-hidden group hover:border-indigo-500/40 hover:-translate-y-1.5 glow-indigo hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.35)] transition-all duration-300">
          <div className="absolute -right-3 -bottom-3 text-slate-900 opacity-20 transform scale-150 transition-transform group-hover:scale-170 group-hover:rotate-12 duration-500">
            <Wallet className="w-24 h-24" />
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition duration-300">
            <Wallet className="w-6 h-6 group-hover:animate-float" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              Số dư hiện tại
              <button 
                onClick={() => {
                  setNewBalanceValue(stats.activeBalance.toString());
                  setShowBalanceModal(true);
                }}
                className="text-slate-400 hover:text-indigo-400 p-0.5 rounded hover:bg-slate-900 transition cursor-pointer"
                title="Sửa số dư nhanh"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </span>
            <span className="text-2xl font-black text-white font-heading block truncate text-glow-purple">{formatVND(stats.activeBalance)}</span>
          </div>
        </div>

        {/* Income Card */}
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5 relative overflow-hidden group hover:border-emerald-500/40 hover:-translate-y-1.5 glow-emerald hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.35)] transition-all duration-300">
          <div className="absolute -right-3 -bottom-3 text-slate-900 opacity-20 transform scale-150 transition-transform group-hover:scale-170 group-hover:rotate-12 duration-500">
            <TrendingUp className="w-24 h-24" />
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition duration-300">
            <TrendingUp className="w-6 h-6 group-hover:animate-float" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Tiền vào tháng này</span>
            <span className="text-2xl font-black text-emerald-450 font-heading text-glow-emerald">{formatVND(stats.monthlyIncome)}</span>
          </div>
        </div>

        {/* Expense Card */}
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5 relative overflow-hidden group hover:border-rose-500/40 hover:-translate-y-1.5 glow-rose hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.35)] transition-all duration-300">
          <div className="absolute -right-3 -bottom-3 text-slate-900 opacity-20 transform scale-150 transition-transform group-hover:scale-170 group-hover:rotate-12 duration-500">
            <TrendingDown className="w-24 h-24" />
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-450 rounded-xl border border-rose-500/20 group-hover:bg-rose-500/20 group-hover:border-rose-500/30 transition duration-300">
            <TrendingDown className="w-6 h-6 group-hover:animate-float" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Tiền ra tháng này</span>
            <span className="text-2xl font-black text-rose-450 font-heading text-glow-rose">{formatVND(stats.monthlyExpense)}</span>
          </div>
        </div>

        {/* Total Savings Card */}
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5 relative overflow-hidden group hover:border-purple-500/40 hover:-translate-y-1.5 glow-purple hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.35)] transition-all duration-300">
          <div className="absolute -right-3 -bottom-3 text-slate-900 opacity-20 transform scale-150 transition-transform group-hover:scale-170 group-hover:rotate-12 duration-500">
            <Target className="w-24 h-24" />
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 group-hover:bg-purple-500/20 group-hover:border-purple-500/30 transition duration-300">
            <Target className="w-6 h-6 group-hover:animate-float" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Tổng quỹ tiết kiệm</span>
            <span className="text-2xl font-black text-purple-450 font-heading text-glow-purple">{formatVND(stats.totalSavings)}</span>
          </div>
        </div>
      </div>

      {/* 2. Budget Limits & Savings Progress section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spend Limit Tracker */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-slate-100 font-heading">Giới Hạn Chi Tiêu Tháng</h3>
              <p className="text-xs text-slate-400 mt-0.5">Hạn mức chi tối đa đã cài đặt</p>
            </div>
            <span className="text-lg font-bold text-white font-heading">{formatVND(budget.monthlyExpenseLimit)}</span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-900">
              <div 
                className={`h-full rounded-full progress-sheen transition-all duration-500 ${
                  expenseLimitPercent >= 100 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : expenseLimitPercent >= 80 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-purple-550 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                }`}
                style={{ width: `${Math.min(100, expenseLimitPercent)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Đã chi: {expenseLimitPercent}%</span>
              <span>Còn lại: {formatVND(Math.max(0, budget.monthlyExpenseLimit - stats.monthlyExpense))}</span>
            </div>
          </div>

          {/* Budget Status Message */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${budgetAlertColor()}`}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              {expenseLimitPercent >= 100 ? (
                <p><strong>CẢNH BÁO:</strong> Bạn đã vượt quá giới hạn chi tiêu tối đa của tháng này. Vui lòng thắt chặt các chi tiêu không cần thiết!</p>
              ) : expenseLimitPercent >= 80 ? (
                <p><strong>CHÚ Ý:</strong> Chi tiêu của bạn đã chạm mức cảnh báo (80%+). Cân nhắc trước khi thực hiện các giao dịch lớn tiếp theo.</p>
              ) : (
                <p>Ngân sách chi tiêu hiện tại đang ở trạng thái an toàn. Chúc mừng bạn đã duy trì thói quen quản lý chi tiêu tốt!</p>
              )}
            </div>
          </div>
        </div>

        {/* Income/Saving Target Progress */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-slate-100 font-heading">Mục Tiêu Thu Nhập Tháng</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tiền phải nạp vào / kiếm được tối thiểu</p>
            </div>
            <span className="text-lg font-bold text-white font-heading">{formatVND(budget.monthlyIncomeTarget)}</span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-900">
              <div 
                className="h-full bg-emerald-500 rounded-full progress-sheen shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-500"
                style={{ width: `${incomeTargetPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Đã đạt: {incomeTargetPercent}%</span>
              <span>Cần thêm: {formatVND(Math.max(0, budget.monthlyIncomeTarget - stats.monthlyIncome))}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 flex items-start gap-3">
            <Target className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              {incomeTargetPercent >= 100 ? (
                <p>Xuất sắc! Bạn đã hoàn thành 100% mục tiêu thu nhập đề ra của tháng này. Tiếp tục duy trì phong độ nhé!</p>
              ) : (
                <p>Hãy cố gắng gia tăng nguồn thu hoặc tiết kiệm chặt chẽ hơn để hoàn thành mục tiêu {formatVND(budget.monthlyIncomeTarget)} đề ra.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Charts Grid (takes 2 cols of 3) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Trend Chart */}
          <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 font-heading">
              <TrendingUp className="w-4 h-4" /> Xu Hướng Thu Nhập (Tiền vào)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={9} 
                    tickLine={false} 
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return val;
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelFormatter={(label) => `Ngày ${label}`}
                    formatter={(value) => [formatVND(value), '']}
                  />
                  <Area type="monotone" dataKey="Tiền vào" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Trend Chart */}
          <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-1.5 font-heading">
              <TrendingDown className="w-4 h-4 text-rose-400" /> Xu Hướng Chi Tiêu (Tiền ra)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={9} 
                    tickLine={false} 
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return val;
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelFormatter={(label) => `Ngày ${label}`}
                    formatter={(value) => [formatVND(value), '']}
                  />
                  <Area type="monotone" dataKey="Tiền ra" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pie Chart - Expenses Breakdown */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
          <h3 className="text-lg font-bold text-slate-100 font-heading">Cơ Cấu Chi Tiêu</h3>
          
          {pieChartData.length > 0 ? (
            <>
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      formatter={(value) => [formatVND(value), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend */}
              <div className="overflow-y-auto max-h-32 text-xs space-y-1.5 pr-2">
                {pieChartData.map((entry, index) => (
                  <div key={entry.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-slate-300 line-clamp-1">{entry.name}</span>
                    </div>
                    <span className="font-semibold text-slate-400">{formatVND(entry.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-6">
              <HelpCircle className="w-10 h-10 text-slate-700 mb-2" />
              <p className="text-sm">Chưa có giao dịch chi tiêu nào trong tháng này để phân tích.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3.5. Monthly Comparison Bar Chart Row */}
      <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-heading">
          <TrendingUp className="w-5 h-5 text-indigo-400" /> So Sánh Thu Chi Qua Các Tháng
        </h3>
        <p className="text-xs text-slate-400">Xu hướng tổng chi tiêu (Tiền ra) và thu nhập (Tiền vào) trong 6 tháng gần nhất để theo dõi mức độ tích lũy.</p>
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                tickFormatter={(val) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                  return val;
                }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                formatter={(value) => [formatVND(value), '']}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Bar dataKey="Tiền vào" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Tiền ra" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Recent Transactions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2 font-heading">
              <ArrowDownLeft className="w-5 h-5" /> Chi Tiêu Gần Đây
            </h3>
            <button 
              onClick={() => onNavigate('transactions')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-900/50">
            {transactions.filter(t => t.type === 'expense').slice(0, 5).map(tx => (
              <div key={tx.id} className="py-3 flex justify-between items-center hover:bg-slate-900/10 px-2 rounded-xl transition duration-150">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-450">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-200 block">{tx.category}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> {new Date(tx.date).toLocaleDateString('vi-VN')}
                      {tx.note && <span className="text-slate-650 truncate max-w-[120px]">| {tx.note}</span>}
                    </span>
                  </div>
                </div>
                <span className="font-bold font-heading text-sm text-rose-450">
                  -{formatVND(tx.amount)}
                </span>
              </div>
            ))}

            {transactions.filter(t => t.type === 'expense').length === 0 && (
              <p className="text-sm text-slate-500 text-center py-6">Chưa có giao dịch chi tiêu nào.</p>
            )}
          </div>
        </div>

        {/* Recent Income */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2 font-heading">
              <ArrowUpRight className="w-5 h-5" /> Thu Nhập Gần Đây
            </h3>
            <button 
              onClick={() => onNavigate('transactions')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-900/50">
            {transactions.filter(t => t.type === 'income').slice(0, 5).map(tx => (
              <div key={tx.id} className="py-3 flex justify-between items-center hover:bg-slate-900/10 px-2 rounded-xl transition duration-150">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-405">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-200 block">{tx.category}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> {new Date(tx.date).toLocaleDateString('vi-VN')}
                      {tx.note && <span className="text-slate-650 truncate max-w-[120px]">| {tx.note}</span>}
                    </span>
                  </div>
                </div>
                <span className="font-bold font-heading text-sm text-emerald-450">
                  +{formatVND(tx.amount)}
                </span>
              </div>
            ))}

            {transactions.filter(t => t.type === 'income').length === 0 && (
              <p className="text-sm text-slate-500 text-center py-6">Chưa có giao dịch thu nhập nào.</p>
            )}
          </div>
        </div>
      </div>

      {/* Balance Edit Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm p-6 rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowBalanceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-100 mb-2 font-heading">Sửa Số Dư Nhanh</h3>
            <p className="text-xs text-slate-400 mb-4">Nhập số dư tài khoản thực tế của bạn. Hệ thống sẽ tự động tạo một giao dịch điều chỉnh số dư chênh lệch.</p>
            <form onSubmit={handleBalanceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Số tiền số dư mới (VND)</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formatNumberInput(newBalanceValue)}
                  onChange={(e) => setNewBalanceValue(e.target.value.replace(/[^\d-]/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-lg font-bold"
                  placeholder="Ví dụ: 10,000,000"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition cursor-pointer text-sm shadow-md"
              >
                Cập Nhật Số Dư
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
