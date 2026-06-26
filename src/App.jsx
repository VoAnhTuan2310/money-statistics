import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './utils/firebase';
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
  Users,
  LogOut,
  Sparkles,
  Calendar,
  Calculator,
  Timer,
  Bike
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
  getActiveUser,
  logoutUser,
  syncPullAll,
  getUserRole,
  getUserCategories,
  addUserCategory,
  deleteUserCategory,
  getRecurringTransactions,
  addRecurringTransaction,
  deleteRecurringTransaction,
  processRecurringTransactions,
  clearUserData,
  getGeminiApiKey,
  saveGeminiApiKey,
  getWallets,
  saveWallets,
  addWallet,
  updateWalletBalance,
  updateWallet,
  deleteWallet
} from './utils/storage';

import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Savings from './components/Savings';
import BudgetSettings from './components/BudgetSettings';
import FinancialTips from './components/FinancialTips';
import AiAssistant from './components/AiAssistant';
import Wallets from './components/Wallets';
import Login from './components/Login';
import DailyTransactions from './components/DailyTransactions';
import AccountManager from './components/AccountManager';
import FinancialCalculator from './components/FinancialCalculator';
import WorkTimer from './components/WorkTimer';
import ShopeeFoodDriver from './components/ShopeeFoodDriver';

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
  const [wallets, setWallets] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUser, setActiveUser] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('user');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('fintrack_theme') || 'purple');
  const [stars, setStars] = useState([]);

  // Apply active theme class to document element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-green', 'theme-rose', 'theme-blue', 'theme-amber');
    if (activeTheme !== 'purple') {
      root.classList.add(`theme-${activeTheme}`);
    }
    localStorage.setItem('fintrack_theme', activeTheme);
  }, [activeTheme]);

  // Load state on mount
  useEffect(() => {
    const initApp = async () => {
      const username = getActiveUser();
      if (username) {
        // Sync with Firestore first before loading
        await syncPullAll(username);
        
        setIsAuthenticated(true);
        setActiveUser(username);
        setUserRole(getUserRole(username));
        
        setTransactions(getTransactions());
        setBudget(getBudget());
        setSavingsPots(getSavingsPots());
        setCategories(getUserCategories());
        setRecurringList(getRecurringTransactions());
        setGeminiKey(getGeminiApiKey());
        setWallets(getWallets());

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
    };

    initApp();

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

  // Real-time Firestore sync
  useEffect(() => {
    if (!isAuthenticated || !activeUser) return;

    const normalized = activeUser.trim().toLowerCase();
    const storageUsername = activeUser.trim();

    // Listen to transactions document
    const unsubTx = onSnapshot(doc(db, 'userdata_transactions', normalized), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data().data;
        localStorage.setItem(`fintrack_transactions_${storageUsername}`, JSON.stringify(data));
        setTransactions(data);
      }
    });

    // Listen to wallets document
    const unsubWallets = onSnapshot(doc(db, 'userdata_wallets', normalized), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data().data;
        localStorage.setItem(`fintrack_wallets_${storageUsername}`, JSON.stringify(data));
        setWallets(data);
      }
    });

    // Listen to savings pots document
    const unsubSavings = onSnapshot(doc(db, 'userdata_savings_pots', normalized), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data().data;
        localStorage.setItem(`fintrack_savings_pots_${storageUsername}`, JSON.stringify(data));
        setSavingsPots(data);
      }
    });

    // Listen to budget document
    const unsubBudget = onSnapshot(doc(db, 'userdata_budget', normalized), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data().data;
        localStorage.setItem(`fintrack_budget_${storageUsername}`, JSON.stringify(data));
        setBudget(data);
      }
    });

    // Listen to categories document
    const unsubCategories = onSnapshot(doc(db, 'userdata_categories', normalized), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data().data;
        localStorage.setItem(`fintrack_categories_${storageUsername}`, JSON.stringify(data));
        setCategories(data);
      }
    });

    // Listen to recurring transactions document
    const unsubRecurring = onSnapshot(doc(db, 'userdata_recurring', normalized), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data().data;
        localStorage.setItem(`fintrack_recurring_${storageUsername}`, JSON.stringify(data));
        setRecurringList(data);
      }
    });

    return () => {
      unsubTx();
      unsubWallets();
      unsubSavings();
      unsubBudget();
      unsubCategories();
      unsubRecurring();
    };
  }, [isAuthenticated, activeUser]);

  const handleLoginSuccess = () => {
    const username = getActiveUser();
    setIsAuthenticated(true);
    setActiveUser(username);
    setUserRole(getUserRole(username));
    
    setTransactions(getTransactions());
    setBudget(getBudget());
    setSavingsPots(getSavingsPots());
    setCategories(getUserCategories());
    setRecurringList(getRecurringTransactions());
    setGeminiKey(getGeminiApiKey());
    setWallets(getWallets());

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
    
    // Update associated wallet balance
    const walletId = tx.walletId;
    setWallets(prevWallets => {
      const activeWalletId = walletId || (prevWallets.length > 0 ? prevWallets[0].id : null);
      if (!activeWalletId) return prevWallets;
      
      const updated = prevWallets.map(w => {
        if (w.id === activeWalletId) {
          const change = tx.type === 'income' ? tx.amount : -tx.amount;
          return { ...w, balance: w.balance + change };
        }
        return w;
      });
      saveWallets(updated);
      return updated;
    });
    
    setTransactions(getTransactions());
  };

  const handleDeleteTransaction = (id) => {
    // Find transaction to know its details before deleting
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      const walletId = tx.walletId;
      setWallets(prevWallets => {
        const activeWalletId = walletId || (prevWallets.length > 0 ? prevWallets[0].id : null);
        if (!activeWalletId) return prevWallets;
        
        const updated = prevWallets.map(w => {
          if (w.id === activeWalletId) {
            // Reverse transaction effect
            const change = tx.type === 'income' ? -tx.amount : tx.amount;
            return { ...w, balance: w.balance + change };
          }
          return w;
        });
        saveWallets(updated);
        return updated;
      });
    }
    
    deleteTransaction(id);
    setTransactions(getTransactions());
  };

  const handleUpdateTransaction = (tx) => {
    const oldTx = transactions.find(t => t.id === tx.id);
    if (oldTx) {
      const oldWalletId = oldTx.walletId;
      const newWalletId = tx.walletId;
      
      setWallets(prevWallets => {
        const activeOldWalletId = oldWalletId || (prevWallets.length > 0 ? prevWallets[0].id : null);
        const activeNewWalletId = newWalletId || (prevWallets.length > 0 ? prevWallets[0].id : null);
        
        let updated = [...prevWallets];
        
        // Reverse old transaction
        if (activeOldWalletId) {
          updated = updated.map(w => {
            if (w.id === activeOldWalletId) {
              const change = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
              return { ...w, balance: w.balance + change };
            }
            return w;
          });
        }
        
        // Apply new transaction
        if (activeNewWalletId) {
          updated = updated.map(w => {
            if (w.id === activeNewWalletId) {
              const change = tx.type === 'income' ? tx.amount : -tx.amount;
              return { ...w, balance: w.balance + change };
            }
            return w;
          });
        }
        
        saveWallets(updated);
        return updated;
      });
    }
    
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

  const handleAddWallet = (wallet) => {
    addWallet(wallet);
    setWallets(getWallets());
  };

  const handleUpdateWalletBalance = (id, balance) => {
    updateWalletBalance(id, balance);
    setWallets(getWallets());
  };

  const handleUpdateWallet = (id, data) => {
    updateWallet(id, data);
    setWallets(getWallets());
  };

  const handleDeleteWallet = (id) => {
    deleteWallet(id);
    setWallets(getWallets());
  };

  const handleClearUserData = async () => {
    await clearUserData(activeUser);
    saveGeminiApiKey('');
    setGeminiKey('');
    setWallets([]);
    logoutUser();
    setIsAuthenticated(false);
    setActiveUser('');
    setUserRole('user');
    setActiveTab('dashboard');
    alert('Đã xóa sạch toàn bộ dữ liệu tài khoản và đăng xuất!');
  };



  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?')) {
      logoutUser();
      setIsAuthenticated(false);
      setActiveUser('');
      setUserRole('user');
      setActiveTab('dashboard');
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'transactions', label: 'Lịch sử Giao dịch', icon: FileText },
    { id: 'daily-ledger', label: 'Thu chi hàng ngày', icon: Calendar },
    { id: 'savings', label: 'Tiết kiệm', icon: PiggyBank },
    { id: 'wallets', label: 'Ví & Tài khoản', icon: Wallet },
    { id: 'calculator', label: 'Công cụ tính toán', icon: Calculator },
    { id: 'work-timer', label: 'Đếm giờ làm việc', icon: Timer },
    { id: 'shopee-driver', label: 'Tài xế ShopeeFood', icon: Bike },
    { id: 'ai-assistant', label: 'Trợ lý AnhTuanAI', icon: Sparkles },
    { id: 'budget', label: 'Cấu hình & Bảo mật', icon: Settings },
    ...(userRole === 'admin' ? [{ id: 'accounts', label: 'Quản lý tài khoản', icon: Users }] : []),
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
            wallets={wallets}
            onNavigate={(tab) => setActiveTab(tab)} 
            onAddTransaction={handleAddTransaction} 
            userRole={userRole}
          />
        );
      case 'transactions':
        return (
          <Transactions 
            transactions={transactions} 
            categories={categories}
            wallets={wallets}
            geminiKey={geminiKey}
            onAddTransaction={handleAddTransaction} 
            onDeleteTransaction={handleDeleteTransaction} 
            onUpdateTransaction={handleUpdateTransaction} 
            userRole={userRole}
          />
        );
      case 'daily-ledger':
        return (
          <DailyTransactions 
            transactions={transactions} 
            categories={categories}
            wallets={wallets}
            geminiKey={geminiKey}
            onAddTransaction={handleAddTransaction} 
            onDeleteTransaction={handleDeleteTransaction} 
            onUpdateTransaction={handleUpdateTransaction} 
            userRole={userRole}
          />
        );
      case 'savings':
        return (
          <Savings 
            pots={savingsPots} 
            transactions={transactions} 
            wallets={wallets}
            onAddPot={handleAddPot} 
            onDeletePot={handleDeletePot} 
            onUpdatePot={handleUpdatePot} 
            onAddTransaction={handleAddTransaction} 
            userRole={userRole}
          />
        );
      case 'wallets':
        return (
          <Wallets 
            wallets={wallets}
            onAddWallet={handleAddWallet}
            onUpdateWalletBalance={handleUpdateWalletBalance}
            onUpdateWallet={handleUpdateWallet}
            onDeleteWallet={handleDeleteWallet}
            userRole={userRole}
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
            userRole={userRole}
            activeTheme={activeTheme}
            onChangeTheme={setActiveTheme}
          />
        );
      case 'calculator':
        return (
          <FinancialCalculator 
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'work-timer':
        return (
          <WorkTimer 
            activeUser={activeUser}
          />
        );
      case 'shopee-driver':
        return (
          <ShopeeFoodDriver 
            activeUser={activeUser}
          />
        );
      case 'accounts':
        return <AccountManager />;
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
        <div className="border-t border-slate-900/80 pt-4 mt-4">
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
          <div className="md:hidden fixed inset-0 bg-slate-950/95 z-20 flex flex-col p-6 animate-in fade-in slide-in-from-top-4 duration-200">
            {/* Scrollable middle container */}
            <div className="flex-1 overflow-y-auto pt-16 pb-4 space-y-6 pr-1">
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

            {/* Sticky/Fixed bottom action buttons */}
            <div className="border-t border-slate-900 pt-4 flex-shrink-0 mt-auto">
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-rose-455 bg-rose-500/5 border border-rose-500/10 cursor-pointer btn-click-effect"
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-slate-900/60 flex justify-around py-2 z-10 px-1 rounded-t-2xl shadow-2xl bg-slate-950/90 backdrop-blur-lg">
          {[
            { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
            { id: 'transactions', label: 'Giao dịch', icon: FileText },
            { id: 'daily-ledger', label: 'Thu chi', icon: Calendar },
            { id: 'savings', label: 'Tiết kiệm', icon: PiggyBank },
            { id: 'wallets', label: 'Ví & TK', icon: Wallet }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer rounded-xl btn-click-effect ${
                  isActive ? 'text-purple-400 font-extrabold text-glow-purple scale-105' : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-semibold tracking-wide mt-1">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}