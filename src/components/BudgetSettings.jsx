import React, { useState } from 'react';
import { 
  Save, AlertTriangle, Info, ShieldCheck, Tag, RefreshCw, 
  KeyRound, Trash2, Plus, Calendar, Eye, EyeOff, Lock,
  Palette, Check
} from 'lucide-react';
import { formatVND, formatNumberInput, changeUserPassword } from '../utils/storage';

const themes = [
  { id: 'purple', name: 'Tím Huyền Ảo (Mặc định)', desc: 'Chủ đạo Cyber Neon Purple và Indigo quyến rũ.', primary: '#a855f7', secondary: '#6366f1' },
  { id: 'green', name: 'Xanh Lục Bảo', desc: 'Chủ đạo Emerald Green và Sky Blue dịu mát.', primary: '#10b981', secondary: '#0ea5e9' },
  { id: 'rose', name: 'Lửa Hồng', desc: 'Chủ đạo Rose Pink và Fuchsia cá tính, trẻ trung.', primary: '#f43f5e', secondary: '#d946ef' },
  { id: 'blue', name: 'Xanh Đại Dương', desc: 'Chủ đạo Deep Blue và Cyan hiện đại, tươi sáng.', primary: '#3b82f6', secondary: '#06b6d4' },
  { id: 'amber', name: 'Vàng Hổ Phách', desc: 'Chủ đạo Amber Gold và Orange ấm áp, năng động.', primary: '#f59e0b', secondary: '#f97316' }
];

export default function BudgetSettings({ 
  budget, 
  onSave, 
  categories, 
  onAddCategory, 
  onDeleteCategory,
  recurringList,
  onAddRecurring,
  onDeleteRecurring,
  activeUser,
  onClearUserData,
  geminiKey,
  onSaveApiKey,
  userRole = 'user',
  activeTheme = 'purple',
  onChangeTheme
}) {
  const [activeSubTab, setActiveSubTab] = useState('budget'); // 'budget', 'categories', 'recurring', 'security'
  
  // Budget Form State
  const [incomeTarget, setIncomeTarget] = useState(budget.monthlyIncomeTarget);
  const [expenseLimit, setExpenseLimit] = useState(budget.monthlyExpenseLimit);
  const [budgetMessage, setBudgetMessage] = useState(null);

  // Custom Category State
  const [newCatType, setNewCatType] = useState('expense');
  const [newCatName, setNewCatName] = useState('');
  const [catMessage, setCatMessage] = useState(null);

  // Recurring Transaction State
  const [recType, setRecType] = useState('expense');
  const [recAmount, setRecAmount] = useState('');
  const [recCategory, setRecCategory] = useState(categories ? (categories.expense[0] || 'Khác') : 'Khác');
  const [recNote, setRecNote] = useState('');
  const [recFrequency, setRecFrequency] = useState('monthly');
  const [recDayOfPeriod, setRecDayOfPeriod] = useState(1); // day of week or day of month

  // Security State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [secMessage, setSecMessage] = useState(null);

  // Gemini API Key State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyMessage, setApiKeyMessage] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  React.useEffect(() => {
    setApiKeyInput(geminiKey || '');
  }, [geminiKey]);

  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    onSaveApiKey(apiKeyInput.trim());
    setApiKeyMessage('Đã lưu khóa API Gemini thành công!');
    setTimeout(() => setApiKeyMessage(''), 3000);
  };

  const handleTestApiKey = async () => {
    const key = apiKeyInput.trim();
    if (!key) {
      setTestResult({ success: false, message: '⚠️ Vui lòng nhập khóa API trước khi kiểm tra!' });
      return;
    }
    setIsTestingKey(true);
    setTestResult(null);

    try {
      // 1. Fetch available models for this specific API key
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
      const listResponse = await fetch(listUrl);
      const listData = await listResponse.json();

      if (!listResponse.ok) {
        throw new Error(listData.error?.message || 'Không thể truy cập API Google Gemini. Vui lòng kiểm tra lại khóa.');
      }

      if (!listData.models || listData.models.length === 0) {
        throw new Error('Dự án Google Cloud của khóa này chưa kích hoạt hoặc không có mô hình khả dụng nào.');
      }

      const modelNames = listData.models.map(m => m.name.replace('models/', ''));
      // Prefer standard flash models, fallback to the first model in the list
      const testModel = modelNames.find(name => name.includes('flash')) || modelNames[0];

      // 2. Perform a test generation call using the selected model
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${key}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Kiểm tra' }] }]
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `Lỗi khi gọi mô hình ${testModel}`);
      }

      setTestResult({
        success: true,
        message: `✅ Kết nối thành công! Khóa hoạt động tốt với mô hình "${testModel}".`
      });
    } catch (err) {
      console.error(err);
      setTestResult({ success: false, message: `❌ Kết nối thất bại! Chi tiết: ${err.message}` });
    } finally {
      setIsTestingKey(false);
    }
  };

  // Handle Budget Save
  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    if (Number(incomeTarget) <= 0 || Number(expenseLimit) <= 0) {
      setBudgetMessage({ type: 'error', text: 'Số tiền cấu hình phải lớn hơn 0!' });
      return;
    }
    onSave({
      monthlyIncomeTarget: Number(incomeTarget),
      monthlyExpenseLimit: Number(expenseLimit)
    });
    setBudgetMessage({ type: 'success', text: 'Cài đặt ngân sách đã được lưu thành công!' });
    setTimeout(() => setBudgetMessage(null), 3000);
  };

  // Handle Category Add
  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    setCatMessage(null);
    if (!newCatName.trim()) return;
    
    const res = onAddCategory(newCatType, newCatName);
    if (res.success) {
      setCatMessage({ type: 'success', text: `Đã thêm danh mục "${newCatName.trim()}"` });
      setNewCatName('');
      setTimeout(() => setCatMessage(null), 3000);
    } else {
      setCatMessage({ type: 'error', text: res.error });
    }
  };

  // Handle Recurring Form Submit
  const handleRecurringSubmit = (e) => {
    e.preventDefault();
    if (!recAmount || Number(recAmount) <= 0) return;
    
    onAddRecurring({
      type: recType,
      amount: Number(recAmount),
      category: recCategory,
      note: recNote.trim() || 'Thanh toán định kỳ',
      frequency: recFrequency,
      dayOfPeriod: Number(recDayOfPeriod)
    });

    setRecAmount('');
    setRecNote('');
    alert('Đã thiết lập lịch giao dịch định kỳ thành công!');
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSecMessage(null);
    if (newPassword.length < 6) {
      setSecMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecMessage({ type: 'error', text: 'Mật khẩu xác nhận không trùng khớp!' });
      return;
    }

    const res = await changeUserPassword(activeUser, newPassword);
    if (res.success) {
      setSecMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSecMessage(null), 3500);
    } else {
      setSecMessage({ type: 'error', text: res.error });
    }
  };

  // Handle Account Reset
  const handleAccountReset = () => {
    if (confirm('CẢNH BÁO NGUY HIỂM: Bạn có chắc chắn muốn xóa toàn bộ dữ liệu giao dịch, quỹ tiết kiệm, lịch định kỳ của tài khoản này không? Thao tác này không thể khôi phục.')) {
      if (confirm('Vui lòng xác nhận lại một lần nữa. Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn.')) {
        onClearUserData();
      }
    }
  };

  const dailyLimit = Math.round(expenseLimit / 30);
  const safeSavingRatio = Math.round(((incomeTarget - expenseLimit) / incomeTarget) * 100);

  const subTabs = [
    { id: 'budget', label: 'Hạn mức ngân sách', icon: ShieldCheck },
    { id: 'categories', label: 'Danh mục chi tiêu', icon: Tag },
    { id: 'recurring', label: 'Giao dịch định kỳ', icon: RefreshCw },
    { id: 'security', label: 'Tài khoản & Bảo mật', icon: KeyRound },
    { id: 'theme', label: 'Màu sắc giao diện', icon: Palette }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-100 font-heading">Cài Đặt & Cấu Hình</h2>
        <p className="text-slate-400 mt-1">Cấu hình thông số tài chính, danh mục thu chi và bảo mật tài khoản.</p>
      </div>

      {/* Pill Tabs for Inner Settings Navigation */}
      <div className="flex flex-wrap gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-900/60 max-w-max">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                // Sync default category if category structure loads
                if (tab.id === 'recurring' && categories) {
                  setRecCategory(recType === 'income' ? categories.income[0] : categories.expense[0]);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isActive 
                  ? 'bg-purple-600/15 text-purple-400 border border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.15)] font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Main Section Column (Left/Center 2 Cols) */}
        <div className="lg:col-span-2">
          
          {/* TAB 1: BUDGET SETTINGS */}
          {activeSubTab === 'budget' && (
            <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-6">
              <h3 className="text-lg font-bold text-purple-400 border-b border-slate-900 pb-3 flex items-center gap-2 font-heading">
                <ShieldCheck className="w-5 h-5" /> Điều Chỉnh Ngân Sách Hàng Tháng
              </h3>
              <form onSubmit={handleBudgetSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mục tiêu thu nhập (VND)</label>
                  <div className="relative rounded-lg shadow-sm">
                    <input
                      type="text"
                      value={formatNumberInput(incomeTarget)}
                      onChange={(e) => setIncomeTarget(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 rounded-xl glass-input text-lg font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="Ví dụ: 15,000,000"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500 font-semibold">VND</div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Dự kiến thu nhập tối thiểu để kiểm soát kế hoạch dòng tiền.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Giới hạn chi tiêu (VND)</label>
                  <div className="relative rounded-lg shadow-sm">
                    <input
                      type="text"
                      value={formatNumberInput(expenseLimit)}
                      onChange={(e) => setExpenseLimit(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 rounded-xl glass-input text-lg font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="Ví dụ: 10,000,000"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500 font-semibold">VND</div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Hạn mức chi tiêu tối đa để bảo đảm không bị lạm chi âm tiền.</p>
                </div>

                {budgetMessage && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 border ${
                    budgetMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {budgetMessage.type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                    <p className="text-xs font-semibold">{budgetMessage.text}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-550 hover:to-indigo-600 text-white font-semibold transition cursor-pointer text-sm shadow-md flex items-center justify-center gap-2 border border-purple-500/20 shimmer-btn"
                >
                  <Save className="w-4 h-4" /> Lưu Cấu Hình Ngân Sách
                </button>
              </form>
            </div>
          )}
          {/* TAB 2: CUSTOM CATEGORIES */}
          {activeSubTab === 'categories' && categories && (
            <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-6">
              <h3 className="text-lg font-bold text-purple-400 border-b border-slate-900 pb-3 flex items-center gap-2 font-heading">
                <Tag className="w-5 h-5" /> Tùy Biến Danh Mục Chi Tiêu & Thu Nhập
              </h3>

              {/* Add category form */}
              <form onSubmit={handleAddCategorySubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-900/60">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-455 uppercase tracking-wider mb-1">Loại danh mục</label>
                  <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs font-medium"
                  >
                    <option value="expense" className="bg-slate-900">Chi tiêu (Tiền ra)</option>
                    <option value="income" className="bg-slate-900">Thu nhập (Tiền vào)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-455 uppercase tracking-wider mb-1">Tên danh mục mới</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs font-medium"
                    placeholder="Ví dụ: Nuôi thú cưng, Sách..."
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 px-4 rounded-lg bg-purple-650 hover:bg-purple-550 text-white font-semibold transition cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-4 h-4" /> Thêm danh mục
                  </button>
                </div>
              </form>

              {catMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold border ${
                  catMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {catMessage.text}
                </div>
              )}

              {/* Lists Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Expense List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider border-b border-slate-900 pb-2">Danh mục chi tiêu ({categories.expense.length})</h4>
                  <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-2">
                    {categories.expense.map(cat => (
                      <div key={cat} className="flex justify-between items-center bg-slate-900/30 border border-slate-900/50 p-2.5 rounded-xl hover:border-slate-800 transition duration-150 text-xs">
                        <span className="font-semibold text-slate-200">{cat}</span>
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa danh mục chi tiêu "${cat}" không?`)) {
                              onDeleteCategory('expense', cat);
                            }
                          }}
                          className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Income List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-900 pb-2">Danh mục thu nhập ({categories.income.length})</h4>
                  <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-2">
                    {categories.income.map(cat => (
                      <div key={cat} className="flex justify-between items-center bg-slate-900/30 border border-slate-900/50 p-2.5 rounded-xl hover:border-slate-800 transition duration-150 text-xs">
                        <span className="font-semibold text-slate-200">{cat}</span>
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa danh mục thu nhập "${cat}" không?`)) {
                              onDeleteCategory('income', cat);
                            }
                          }}
                          className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-850 transition cursor-pointer"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RECURRING TRANSACTIONS */}
          {activeSubTab === 'recurring' && categories && (
            <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-6">
              <h3 className="text-lg font-bold text-purple-400 border-b border-slate-900 pb-3 flex items-center gap-2 font-heading">
                <RefreshCw className="w-5 h-5" /> Tự Động Hóa Giao Dịch Định Kỳ
              </h3>

              {/* Form to add schedule */}
              <form onSubmit={handleRecurringSubmit} className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-900/60">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Thiết lập lịch chi tiêu/thu tiền mới</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Selector type */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-455 uppercase tracking-wider mb-1">Loại định kỳ</label>
                      <select
                        value={recType}
                        onChange={(e) => {
                          setRecType(e.target.value);
                          setRecCategory(e.target.value === 'income' ? categories.income[0] : categories.expense[0]);
                        }}
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs font-semibold"
                      >
                        <option value="expense" className="bg-slate-900">Chi định kỳ (Tiền ra)</option>
                        <option value="income" className="bg-slate-900">Thu định kỳ (Tiền vào)</option>
                      </select>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-455 uppercase tracking-wider mb-1">Số tiền (VND)</label>
                      <input
                        type="text"
                        required
                        value={formatNumberInput(recAmount)}
                        onChange={(e) => setRecAmount(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs font-semibold"
                        placeholder="100,000"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-455 uppercase tracking-wider mb-1">Danh mục</label>
                      <select
                        value={recCategory}
                        onChange={(e) => setRecCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs font-semibold"
                      >
                        {recType === 'expense'
                          ? categories.expense.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)
                          : categories.income.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)
                        }
                      </select>
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-455 uppercase tracking-wider mb-1">Tần suất</label>
                      <select
                        value={recFrequency}
                        onChange={(e) => setRecFrequency(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs font-semibold"
                      >
                        <option value="daily" className="bg-slate-900">Hàng ngày</option>
                        <option value="weekly" className="bg-slate-900">Hàng tuần</option>
                        <option value="monthly" className="bg-slate-900">Hàng tháng</option>
                      </select>
                    </div>

                    {/* Day picker depends on frequency */}
                    {recFrequency !== 'daily' && (
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-455 uppercase tracking-wider mb-1">
                          {recFrequency === 'weekly' ? 'Chọn thứ' : 'Chọn ngày trong tháng (1-31)'}
                        </label>
                        {recFrequency === 'weekly' ? (
                          <select
                            value={recDayOfPeriod}
                            onChange={(e) => setRecDayOfPeriod(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg glass-input text-xs font-semibold"
                          >
                            <option value={1} className="bg-slate-900">Thứ Hai</option>
                            <option value={2} className="bg-slate-900">Thứ Ba</option>
                            <option value={3} className="bg-slate-900">Thứ Tư</option>
                            <option value={4} className="bg-slate-900">Thứ Năm</option>
                            <option value={5} className="bg-slate-900">Thứ Sáu</option>
                            <option value={6} className="bg-slate-900">Thứ Bảy</option>
                            <option value={0} className="bg-slate-900">Chủ Nhật</option>
                          </select>
                        ) : (
                          <input
                            type="number"
                            min={1}
                            max={31}
                            required
                            value={recDayOfPeriod}
                            onChange={(e) => setRecDayOfPeriod(Math.max(1, Math.min(31, Number(e.target.value))))}
                            className="w-full px-3 py-2 rounded-lg glass-input text-xs font-semibold"
                          />
                        )}
                      </div>
                    )}

                    {/* Note */}
                    <div className={recFrequency === 'daily' ? 'lg:col-span-2' : ''}>
                      <label className="block text-[10px] font-semibold text-slate-455 uppercase tracking-wider mb-1">Ghi chú lịch</label>
                      <input
                        type="text"
                        value={recNote}
                        onChange={(e) => setRecNote(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs font-medium"
                        placeholder="Ví dụ: Đóng tiền mạng FPT, Đóng tiền nhà..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="py-2.5 px-6 rounded-xl bg-purple-650 hover:bg-purple-550 text-white font-semibold transition cursor-pointer text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/10 border border-purple-500/20"
                    >
                      <Plus className="w-4 h-4" /> Kích Hoạt Định Kỳ
                    </button>
                  </div>
                </form>

              {/* Show active lists */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-900 pb-2">Danh sách lịch đang hoạt động ({recurringList.length})</h4>
                <div className="divide-y divide-slate-900/50 space-y-1">
                  {recurringList.map(item => {
                    const frequencyLabels = {
                      daily: 'Hàng ngày',
                      weekly: `Hàng tuần (Thứ ${item.dayOfPeriod === 0 ? 'Chủ Nhật' : item.dayOfPeriod + 1})`,
                      monthly: `Hàng tháng (Ngày ${item.dayOfPeriod})`
                    };
                    return (
                      <div key={item.id} className="py-3 flex justify-between items-center hover:bg-slate-900/10 px-2 rounded-xl transition duration-150 text-xs">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg border ${
                            item.type === 'expense' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            <RefreshCw className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-200 block">{item.note}</span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                              <span>Danh mục: {item.category}</span>
                              <span className="text-slate-700">|</span>
                              <span className="text-purple-400">{frequencyLabels[item.frequency] || item.frequency}</span>
                              <span className="text-slate-700">|</span>
                              <span className="text-slate-500">Chạy cuối: {item.lastProcessedDate}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`font-bold font-heading text-sm ${item.type === 'expense' ? 'text-rose-450' : 'text-emerald-450'}`}>
                            {item.type === 'expense' ? '-' : '+'}{formatVND(item.amount)}
                          </span>
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có muốn hủy lịch định kỳ "${item.note}" không?`)) {
                                onDeleteRecurring(item.id);
                              }
                            }}
                            className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-800 transition"
                            title="Xóa lịch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {recurringList.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-12">Không có giao dịch định kỳ tự động nào được cài đặt.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT SECURITY */}
          {activeSubTab === 'security' && (
            <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-6">
              <h3 className="text-lg font-bold text-purple-400 border-b border-slate-900 pb-3 flex items-center gap-2 font-heading">
                <KeyRound className="w-5 h-5" /> Bảo Mật Tài Khoản Của Bạn
              </h3>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900/60 flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tài khoản của bạn được bảo mật an toàn hoàn toàn offline trên trình duyệt của máy tính này. Chúng tôi khuyến nghị bạn nên cấu hình mật khẩu riêng tư để bảo vệ dữ liệu.
                </p>
              </div>

              {/* Gemini API Key configuration */}
              <form onSubmit={handleApiKeySubmit} className="space-y-4 max-w-md border-b border-slate-900 pb-6 mb-6">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                  <Lock className="w-4 h-4 text-purple-400" /> Tích hợp Trợ lý AI (Gemini API Key)
                </h4>
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider mb-1">Khóa API Gemini</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-mono font-medium"
                      placeholder="Nhập AIzaSy... từ Google AI Studio"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-purple-400 p-1"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Khóa API này sẽ giúp kích hoạt trang **Trợ lý AI**. Bạn có thể lấy khóa miễn phí tại{' '}
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 underline hover:text-purple-300 font-semibold"
                    >
                      Google AI Studio
                    </a>.
                  </p>
                </div>

                {apiKeyMessage && (
                  <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {apiKeyMessage}
                  </div>
                )}

                {testResult && (
                  <div className={`p-3 rounded-xl text-xs font-semibold border ${
                    testResult.success 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {testResult.message}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-purple-650 hover:bg-purple-550 text-white font-semibold transition cursor-pointer text-xs btn-click-effect shimmer-btn"
                  >
                    Lưu Khóa API Gemini
                  </button>
                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={isTestingKey}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 hover:border-slate-700 font-semibold transition cursor-pointer text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {isTestingKey ? 'Đang thử...' : 'Thử kết nối'}
                  </button>
                </div>
              </form>

              {/* Password change form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Đổi mật khẩu tài khoản</h4>
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider mb-1">Mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-medium"
                      placeholder="Tối thiểu 6 ký tự..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-purple-400 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider mb-1">Xác nhận mật khẩu mới</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-medium"
                    placeholder="Nhập lại mật khẩu mới..."
                  />
                </div>

                {secMessage && (
                  <div className={`p-3 rounded-xl text-xs font-semibold border ${
                    secMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {secMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-purple-650 hover:bg-purple-650 text-white font-semibold transition cursor-pointer text-xs"
                >
                  Xác Nhận Đổi Mật Khẩu
                </button>
              </form>

              {/* Danger Zone */}
              {userRole !== 'user' && (
                <div className="border-t border-red-500/15 pt-6 space-y-4">
                  <h4 className="text-xs font-bold text-red-455 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Danger Zone (Vùng nguy hiểm)
                  </h4>
                  <p className="text-[11px] text-slate-500">Các thao tác dưới đây sẽ ảnh hưởng trực tiếp đến dữ liệu và không thể đảo ngược lại.</p>
                  <button
                    onClick={handleAccountReset}
                    className="px-5 py-2.5 rounded-xl border border-red-500/20 bg-red-550/5 text-red-450 hover:bg-red-500/10 text-xs font-bold transition cursor-pointer flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Xóa sạch dữ liệu tài khoản
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: THEME SETTINGS */}
          {activeSubTab === 'theme' && (
            <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-6">
              <h3 className="text-lg font-bold text-purple-400 border-b border-slate-900 pb-3 flex items-center gap-2 font-heading">
                <Palette className="w-5 h-5" /> Tùy Biến Màu Sắc Giao Diện
              </h3>
              <p className="text-xs text-slate-400">Chọn tông màu chủ đạo yêu thích của bạn cho toàn bộ website FinTrack.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onChangeTheme(t.id)}
                    className={`p-4 rounded-2xl border transition-all duration-300 text-left relative flex items-center gap-3.5 group cursor-pointer ${
                      activeTheme === t.id
                        ? 'bg-purple-650/15 border-purple-555/40 shadow-lg shadow-purple-500/5'
                        : 'bg-slate-950/45 border-slate-900 hover:border-slate-800'
                    }`}
                  >
                    {/* Color dots preview */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      <span className="w-4.5 h-4.5 rounded-full shadow-inner" style={{ backgroundColor: t.primary }}></span>
                      <span className="w-4.5 h-4.5 rounded-full shadow-inner" style={{ backgroundColor: t.secondary }}></span>
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-200 text-xs block group-hover:text-purple-400 transition">{t.name}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">{t.desc}</span>
                    </div>
                    {activeTheme === t.id && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Info Sidebar Column (1 Col) */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-md font-bold text-slate-200 flex items-center gap-2 font-heading">
              <Info className="w-5 h-5 text-indigo-400" /> Cây Phân Tích Kế Hoạch
            </h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Giới hạn tiêu dùng/ngày</span>
                <span className="text-xl font-bold text-white font-heading">{formatVND(dailyLimit)}</span>
              </div>
              
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Tỷ lệ tích lũy của bạn</span>
                <span className={`text-xl font-bold font-heading ${safeSavingRatio >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {safeSavingRatio > 0 ? `${safeSavingRatio}%` : 'Không xác định'}
                </span>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  {safeSavingRatio >= 20 
                    ? 'Bạn đang giữ cấu hình tích lũy tốt (≥ 20% thu nhập).' 
                    : 'Tỷ lệ tích lũy đề nghị tối thiểu là 20% để bảo đảm an toàn tài chính.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20 p-5 rounded-2xl shadow-xl text-xs space-y-2.5">
            <h4 className="text-sm font-bold text-purple-200 font-heading">Quy tắc Phân Bổ 50/30/20</h4>
            <p className="text-slate-350 leading-relaxed">
              Từ mức thu nhập mục tiêu hiện tại là <strong>{formatVND(incomeTarget)}</strong>, quy tắc 50/30/20 khuyên bạn phân bổ:
            </p>
            <ul className="text-slate-300 space-y-2 pl-4 list-disc font-medium">
              <li><strong>Thiết yếu (50%):</strong> {formatVND(incomeTarget * 0.5)}</li>
              <li><strong>Sở thích (30%):</strong> {formatVND(incomeTarget * 0.3)}</li>
              <li><strong>Tiết kiệm (20%):</strong> {formatVND(incomeTarget * 0.2)}</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
