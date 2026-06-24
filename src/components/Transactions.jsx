import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Trash2, ArrowUpRight, ArrowDownLeft, 
  Calendar, FileText, Tag, Edit3, X, Check, RefreshCw, Sparkles
} from 'lucide-react';
import { getCategories, formatVND, formatNumberInput } from '../utils/storage';
import { parseTransactionWithAI, getLocalDateString } from '../utils/aiParser';

export default function Transactions({ 
  transactions, 
  onAddTransaction, 
  onDeleteTransaction, 
  onUpdateTransaction,
  categories,
  wallets = [],
  geminiKey,
  userRole = 'user'
}) {
  const finalCategories = categories || getCategories();
  
  // Form State
  const [type, setType] = useState('expense'); // 'income' or 'expense'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(finalCategories.expense[0] || 'Khác');
  const [date, setDate] = useState(getLocalDateString(new Date()));
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [walletId, setWalletId] = useState('');
  const [excludeFromStats, setExcludeFromStats] = useState(false);
  
  // AI Parsing State
  const [inputMode, setInputMode] = useState('manual'); // 'manual' or 'ai'
  const [aiInput, setAiInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);

  const handleAiParse = async () => {
    if (!aiInput.trim() || isParsing) return;
    setIsParsing(true);
    setParsedResult(null);
    try {
      const result = await parseTransactionWithAI(
        aiInput,
        wallets,
        finalCategories,
        geminiKey
      );
      setParsedResult(result);
    } catch (err) {
      console.error(err);
      alert('Lỗi phân tích cú pháp giao dịch. Vui lòng thử lại!');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveParsedResult = () => {
    if (!parsedResult) return;
    onAddTransaction(parsedResult);
    setAiInput('');
    setParsedResult(null);
    alert('Đã ghi nhận giao dịch thành công!');
  };

  const handleFillManualForm = () => {
    if (!parsedResult) return;
    setType(parsedResult.type);
    setAmount(parsedResult.amount.toString());
    setCategory(parsedResult.category);
    setDate(parsedResult.date);
    setNote(parsedResult.note);
    setWalletId(parsedResult.walletId || (wallets.length > 0 ? wallets[0].id : ''));
    setExcludeFromStats(parsedResult.excludeFromStats);
    setInputMode('manual');
    setParsedResult(null);
  };
  
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
  const [filterWallet, setFilterWallet] = useState('all');

  // Sync default wallet selected in form
  useEffect(() => {
    if (wallets.length > 0) {
      const isValid = wallets.some(w => w.id === walletId);
      if (!isValid) {
        setWalletId(wallets[0].id);
      }
    }
  }, [wallets, walletId]);

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
      note: note.trim(),
      walletId: walletId || (wallets.length > 0 ? wallets[0].id : ''),
      excludeFromStats
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
    setDate(getLocalDateString(new Date()));
    setType('expense');
    setCategory(finalCategories.expense[0] || 'Khác');
    setWalletId(wallets.length > 0 ? wallets[0].id : '');
    setExcludeFromStats(false);
  };

  // Handle Edit Click
  const startEdit = (tx) => {
    setEditingId(tx.id);
    setType(tx.type);
    setAmount(tx.amount);
    setCategory(tx.category);
    setDate(tx.date);
    setNote(tx.note);
    setWalletId(tx.walletId || (wallets.length > 0 ? wallets[0].id : ''));
    setExcludeFromStats(tx.excludeFromStats || false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setNote('');
    setDate(getLocalDateString(new Date()));
    setType('expense');
    setCategory(finalCategories.expense[0] || 'Khác');
    setWalletId(wallets.length > 0 ? wallets[0].id : '');
    setExcludeFromStats(false);
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
    setFilterWallet('all');
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
    
    const matchesWallet = filterWallet === 'all' || tx.walletId === filterWallet;
    
    return matchesSearch && matchesCategory && matchesDate && matchesAmount && matchesType && matchesWallet;
  });

  const expenses = filteredTransactions.filter(tx => tx.type === 'expense');
  const incomes = filteredTransactions.filter(tx => tx.type === 'income');

  // Calculate totals for filtered transactions (excluding non-stat transactions)
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income' && !t.excludeFromStats)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense' && !t.excludeFromStats)
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
    link.setAttribute('download', `anhtuan_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT COLUMN: Input Form */}
      {userRole !== 'user' && (
        <div className="lg:col-span-1 space-y-6">
        <div className="glass-panel p-6 rounded-2xl shadow-xl sticky top-6">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-800 pb-3 font-heading">
            {editingId ? <Edit3 className="w-5 h-5 text-indigo-400" /> : <Plus className="w-5 h-5 text-purple-400" />}
            {editingId ? 'Chỉnh Sửa Giao Dịch' : 'Nhập Giao Dịch Mới'}
          </h2>

          {/* Mode Switcher */}
          {!editingId && (
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-900 mb-4">
              <button
                type="button"
                onClick={() => {
                  setInputMode('manual');
                  setParsedResult(null);
                }}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  inputMode === 'manual'
                    ? 'bg-slate-900 text-slate-200 border border-slate-800/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Nhập thủ công
              </button>
              <button
                type="button"
                onClick={() => setInputMode('ai')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  inputMode === 'ai'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Nhập bằng AI ⚡
              </button>
            </div>
          )}

          {inputMode === 'ai' && !editingId ? (
            <div className="space-y-4 animate-slide-up">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mô tả giao dịch tự nhiên</label>
                <textarea
                  rows={3}
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ví dụ: hôm nay chạy shopeefood nhận được 100k tiền mặt được khách bo 5k"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-medium resize-none scrollbar-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAiParse}
                disabled={isParsing || !aiInput.trim()}
                className="w-full py-2.5 rounded-xl bg-purple-650 hover:bg-purple-550 text-white font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/10 border border-purple-500/20 text-xs btn-click-effect"
              >
                {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />}
                <span>Phân tích bằng AI</span>
              </button>

              <div className="text-center">
                {geminiKey ? (
                  <span className="text-[9px] text-purple-400 bg-purple-500/5 border border-purple-500/10 px-2 py-1 rounded font-bold uppercase tracking-wider">
                    ⚡ Đang sử dụng Gemini AI (Thông minh)
                  </span>
                ) : (
                  <span className="text-[9px] text-amber-500 bg-amber-500/5 border border-amber-500/10 px-2 py-1 rounded font-bold uppercase tracking-wider" title="Cấu hình khóa API trong cài đặt để sử dụng AI thông minh hơn">
                    ⚡ Bộ phân tích cục bộ (Offline)
                  </span>
                )}
              </div>

              {parsedResult && (
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 space-y-3.5 animate-slide-up">
                  <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest border-b border-slate-900 pb-1.5 font-heading flex items-center justify-between">
                    <span>Kết quả phân tích</span>
                    <span className="text-[8px] bg-slate-900 text-slate-500 border border-slate-850 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                      {parsedResult.isLocal ? 'Offline' : 'Gemini AI'}
                    </span>
                  </h4>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-semibold">Loại</span>
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        parsedResult.type === 'income' 
                          ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-550/20' 
                          : 'bg-rose-500/10 text-rose-455 border border-rose-550/20'
                      }`}>
                        {parsedResult.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                        {parsedResult.type === 'income' ? 'Tiền vào' : 'Tiền ra'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-semibold">Số tiền</span>
                      <span className="font-extrabold font-heading text-purple-355">{formatVND(parsedResult.amount)}</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-semibold">Ví / Tài khoản</span>
                      <span className="font-bold text-slate-350">
                        {wallets.find(w => w.id === parsedResult.walletId)?.name || 'Mặc định'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-semibold">Danh mục</span>
                      <span className="font-bold text-slate-350">{parsedResult.category}</span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-[9px] text-slate-500 block uppercase font-semibold">Ghi chú</span>
                      <span className="font-semibold text-slate-300 break-words">{parsedResult.note || '(Trống)'}</span>
                    </div>

                    <div className="col-span-2 flex justify-between items-center bg-slate-900/40 px-2.5 py-1.5 rounded-lg border border-slate-900">
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase font-semibold">Ngày</span>
                        <span className="font-bold text-slate-400">{new Date(parsedResult.date).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {parsedResult.excludeFromStats && (
                        <span className="text-[9px] bg-slate-950 text-slate-500 border border-slate-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          Không thống kê
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-slate-900">
                    <button
                      type="button"
                      onClick={handleFillManualForm}
                      className="flex-1 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-slate-200 text-xs font-semibold transition cursor-pointer btn-click-effect"
                    >
                      Sửa thủ công
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveParsedResult}
                      className="flex-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-550 text-white font-bold transition cursor-pointer text-xs btn-click-effect shadow-md border border-purple-500/20"
                    >
                      Ghi nhận ngay
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
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
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-lg font-bold font-heading text-purple-400"
                  placeholder="Ví dụ: 50,005"
                />
              </div>

              {/* Wallet Selection */}
              {wallets && wallets.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ví / Tài khoản</label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id} className="bg-slate-900 text-slate-350">
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Danh mục</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                >
                  {type === 'expense' 
                    ? finalCategories.expense.map(c => <option key={c} value={c} className="bg-slate-900 text-slate-350">{c}</option>)
                    : finalCategories.income.map(c => <option key={c} value={c} className="bg-slate-900 text-slate-350">{c}</option>)
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

              {/* Exclude From Stats Checkbox */}
              <div className="flex flex-col gap-1 bg-slate-950/40 p-3 rounded-xl border border-slate-900/60">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="excludeFromStats"
                    checked={excludeFromStats}
                    onChange={(e) => setExcludeFromStats(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-650 border-slate-800 bg-slate-950 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="excludeFromStats" className="text-xs font-bold text-slate-200 cursor-pointer select-none">
                    Không thống kê (Loại trừ)
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed ml-6">
                  Tiền trong ví vẫn được cộng/trừ bình thường, nhưng giao dịch sẽ không được tính vào tổng thu/chi và các biểu đồ phân tích.
                </p>
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
          )}
        </div>
      </div>
    )}

      {/* RIGHT COLUMN: Transaction History and Filters */}
      <div className={userRole === 'user' ? "lg:col-span-3 space-y-6" : "lg:col-span-2 space-y-6"}>
        
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
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-900/60 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              
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

              {/* Wallet Filter */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider mb-1">Ví / Tài khoản</label>
                <select
                  value={filterWallet}
                  onChange={(e) => setFilterWallet(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg glass-input text-[11px]"
                >
                  <option value="all" className="bg-slate-900">Tất cả</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id} className="bg-slate-900">{w.name}</option>
                  ))}
                </select>
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
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Ngày</th>
                    <th className="py-3 px-4">Danh mục / Ghi chú</th>
                    <th className="py-3 px-4 text-right">Số tiền</th>
                    {userRole !== 'user' && <th className="py-3 px-4 text-center">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50 text-xs">
                  {expenses.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-900/30 transition duration-150">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-350">
                        {new Date(tx.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 max-w-[150px] truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-200 block">{tx.category}</span>
                          {tx.excludeFromStats && (
                            <span className="text-[8px] bg-slate-900 text-slate-500 border border-slate-800 px-1 py-0.2 rounded font-bold uppercase tracking-wider scale-90">
                              Loại trừ
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 text-[10px] block truncate" title={tx.note || ''}>
                          {tx.note ? `${tx.note} | ` : ''}Ví: {wallets.find(w => w.id === tx.walletId)?.name || 'Mặc định'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-rose-450 font-heading">
                        -{formatVND(tx.amount)}
                      </td>
                      {userRole !== 'user' && (
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
                      )}
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

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-slate-900/50 flex-1">
              {expenses.map(tx => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-900/20 transition duration-150 gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-455 flex-shrink-0 border border-rose-550/20">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-200 text-sm truncate" title={tx.category}>{tx.category}</span>
                        {tx.excludeFromStats && (
                          <span className="text-[8px] bg-slate-900 text-slate-550 border border-slate-800 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                            Loại trừ
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block font-medium mt-0.5 truncate" title={`${tx.note ? tx.note + ' | ' : ''}Ví: ${wallets.find(w => w.id === tx.walletId)?.name || 'Mặc định'}`}>
                        {tx.note ? `${tx.note} | ` : ''}Ví: {wallets.find(w => w.id === tx.walletId)?.name || 'Mặc định'}
                      </span>
                      <span className="text-[9px] text-slate-650 block font-semibold mt-0.5">
                        {new Date(tx.date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="font-bold font-heading text-sm text-rose-455">
                      -{formatVND(tx.amount)}
                    </span>
                    {userRole !== 'user' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(tx)}
                          className="p-1 rounded bg-slate-900/60 border border-slate-850 text-slate-405 hover:text-indigo-400 hover:bg-slate-800 transition cursor-pointer"
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
                          className="p-1 rounded bg-slate-900/60 border border-slate-850 text-slate-405 hover:text-red-405 hover:bg-slate-800 transition cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-12">Không có giao dịch chi tiêu thỏa mãn.</p>
              )}
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

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Ngày</th>
                    <th className="py-3 px-4">Danh mục / Ghi chú</th>
                    <th className="py-3 px-4 text-right">Số tiền</th>
                    {userRole !== 'user' && <th className="py-3 px-4 text-center">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50 text-xs">
                  {incomes.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-900/30 transition duration-150">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-350">
                        {new Date(tx.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 max-w-[150px] truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-200 block">{tx.category}</span>
                          {tx.excludeFromStats && (
                            <span className="text-[8px] bg-slate-950 text-slate-500 border border-slate-900 px-1 py-0.2 rounded font-bold uppercase tracking-wider scale-90">
                              Loại trừ
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 text-[10px] block truncate" title={tx.note || ''}>
                          {tx.note ? `${tx.note} | ` : ''}Ví: {wallets.find(w => w.id === tx.walletId)?.name || 'Mặc định'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-emerald-450 font-heading">
                        +{formatVND(tx.amount)}
                      </td>
                      {userRole !== 'user' && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => startEdit(tx)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-455 hover:bg-slate-800 transition cursor-pointer"
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
                      )}
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

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-slate-900/50 flex-1">
              {incomes.map(tx => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-900/20 transition duration-150 gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-405 flex-shrink-0 border border-emerald-555/20">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-200 text-sm truncate" title={tx.category}>{tx.category}</span>
                        {tx.excludeFromStats && (
                          <span className="text-[8px] bg-slate-950 text-slate-555 border border-slate-900 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                            Loại trừ
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block font-medium mt-0.5 truncate" title={`${tx.note ? tx.note + ' | ' : ''}Ví: ${wallets.find(w => w.id === tx.walletId)?.name || 'Mặc định'}`}>
                        {tx.note ? `${tx.note} | ` : ''}Ví: {wallets.find(w => w.id === tx.walletId)?.name || 'Mặc định'}
                      </span>
                      <span className="text-[9px] text-slate-650 block font-semibold mt-0.5">
                        {new Date(tx.date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="font-bold font-heading text-sm text-emerald-455">
                      +{formatVND(tx.amount)}
                    </span>
                    {userRole !== 'user' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(tx)}
                          className="p-1 rounded bg-slate-900/60 border border-slate-850 text-slate-455 hover:text-indigo-400 hover:bg-slate-800 transition cursor-pointer"
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
                          className="p-1 rounded bg-slate-900/60 border border-slate-850 text-slate-455 hover:text-red-405 hover:bg-slate-800 transition cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {incomes.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-12">Không có giao dịch thu nhập thỏa mãn.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
