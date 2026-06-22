import React, { useState } from 'react';
import { 
  Plus, Search, Filter, Trash2, ArrowUpRight, ArrowDownLeft, 
  Calendar, FileText, Tag, Edit3, X, Check, RefreshCw 
} from 'lucide-react';
import { getCategories, formatVND, formatNumberInput } from '../utils/storage';

export default function Transactions({ 
  transactions, 
  onAddTransaction, 
  onDeleteTransaction, 
  onUpdateTransaction,
  categories 
}) {
  const finalCategories = categories || getCategories();
  
  // Form State
  const [type, setType] = useState('expense'); // 'income' or 'expense'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(finalCategories.expense[0] || 'Khác');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'

  // Handle Type Change in Form
  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(newType === 'income' ? (finalCategories.income[0] || 'Khác') : (finalCategories.expense[0] || 'Khác'));
  };

  // Handle Form Submit (Add / Edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    const txData = {
      type,
      amount: Number(amount),
      category,
      date,
      note: note.trim()
    };

    if (editingId) {
      onUpdateTransaction({
        ...txData,
        id: editingId
      });
      setEditingId(null);
    } else {
      onAddTransaction(txData);
    }

    // Reset Form
    setAmount('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    setType('expense');
    setCategory(finalCategories.expense[0] || 'Khác');
  };

  // Handle Edit Click
  const startEdit = (tx) => {
    setEditingId(tx.id);
    setType(tx.type);
    setAmount(tx.amount);
    setCategory(tx.category);
    setDate(tx.date);
    setNote(tx.note);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    setType('expense');
    setCategory(finalCategories.expense[0] || 'Khác');
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterMonth(new Date().toISOString().substring(0, 7));
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterMinAmount('');
    setFilterMaxAmount('');
    setFilterType('all');
  };

  // Filter Transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.note.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
    
    let matchesDate = true;
    if (filterStartDate || filterEndDate) {
      if (filterStartDate && tx.date < filterStartDate) matchesDate = false;
      if (filterEndDate && tx.date > filterEndDate) matchesDate = false;
    } else if (filterMonth) {
      matchesDate = tx.date.startsWith(filterMonth);
    }
    
    let matchesAmount = true;
    if (filterMinAmount && tx.amount < Number(filterMinAmount)) matchesAmount = false;
    if (filterMaxAmount && tx.amount > Number(filterMaxAmount)) matchesAmount = false;
    
    const matchesType = filterType === 'all' || tx.type === filterType;
    
    return matchesSearch && matchesCategory && matchesDate && matchesAmount && matchesType;
  });

  const expenses = filteredTransactions.filter(tx => tx.type === 'expense');
  const incomes = filteredTransactions.filter(tx => tx.type === 'income');

  // Calculate totals for filtered transactions
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // All unique categories in current month's transactions (for filters)
  const allCategories = ['all', ...new Set(transactions.map(t => t.category))];

  // Handle Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('Không có giao dịch nào thỏa mãn bộ lọc hiện tại để xuất CSV!');
      return;
    }

    const headers = ['Ngày giao dịch', 'Loại giao dịch', 'Danh mục', 'Số tiền (VND)', 'Ghi chú'];
    const rows = filteredTransactions.map(tx => [
      tx.date,
      tx.type === 'income' ? 'Thu nhập (Tiền vào)' : 'Chi tiêu (Tiền ra)',
      tx.category,
      tx.amount,
      `"${(tx.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // UTF-8 BOM for Microsoft Excel Vietnamese language compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fintrack_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT COLUMN: Input Form */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-panel p-6 rounded-2xl shadow-xl sticky top-6">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-800 pb-3 font-heading">
            {editingId ? <Edit3 className="w-5 h-5 text-indigo-400" /> : <Plus className="w-5 h-5 text-purple-400" />}
            {editingId ? 'Chỉnh Sửa Giao Dịch' : 'Nhập Giao Dịch Mới'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-900">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 px-3 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  type === 'expense'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" /> Tiền ra (Chi)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 px-3 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  type === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" /> Tiền vào (Thu)
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Số tiền (VND)</label>
              <input
                type="text"
                required
                value={formatNumberInput(amount)}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-lg font-bold"
                placeholder="Ví dụ: 50,000"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Danh mục</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
              >
                {type === 'expense' 
                  ? finalCategories.expense.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)
                  : finalCategories.income.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)
                }
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ngày giao dịch</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ghi chú</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                placeholder="Ăn sáng, mua sữa, nhận lương..."
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Hủy
                </button>
              )}
              <button
                type="submit"
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md ${
                  editingId
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/10'
                    : 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/10'
                }`}
              >
                {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? 'Cập nhật' : 'Thêm giao dịch'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Transaction History and Filters */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Filters and search panel */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold text-slate-100 font-heading">Lịch Sử Giao Dịch</h2>
            
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  showAdvancedFilters 
                    ? 'bg-purple-600/15 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Bộ lọc nâng cao</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Xuất CSV</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-900 font-semibold">
                <span>Hiện thị:</span>
                <span className="text-slate-200">{filteredTransactions.length}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative md:col-span-3">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Tìm ghi chú, danh mục..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            {/* Month Filter */}
            <div>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  // clear custom dates to prevent override confusion
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                disabled={filterStartDate || filterEndDate}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-xs disabled:opacity-50"
              />
            </div>
          </div>

          {/* ADVANCED FILTER DRAWER */}
          {showAdvancedFilters && (
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-900/60 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              
              {/* Custom Date Range */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Khoảng ngày (Từ - Đến)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="px-2 py-1.5 rounded-lg glass-input text-[11px]"
                  />
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="px-2 py-1.5 rounded-lg glass-input text-[11px]"
                  />
                </div>
              </div>

              {/* Custom Amount Range */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Số tiền (Min - Max)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min VND"
                    value={filterMinAmount}
                    onChange={(e) => setFilterMinAmount(e.target.value)}
                    className="px-2 py-1.5 rounded-lg glass-input text-[11px]"
                  />
                  <input
                    type="number"
                    placeholder="Max VND"
                    value={filterMaxAmount}
                    onChange={(e) => setFilterMaxAmount(e.target.value)}
                    className="px-2 py-1.5 rounded-lg glass-input text-[11px]"
                  />
                </div>
              </div>

              {/* Transaction Type & Category Filters */}
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider mb-1">Loại</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg glass-input text-[11px]"
                    >
                      <option value="all" className="bg-slate-900">Tất cả</option>
                      <option value="income" className="bg-slate-900">Thu nhập (+)</option>
                      <option value="expense" className="bg-slate-900">Chi tiêu (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider mb-1">Danh mục</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg glass-input text-[11px]"
                    >
                      <option value="all" className="bg-slate-900">Tất cả</option>
                      {allCategories.filter(c => c !== 'all').map(c => (
                        <option key={c} value={c} className="bg-slate-900">{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Reset filter button */}
              <div className="col-span-full flex justify-end">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-[11px] font-semibold transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Đặt lại bộ lọc</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Quick stats for current filters */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-900/50">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 block font-semibold uppercase">Thu nhập theo bộ lọc</span>
              <span className="text-lg font-bold text-emerald-450 font-heading">{formatVND(totalIncome)}</span>
            </div>
            <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 block font-semibold uppercase">Chi tiêu theo bộ lọc</span>
              <span className="text-lg font-bold text-rose-450 font-heading">{formatVND(totalExpense)}</span>
            </div>
          </div>
        </div>

        {/* Transactions Lists Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Bảng Chi Tiêu */}
          <div className="glass-panel rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 bg-rose-500/5 border-b border-slate-900 flex justify-between items-center">
              <h3 className="font-bold text-rose-450 flex items-center gap-1.5 text-sm font-heading">
                <ArrowDownLeft className="w-4 h-4 text-rose-400" /> Chi Tiêu (Tiền ra)
              </h3>
              <span className="text-xs bg-rose-500/10 text-rose-450 px-2 py-0.5 rounded-full font-semibold">
                {expenses.length} giao dịch
              </span>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Ngày</th>
                    <th className="py-3 px-4">Danh mục / Ghi chú</th>
                    <th className="py-3 px-4 text-right">Số tiền</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50 text-xs">
                  {expenses.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-900/30 transition duration-150">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-350">
                        {new Date(tx.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 max-w-[150px] truncate">
                        <span className="font-semibold text-slate-200 block">{tx.category}</span>
                        {tx.note && <span className="text-slate-500 text-[10px] block truncate" title={tx.note}>{tx.note}</span>}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-rose-450 font-heading">
                        -{formatVND(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEdit(tx)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition cursor-pointer"
                            title="Sửa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-405 hover:bg-slate-800 transition cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500 text-xs font-semibold">
                        Không có giao dịch chi tiêu thỏa mãn.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bảng Thu Nhập */}
          <div className="glass-panel rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 bg-emerald-500/5 border-b border-slate-900 flex justify-between items-center">
              <h3 className="font-bold text-emerald-455 flex items-center gap-1.5 text-sm font-heading">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Thu Nhập (Tiền vào)
              </h3>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                {incomes.length} giao dịch
              </span>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Ngày</th>
                    <th className="py-3 px-4">Danh mục / Ghi chú</th>
                    <th className="py-3 px-4 text-right">Số tiền</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50 text-xs">
                  {incomes.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-900/30 transition duration-150">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-350">
                        {new Date(tx.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 max-w-[150px] truncate">
                        <span className="font-semibold text-slate-200 block">{tx.category}</span>
                        {tx.note && <span className="text-slate-500 text-[10px] block truncate" title={tx.note}>{tx.note}</span>}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-emerald-450 font-heading">
                        +{formatVND(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEdit(tx)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition cursor-pointer"
                            title="Sửa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-405 hover:bg-slate-800 transition cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {incomes.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500 text-xs font-semibold">
                        Không có giao dịch thu nhập thỏa mãn.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
