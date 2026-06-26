import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Trash2, Edit3, X, Check,
  ArrowUpRight, ArrowDownLeft, Calendar as CalendarIcon, Tag, Wallet, RefreshCw, Sparkles,
  Mic, MicOff
} from 'lucide-react';
import { formatVND, formatNumberInput, getCategories } from '../utils/storage';
import { parseTransactionWithAI, getLocalDateString } from '../utils/aiParser';

export default function DailyTransactions({ 
  transactions, 
  categories, 
  wallets = [], 
  geminiKey,
  onAddTransaction, 
  onDeleteTransaction, 
  onUpdateTransaction,
  userRole = 'user'
}) {
  const finalCategories = categories || getCategories();
  
  // Date states
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(today));

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  
  // Form fields
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(finalCategories.expense[0] || 'Khác');
  const [note, setNote] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [excludeFromStats, setExcludeFromStats] = useState(false);

  // AI Parsing State
  const [inputMode, setInputMode] = useState('manual'); // 'manual' or 'ai'
  const [aiInput, setAiInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);

  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng dùng Google Chrome, Edge hoặc Safari!");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (event) => {
      console.error(event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Bạn chưa cấp quyền truy cập Microphone cho trang web. Vui lòng kiểm tra cài đặt trình duyệt!");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAiInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

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
      // Force date to selectedDate for Daily Ledger
      result.date = selectedDate;
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
    setShowAddForm(false);
    alert('Đã ghi nhận giao dịch thành công!');
  };

  const handleFillManualForm = () => {
    if (!parsedResult) return;
    setType(parsedResult.type);
    setAmount(parsedResult.amount.toString());
    setCategory(parsedResult.category);
    setWalletId(parsedResult.walletId || (wallets.length > 0 ? wallets[0].id : ''));
    setExcludeFromStats(parsedResult.excludeFromStats);
    setNote(parsedResult.note);
    setInputMode('manual');
    setParsedResult(null);
  };

  // Sync default wallet and category on component/props updates
  useEffect(() => {
    if (wallets.length > 0 && !walletId) {
      setWalletId(wallets[0].id);
    }
  }, [wallets, walletId]);

  useEffect(() => {
    setCategory(type === 'income' ? (finalCategories.income[0] || 'Khác') : (finalCategories.expense[0] || 'Khác'));
  }, [type, finalCategories]);

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = () => {
    const day = new Date(currentYear, currentMonth, 1).getDay();
    // Monday first index mapping: Sun=6, Mon=0, Tue=1 ... Sat=5
    return day === 0 ? 6 : day - 1;
  };
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays = useMemo(() => {
    const days = [];
    const firstDay = firstDayIndex();
    
    // Previous month padding days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, isCurrentMonth: false, dateStr });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, isCurrentMonth: true, dateStr });
    }

    // Next month padding days to fill 6 rows (42 days)
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, isCurrentMonth: false, dateStr });
    }

    return days;
  }, [currentYear, currentMonth, daysInMonth]);

  // Map transaction activity per day
  const transactionActivity = useMemo(() => {
    const activity = {};
    transactions.forEach(tx => {
      if (!activity[tx.date]) {
        activity[tx.date] = { income: false, expense: false };
      }
      if (tx.type === 'income') {
        activity[tx.date].income = true;
      } else {
        activity[tx.date].expense = true;
      }
    });
    return activity;
  }, [transactions]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Get selected day transactions
  const selectedDayTransactions = useMemo(() => {
    return transactions.filter(t => t.date === selectedDate);
  }, [transactions, selectedDate]);

  // Calculate day totals
  const dayStats = useMemo(() => {
    const income = selectedDayTransactions
      .filter(t => t.type === 'income' && !t.excludeFromStats)
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = selectedDayTransactions
      .filter(t => t.type === 'expense' && !t.excludeFromStats)
      .reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;
    return { income, expense, net };
  }, [selectedDayTransactions]);

  // Calculate selected month stats
  const monthlyStats = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthlyTxs = transactions.filter(t => t.date.startsWith(monthPrefix) && !t.excludeFromStats);
    const income = monthlyTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthlyTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;
    return { income, expense, net };
  }, [transactions, currentYear, currentMonth]);

  // Format date helper
  const formatFriendlyDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Form submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    const txData = {
      type,
      amount: Number(amount),
      category,
      date: selectedDate,
      note: note.trim(),
      walletId: walletId || (wallets.length > 0 ? wallets[0].id : ''),
      excludeFromStats
    };

    if (editingTx) {
      onUpdateTransaction({
        ...txData,
        id: editingTx.id
      });
      setEditingTx(null);
    } else {
      onAddTransaction(txData);
    }

    // Reset Form fields
    setAmount('');
    setNote('');
    setExcludeFromStats(false);
    setShowAddForm(false);
  };

  const startEditing = (tx) => {
    setEditingTx(tx);
    setType(tx.type);
    setAmount(tx.amount.toString());
    setCategory(tx.category);
    setNote(tx.note);
    setWalletId(tx.walletId || (wallets.length > 0 ? wallets[0].id : ''));
    setExcludeFromStats(tx.excludeFromStats || false);
    setShowAddForm(true);
  };

  const cancelForm = () => {
    setEditingTx(null);
    setAmount('');
    setNote('');
    setExcludeFromStats(false);
    setShowAddForm(false);
  };

  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const monthNames = [
    'Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu',
    'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-slide-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-100 font-heading">Thu Chi Hàng Ngày</h2>
        <p className="text-xs text-slate-400">Chọn một ngày trên lịch để xem và quản lý chi tiết dòng tiền trong ngày đó.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: Calendar grid */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-900 shadow-xl bg-slate-950/20">
            {/* Month selector header */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-3">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer btn-click-effect"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="font-bold text-slate-200 text-sm font-heading">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer btn-click-effect"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days of week headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {daysOfWeek.map((day, idx) => (
                <span 
                  key={day} 
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    idx === 6 ? 'text-rose-455' : 'text-slate-500'
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar grid cells */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((cell, index) => {
                const isSelected = cell.dateStr === selectedDate;
                const activity = transactionActivity[cell.dateStr];
                const isToday = cell.dateStr === getLocalDateString(today);

                return (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedDate(cell.dateStr);
                      cancelForm();
                    }}
                    className={`aspect-square p-1 rounded-xl flex flex-col items-center justify-between relative cursor-pointer transition border duration-200 ${
                      cell.isCurrentMonth 
                        ? isSelected 
                          ? 'bg-purple-650/20 border-purple-500 text-purple-400 font-bold shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                          : isToday
                            ? 'bg-slate-900/60 border-slate-750 text-white font-extrabold shadow-inner'
                            : 'bg-slate-950/30 border-slate-900/60 hover:border-slate-800 text-slate-350'
                        : isSelected
                          ? 'bg-purple-650/10 border-purple-600/40 text-purple-400 font-semibold'
                          : 'bg-transparent border-transparent text-slate-650 hover:text-slate-500'
                    }`}
                  >
                    <span className="text-xs leading-none mt-1">{cell.day}</span>
                    
                    {/* Activity dot indicators */}
                    <div className="flex gap-0.5 justify-center w-full mb-0.5 h-1">
                      {activity?.income && (
                        <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      )}
                      {activity?.expense && (
                        <span className="w-1 h-1 rounded-full bg-rose-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monthly Overview Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-900/80 shadow-xl bg-slate-950/20 space-y-3 animate-slide-up">
            <div className="border-b border-slate-900 pb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-heading">Tổng quan cả tháng</span>
              <h3 className="font-bold text-slate-200 text-sm font-heading">
                {monthNames[currentMonth]} {currentYear}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex justify-between items-center">
                <span className="text-[10px] text-slate-550 font-semibold uppercase">Tổng thu</span>
                <span className="text-xs font-bold text-emerald-450 font-heading">+{formatVND(monthlyStats.income)}</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/5 border border-rose-500/10 flex justify-between items-center">
                <span className="text-[10px] text-slate-550 font-semibold uppercase">Tổng chi</span>
                <span className="text-xs font-bold text-rose-455 font-heading">-{formatVND(monthlyStats.expense)}</span>
              </div>
              <div className={`px-3.5 py-1.5 rounded-xl border flex justify-between items-center ${
                monthlyStats.net > 0 
                  ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-450' 
                  : monthlyStats.net < 0 
                    ? 'bg-rose-500/5 border-rose-500/10 text-rose-455' 
                    : 'bg-slate-900/40 border-slate-800 text-slate-400'
              }`}>
                <span className="text-[10px] text-slate-550 font-semibold uppercase">
                  {monthlyStats.net > 0 ? 'Lời (Thặng dư)' : monthlyStats.net < 0 ? 'Lỗ (Thâm hụt)' : 'Hòa vốn'}
                </span>
                <span className="text-xs font-bold font-heading">
                  {monthlyStats.net > 0 ? '+' : ''}{formatVND(monthlyStats.net)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Transactions of Selected Day */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Day details & totals header */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-900 shadow-xl bg-slate-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-heading">Chi tiết ngày</span>
              <h3 className="text-lg font-black text-slate-200 font-heading">
                Ngày {formatFriendlyDate(selectedDate)}
              </h3>
            </div>

            {/* Selected day totals and actions */}
            <div className="flex flex-col md:flex-row md:items-stretch gap-2 w-full md:w-auto">
              <div className="grid grid-cols-3 gap-2 flex-1 md:flex-initial">
                <div className="px-2 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col justify-center text-center">
                  <span className="text-[9px] text-slate-500 uppercase font-semibold">Thu nhập</span>
                  <span className="text-xs font-bold text-emerald-450 font-heading block truncate">+{formatVND(dayStats.income)}</span>
                </div>
                <div className="px-2 py-1.5 rounded-xl bg-rose-500/5 border border-rose-500/10 flex flex-col justify-center text-center">
                  <span className="text-[9px] text-slate-500 uppercase font-semibold">Chi tiêu</span>
                  <span className="text-xs font-bold text-rose-455 font-heading block truncate">-{formatVND(dayStats.expense)}</span>
                </div>
                <div className={`px-2 py-1.5 rounded-xl border flex flex-col justify-center text-center ${
                  dayStats.net > 0 
                    ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-450' 
                    : dayStats.net < 0 
                      ? 'bg-rose-500/5 border-rose-500/10 text-rose-455' 
                      : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}>
                  <span className="text-[9px] text-slate-500 uppercase font-semibold">
                    {dayStats.net > 0 ? 'Lời' : dayStats.net < 0 ? 'Lỗ' : 'Hòa vốn'}
                  </span>
                  <span className="text-xs font-bold font-heading block truncate">
                    {dayStats.net > 0 ? '+' : ''}{formatVND(dayStats.net)}
                  </span>
                </div>
              </div>
              
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 rounded-xl bg-purple-650 hover:bg-purple-550 text-white font-bold transition flex items-center justify-center gap-1 cursor-pointer btn-click-effect shadow-md shadow-purple-500/10 text-xs border border-purple-500/20 w-full md:w-auto mt-1 md:mt-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm giao dịch</span>
                </button>
              )}
            </div>
          </div>

          {/* Form Quick Add / Edit Transaction */}
          {showAddForm && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 shadow-xl bg-slate-950/40 animate-slide-up space-y-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                {editingTx ? <Edit3 className="w-4 h-4 text-indigo-400" /> : <Plus className="w-4 h-4 text-purple-400" />}
                {editingTx ? `Sửa giao dịch` : `Thêm giao dịch mới cho ngày ${formatFriendlyDate(selectedDate)}`}
              </h4>

              {/* Mode Switcher */}
              {!editingTx && (
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
                        ? 'bg-purple-650/20 text-purple-400 border border-purple-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Nhập bằng AI ⚡
                  </button>
                </div>
              )}

              {inputMode === 'ai' && !editingTx ? (
                <div className="space-y-4 animate-slide-up">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Mô tả giao dịch tự nhiên</label>
                      {isListening && (
                        <span className="text-[10px] text-rose-455 font-bold animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                          Đang nghe...
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <textarea
                        rows={3}
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder="Ví dụ: chạy shopeefood nhận được 100k tiền mặt được khách bo 5k"
                        className="w-full px-3.5 py-2.5 pr-12 rounded-xl glass-input text-xs font-medium resize-none scrollbar-none"
                      />
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`absolute right-3 bottom-3 p-2 rounded-xl transition duration-200 cursor-pointer flex items-center justify-center ${
                          isListening
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.35)] animate-pulse'
                            : 'bg-slate-900/60 hover:bg-slate-800 text-purple-400 border border-slate-850 hover:text-purple-300'
                        }`}
                        title={isListening ? "Dừng ghi âm" : "Ghi âm giọng nói 🎙️"}
                      >
                        {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>
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
                          <span className="text-[9px] text-slate-550 block uppercase font-semibold">Loại</span>
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
                          <span className="text-[9px] text-slate-550 block uppercase font-semibold">Số tiền</span>
                          <span className="font-extrabold font-heading text-purple-355">{formatVND(parsedResult.amount)}</span>
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-550 block uppercase font-semibold">Ví / Tài khoản</span>
                          <span className="font-bold text-slate-300 font-heading">
                            {wallets.find(w => w.id === parsedResult.walletId)?.name || 'Mặc định'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-550 block uppercase font-semibold">Danh mục</span>
                          <span className="font-bold text-slate-350">{parsedResult.category}</span>
                        </div>

                        <div className="col-span-2">
                          <span className="text-[9px] text-slate-550 block uppercase font-semibold">Ghi chú</span>
                          <span className="font-semibold text-slate-300 break-words">{parsedResult.note || '(Trống)'}</span>
                        </div>

                        <div className="col-span-2 flex justify-between items-center bg-slate-900/40 px-2.5 py-1.5 rounded-lg border border-slate-900">
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase font-semibold">Ngày ghi nhận</span>
                            <span className="font-bold text-slate-400">{formatFriendlyDate(parsedResult.date)}</span>
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

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={cancelForm}
                      className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-semibold transition cursor-pointer btn-click-effect"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Type selector */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider mb-1">Phân loại</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-900">
                        <button
                          type="button"
                          onClick={() => setType('expense')}
                          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 ${
                            type === 'expense'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" /> Tiền ra (Chi)
                        </button>
                        <button
                          type="button"
                          onClick={() => setType('income')}
                          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 ${
                            type === 'income'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" /> Tiền vào (Thu)
                        </button>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider mb-1">Số tiền (VND)</label>
                      <input
                        type="text"
                        required
                        value={formatNumberInput(amount)}
                        onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2 rounded-xl glass-input text-sm font-extrabold font-heading text-purple-400"
                        placeholder="Ví dụ: 100,000"
                      />
                    </div>

                    {/* Wallet */}
                    {wallets.length > 0 && (
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-455 uppercase tracking-wider mb-1">Ví / Tài khoản</label>
                        <select
                          value={walletId}
                          onChange={(e) => setWalletId(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-medium text-slate-350"
                        >
                          {wallets.map(w => (
                            <option key={w.id} value={w.id} className="bg-slate-900">{w.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Category */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-455 uppercase tracking-wider mb-1">Danh mục</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-medium text-slate-350"
                      >
                        {type === 'expense'
                          ? finalCategories.expense.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)
                          : finalCategories.income.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)
                        }
                      </select>
                    </div>

                    {/* Note */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-455 uppercase tracking-wider mb-1">Ghi chú</label>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-medium"
                        placeholder="Nuôi thú cưng, mua quần áo, uống cafe..."
                      />
                    </div>
                  </div>

                  {/* Exclude from stats option */}
                  <div className="flex flex-col gap-1 bg-slate-950/40 p-3 rounded-xl border border-slate-900/60">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="excludeFromStatsDaily"
                        checked={excludeFromStats}
                        onChange={(e) => setExcludeFromStats(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-650 border-slate-800 bg-slate-950 focus:ring-purple-500 cursor-pointer"
                      />
                      <label htmlFor="excludeFromStatsDaily" className="text-xs font-bold text-slate-200 cursor-pointer select-none">
                        Không thống kê (Loại trừ)
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed ml-6">
                      Tiền trong ví vẫn được cộng/trừ bình thường, nhưng giao dịch sẽ không được tính vào tổng thu/chi và các biểu đồ phân tích.
                    </p>
                  </div>

                  {/* Form buttons */}
                  <div className="flex justify-end gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={cancelForm}
                      className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-semibold transition cursor-pointer btn-click-effect"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-550 text-white font-bold transition cursor-pointer text-xs btn-click-effect shadow-md shadow-purple-500/10 border border-purple-500/20"
                    >
                      {editingTx ? 'Cập nhật' : 'Ghi nhận'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Transactions list of selected date */}
          <div className="glass-panel rounded-2xl shadow-xl overflow-hidden bg-slate-950/20">
            <div className="p-4 bg-slate-900/40 border-b border-slate-900 flex justify-between items-center">
              <h4 className="font-bold text-slate-300 text-xs font-heading">
                Danh sách giao dịch ({selectedDayTransactions.length})
              </h4>
            </div>

            <div className="divide-y divide-slate-900/50">
              {selectedDayTransactions.map(tx => (
                <div 
                  key={tx.id} 
                  className="p-4 flex items-center justify-between hover:bg-slate-900/20 transition duration-150 text-xs gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-lg border flex-shrink-0 ${
                      tx.type === 'income' 
                        ? 'bg-emerald-500/10 text-emerald-405 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-455 border-rose-500/20'
                    }`}>
                      {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-200 truncate" title={tx.category}>{tx.category}</span>
                        {tx.excludeFromStats && (
                          <span className="text-[8px] bg-slate-950 text-slate-500 border border-slate-900 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                            Loại trừ
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block font-medium mt-0.5 truncate" title={`${tx.note ? tx.note + ' | ' : ''}Ví: ${wallets.find(w => w.id === tx.walletId)?.name || 'Mặc định'}`}>
                        {tx.note ? `${tx.note} | ` : ''}Ví: {wallets.find(w => w.id === tx.walletId)?.name || 'Mặc định'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`font-bold font-heading text-sm ${
                      tx.type === 'income' ? 'text-emerald-455' : 'text-rose-455'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatVND(tx.amount)}
                    </span>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => startEditing(tx)}
                        className="p-1 rounded text-slate-500 hover:text-indigo-400 hover:bg-slate-900 transition cursor-pointer"
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
                        className="p-1 rounded text-slate-500 hover:text-red-405 hover:bg-slate-900 transition cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {selectedDayTransactions.length === 0 && (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <CalendarIcon className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                  <p className="text-xs font-semibold">Không có giao dịch nào được ghi nhận trong ngày này.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
