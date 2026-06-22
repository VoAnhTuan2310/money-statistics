import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  PiggyBank, 
  Settings, 
  Lightbulb, 
  Lock, 
  Download, 
  Upload, 
  Menu, 
  X,
  Wallet,
  User,
  LogOut,
  Sparkles
} from 'lucide-react';
import { 
  getTransactions, 
  addTransaction, 
  deleteTransaction, 
  updateTransaction, 
  getBudget, 
  saveBudget, 
  getSavingsPots, 
  addSavingsPot, 
  deleteSavingsPot, 
  updateSavingsPot, 
  exportData, 
  importData, 
  getActiveUser,
  logoutUser,
  getUserCategories,
  addUserCategory,
  deleteUserCategory,
  getRecurringTransactions,
  addRecurringTransaction,
  deleteRecurringTransaction,
  processRecurringTransactions,
  clearUserData,
  getGeminiApiKey,
  saveGeminiApiKey
} from './utils/storage';

import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Savings from './components/Savings';
import BudgetSettings from './components/BudgetSettings';
import FinancialTips from './components/FinancialTips';
import AiAssistant from './components/AiAssistant';
import Login from './components/Login';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState({
    monthlyIncomeTarget: 15000000,
    monthlyExpenseLimit: 10000000
  });
  const [savingsPots, setSavingsPots] = useState([]);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [recurringList, setRecurringList] = useState([]);
  const [geminiKey, setGeminiKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUser, setActiveUser] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stars, setStars] = useState([]);

  // Load state on mount
  useEffect(() => {
    const username = getActiveUser();
    if (username) {
      setIsAuthenticated(true);
      setActiveUser(username);
      
      setTransactions(getTransactions());
      setBudget(getBudget());
      setSavingsPots(getSavingsPots());
      setCategories(getUserCategories());
      setRecurringList(getRecurringTransactions());
      setGeminiKey(getGeminiApiKey());

      // Auto-process recurring transactions on load
      setTimeout(() => {
        const result = processRecurringTransactions(username);
        if (result.success && result.addedCount > 0) {
          alert(`Hệ thống AnhTuan: Đã tự động ghi nhận ${result.addedCount} giao dịch định kỳ đến hạn của bạn!`);
          setTransactions(getTransactions());
          setRecurringList(getRecurringTransactions());
        }
      }, 600);
    } else {
      setIsAuthenticated(false);
    }

    // Generate random twinkling stars across the main app background
    const generated = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 3 + 3}s`,
    }));
    setStars(generated);
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    const username = getActiveUser();
    setIsAuthenticated(true);
    setActiveUser(username);
    
    setTransactions(getTransactions());
    setBudget(getBudget());
    setSavingsPots(getSavingsPots());
    setCategories(getUserCategories());
    setRecurringList(getRecurringTransactions());
    setGeminiKey(getGeminiApiKey());

    // Auto-process recurring transactions immediately after login
    setTimeout(() => {
      const result = processRecurringTransactions(username);
      if (result.success && result.addedCount > 0) {
        alert(`Hệ thống AnhTuan: Đã tự động ghi nhận ${result.addedCount} giao dịch định kỳ đến hạn của bạn!`);
        setTransactions(getTransactions());
        setRecurringList(getRecurringTransactions());
      }
    }, 600);
  };

  const handleAddTransaction = (tx) => {
    addTransaction(tx);
    setTransactions(getTransactions());
  };

  const handleDeleteTransaction = (id) => {
    deleteTransaction(id);
    setTransactions(getTransactions());
  };

  const handleUpdateTransaction = (tx) => {
    updateTransaction(tx);
    setTransactions(getTransactions());
  };

  const handleSaveBudget = (newBudget) => {
    saveBudget(newBudget);
    setBudget(getBudget());
  };

  const handleAddPot = (pot) => {
    addSavingsPot(pot);
    setSavingsPots(getSavingsPots());
  };

  const handleDeletePot = (id) => {
    deleteSavingsPot(id);
    setSavingsPots(getSavingsPots());
  };

  const handleUpdatePot = (pot) => {
    updateSavingsPot(pot);
    setSavingsPots(getSavingsPots());
  };

  const handleAddCategory = (type, categoryName) => {
    const res = addUserCategory(type, categoryName);
    if (res.success) {
      setCategories(getUserCategories());
    }
    return res;
  };

  const handleDeleteCategory = (type, categoryName) => {
    const res = deleteUserCategory(type, categoryName);
    if (res.success) {
      setCategories(getUserCategories());
    }
    return res;
  };

  const handleAddRecurring = (item) => {
    addRecurringTransaction(item);
    setRecurringList(getRecurringTransactions());
  };

  const handleDeleteRecurring = (id) => {
    deleteRecurringTransaction(id);
    setRecurringList(getRecurringTransactions());
  };

  const handleSaveApiKey = (key) => {
    saveGeminiApiKey(key);
    setGeminiKey(getGeminiApiKey());
  };

  const handleClearUserData = () => {
    clearUserData(activeUser);
    saveGeminiApiKey('');
    setGeminiKey('');
    logoutUser();
    setIsAuthenticated(false);
    setActiveUser('');
    setActiveTab('dashboard');
    alert('Đã xóa sạch toàn bộ dữ liệu tài khoản và đăng xuất!');
  };

  const handleExport = () => {
    exportData();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importData(event.target.result);
      if (result.success) {
        alert('Nhập dữ liệu thành công!');
        setTransactions(getTransactions());
        setBudget(getBudget());
        setSavingsPots(getSavingsPots());
      } else {
        alert('Nhập dữ liệu thất bại: ' + result.error);
      }
    };
    reader.readAsText(file);
  };

  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?')) {
      logoutUser();
      setIsAuthenticated(false);
      setActiveUser('');
      setActiveTab('dashboard');
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'transactions', label: 'Giao dịch', icon: FileText },
    { id: 'savings', label: 'Tiết kiệm', icon: PiggyBank },
    { id: 'ai-assistant', label: 'Trợ lý AnhTuanAI', icon: Sparkles },
    { id: 'budget', label: 'Cấu hình & Bảo mật', icon: Settings },
    { id: 'tips', label: 'Trợ lý tài chính', icon: Lightbulb },
  ];

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            transactions={transactions} 
            budget={budget} 
            savingsPots={savingsPots} 
            onNavigate={(tab) => setActiveTab(tab)} 
            onAddTransaction={handleAddTransaction} 
          />
        );
      case 'transactions':
        return (
          <Transactions 
            transactions={transactions} 
            categories={categories}
            onAddTransaction={handleAddTransaction} 
            onDeleteTransaction={handleDeleteTransaction} 
            onUpdateTransaction={handleUpdateTransaction} 
          />
        );
      case 'savings':
        return (
          <Savings 
            pots={savingsPots} 
            transactions={transactions} 
            onAddPot={handleAddPot} 
            onDeletePot={handleDeletePot} 
            onUpdatePot={handleUpdatePot} 
            onAddTransaction={handleAddTransaction} 
          />
        );
      case 'ai-assistant':
        return (
          <AiAssistant 
            transactions={transactions}
            budget={budget}
            savingsPots={savingsPots}
            activeUser={activeUser}
            geminiKey={geminiKey}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'budget':
        return (
          <BudgetSettings 
            budget={budget} 
            categories={categories}
            recurringList={recurringList}
            activeUser={activeUser}
            geminiKey={geminiKey}
            onSave={handleSaveBudget} 
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddRecurring={handleAddRecurring}
            onDeleteRecurring={handleDeleteRecurring}
            onSaveApiKey={handleSaveApiKey}
            onClearUserData={handleClearUserData}
          />
        );
      case 'tips':
        return (
          <FinancialTips 
            transactions={transactions} 
            budget={budget} 
            savingsPots={savingsPots} 
          />
        );
      default:
        return <div>Không tìm thấy trang.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row relative overflow-hidden">
      
      {/* 1. Cyber Grid Background Overlay */}
      <div className="cyber-grid"></div>

      {/* 2. Twinkling Stars in Background */}
      {stars.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white opacity-20 pointer-events-none animate-twinkle"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.4)'
          }}
        />
      ))}

      {/* 3. Decorative Moving Orbs */}
      <div className="absolute top-0 right-1/4 w-[350px] h-[350px] bg-purple-650/5 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-10 left-1/3 w-[400px] h-[400px] bg-indigo-650/5 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '3s' }}></div>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-slate-900/60 p-6 min-h-screen z-10 sticky top-0 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-650 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/10 animate-float">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">AnhTuan</h1>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Tài chính cá nhân</span>
          </div>
        </div>

        {/* User profile section */}
        <div className="glass-card flex items-center gap-3 p-3 rounded-2xl mb-6 border border-slate-850 bg-slate-950/30 hover:shadow-[0_0_15px_-3px_rgba(168,85,247,0.15)] transition duration-300">
          <div className="w-8 h-8 rounded-full bg-purple-550/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-slate-500 block font-semibold">Tài khoản</span>
            <span className="text-sm font-bold text-slate-200 block truncate" title={activeUser}>{activeUser}</span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer btn-click-effect ${
                  isActive 
                    ? 'bg-purple-600/15 text-purple-455 border border-purple-500/20 shadow-[0_0_15px_-3px_rgba(168,85,247,0.2)] font-bold text-glow-purple' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Actions at Bottom of Sidebar */}
        <div className="border-t border-slate-900/80 pt-4 space-y-2 mt-4">
          <label className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-250 hover:bg-slate-900/35 transition cursor-pointer border border-transparent btn-click-effect">
            <Upload className="w-4 h-4" />
            <span>Nhập dữ liệu</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-250 hover:bg-slate-900/35 transition cursor-pointer border border-transparent btn-click-effect"
          >
            <Download className="w-4 h-4" />
            <span>Xuất dữ liệu</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-350 transition cursor-pointer border border-transparent btn-click-effect"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Header and Mobile Nav */}
      <div className="flex-1 flex flex-col md:pl-0 z-10 min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 glass-panel border-b border-slate-900/60 sticky top-0 z-30 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-indigo-655 rounded-lg flex items-center justify-center text-white shadow-md">
              <Wallet className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">AnhTuan</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-purple-450">
              <User className="w-3.5 h-3.5" />
              <span className="max-w-[70px] truncate">{activeUser}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer btn-click-effect"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer btn-click-effect"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-slate-950/95 z-20 flex flex-col justify-between p-6 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="space-y-6 pt-16">
              {/* User profile */}
              <div className="glass-card flex items-center gap-3.5 p-4 rounded-2xl border border-slate-850">
                <div className="w-10 h-10 rounded-full bg-purple-550/10 text-purple-400 border border-purple-550/20 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 block font-semibold">Tài khoản hiện tại</span>
                  <span className="text-base font-bold text-white block">{activeUser}</span>
                </div>
              </div>

              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-base font-semibold transition cursor-pointer btn-click-effect ${
                        isActive 
                          ? 'bg-purple-600/15 text-purple-455 border border-purple-500/20 shadow-[0_0_15px_-3px_rgba(168,85,247,0.2)] font-bold text-glow-purple' 
                          : 'text-slate-400 border border-transparent'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-slate-900 pt-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-slate-350 bg-slate-900 border border-slate-800 cursor-pointer btn-click-effect">
                  <Upload className="w-4 h-4" />
                  <span>Nhập JSON</span>
                  <input type="file" accept=".json" onChange={(e) => { handleImport(e); setMobileMenuOpen(false); }} className="hidden" />
                </label>

                <button
                  onClick={() => { handleExport(); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-slate-350 bg-slate-900 border border-slate-800 cursor-pointer btn-click-effect"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất JSON</span>
                </button>
              </div>

              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-rose-450 bg-rose-500/5 border border-rose-500/10 cursor-pointer btn-click-effect"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Content area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto pb-24 md:pb-8">
          <div className="animate-slide-up">
            {renderActiveContent()}
          </div>
        </main>

        {/* Mobile Bottom Tabbar navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-slate-900/60 flex justify-around py-2.5 z-10 px-2 rounded-t-2xl shadow-2xl bg-slate-950/80">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center gap-1.5 transition cursor-pointer px-3 py-1 rounded-xl btn-click-effect ${
                  isActive ? 'text-purple-400 font-bold text-glow-purple' : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                <Icon className="w-5.5 h-5.5" />
                <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}