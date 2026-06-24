import React, { useState } from 'react';
import { 
  Plus, Trash2, Edit, Wallet, CreditCard, Smartphone, 
  Coins, X, DollarSign, ArrowRightLeft, ShieldCheck 
} from 'lucide-react';
import { formatVND, formatNumberInput } from '../utils/storage';

export default function Wallets({ 
  wallets, 
  onAddWallet, 
  onUpdateWalletBalance, 
  onUpdateWallet,
  onDeleteWallet,
  userRole = 'user'
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  
  // New wallet form state
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState('bank');
  const [newWalletBalance, setNewWalletBalance] = useState('');

  // Edit balance form state
  const [editNameInput, setEditNameInput] = useState('');
  const [editTypeInput, setEditTypeInput] = useState('bank');
  const [editBalanceInput, setEditBalanceInput] = useState('');

  // Calculate total balance
  const totalBalance = wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);

  // Icon mapping
  const getWalletIcon = (type) => {
    switch (type) {
      case 'cash':
        return <Wallet className="w-5 h-5 text-emerald-400" />;
      case 'bank':
        return <CreditCard className="w-5 h-5 text-blue-400" />;
      case 'wallet':
        return <Smartphone className="w-5 h-5 text-purple-400" />;
      default:
        return <Coins className="w-5 h-5 text-amber-400" />;
    }
  };

  const getWalletTypeLabel = (type) => {
    switch (type) {
      case 'cash':
        return 'Tiền mặt';
      case 'bank':
        return 'Tài khoản ngân hàng';
      case 'wallet':
        return 'Ví điện tử';
      default:
        return 'Nguồn tiền khác';
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;

    // Remove commas from formatted balance input
    const cleanBalance = Number(newWalletBalance.replace(/,/g, '')) || 0;

    onAddWallet({
      name: newWalletName.trim(),
      type: newWalletType,
      balance: cleanBalance
    });

    // Reset state
    setNewWalletName('');
    setNewWalletType('bank');
    setNewWalletBalance('');
    setShowAddModal(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedWallet || !editNameInput.trim()) return;

    const cleanBalance = Number(editBalanceInput.replace(/,/g, '')) || 0;
    
    if (onUpdateWallet) {
      onUpdateWallet(selectedWallet.id, {
        name: editNameInput.trim(),
        type: editTypeInput,
        balance: cleanBalance
      });
    } else {
      onUpdateWalletBalance(selectedWallet.id, cleanBalance);
    }

    setSelectedWallet(null);
    setEditNameInput('');
    setEditTypeInput('bank');
    setEditBalanceInput('');
    setShowEditModal(false);
  };

  const openEditModal = (wallet) => {
    setSelectedWallet(wallet);
    setEditNameInput(wallet.name);
    setEditTypeInput(wallet.type);
    setEditBalanceInput(formatNumberInput(wallet.balance));
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-slide-up">
      
      {/* 1. Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 font-heading">Ví & Tài Khoản</h2>
          <p className="text-xs text-slate-400">Quản lý các nguồn tiền hiện có của bạn và tự động cộng tổng tài sản.</p>
        </div>
        {userRole !== 'user' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-550 hover:to-indigo-600 text-white font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 cursor-pointer btn-click-effect border border-purple-500/20 text-xs self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm ví mới</span>
          </button>
        )}
      </div>

      {/* 2. Total Assets Glimmering Card */}
      <div className="relative overflow-hidden p-6 rounded-3xl glass-panel border border-purple-500/20 bg-gradient-to-tr from-purple-950/15 via-indigo-950/10 to-slate-950/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 glow-purple">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5 font-heading">
            <ShieldCheck className="w-4 h-4 text-purple-400" /> Tổng Số Dư Tích Hợp
          </span>
          <h3 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-purple-300 font-heading">
            {formatVND(totalBalance)}
          </h3>
          <p className="text-xs text-slate-400">
            Tổng giá trị tài sản ròng khả dụng tích lũy từ {wallets.length} ví khác nhau.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-900/60 max-w-sm w-full">
          <ArrowRightLeft className="w-8 h-8 text-indigo-400 flex-shrink-0" />
          <div className="text-xs leading-relaxed text-slate-400">
            Số dư ví được đồng bộ bảo mật offline. Khi bạn thêm chi tiêu hay thu nhập, bạn có thể tự cập nhật nhanh số dư tại trang này.
          </div>
        </div>
      </div>

      {/* 3. Grid of Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.map((wallet) => (
          <div 
            key={wallet.id} 
            className="glass-panel p-5 rounded-2xl border border-slate-900 hover:border-purple-500/20 shadow-xl transition-all duration-300 flex flex-col justify-between hover:shadow-[0_10px_30px_-10px_rgba(168,85,247,0.15)] relative group bg-slate-950/20"
          >
            {/* Wallet Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-900 shadow-inner">
                  {getWalletIcon(wallet.type)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-sm font-heading group-hover:text-purple-400 transition-colors line-clamp-1">{wallet.name}</h4>
                  <span className="text-[10px] text-slate-500 font-semibold">{getWalletTypeLabel(wallet.type)}</span>
                </div>
              </div>
              
              {/* Default Tag */}
              {wallet.isDefault && (
                <span className="text-[8px] bg-slate-950 text-slate-450 border border-slate-900 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  Mặc định
                </span>
              )}
            </div>

            {/* Balance area */}
            <div className="my-6">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Số dư hiện tại</span>
              <span className="text-xl font-extrabold text-slate-100 font-heading">
                {formatVND(wallet.balance)}
              </span>
            </div>

            {/* Actions */}
            {userRole !== 'user' && (
              <div className="flex gap-2 pt-3 border-t border-slate-900/60">
                <button
                  onClick={() => openEditModal(wallet)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer btn-click-effect"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa</span>
                </button>
                
                {wallets.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`Bạn có chắc chắn muốn xóa ví "${wallet.name}" không?`)) {
                        onDeleteWallet(wallet.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-500/10 border border-slate-900 hover:border-rose-500/10 text-slate-500 hover:text-rose-400 transition cursor-pointer btn-click-effect"
                    title="Xóa ví"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 4. MODAL: Add New Wallet */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl shadow-2xl border border-purple-500/20 animate-slide-up relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 font-heading mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-400" /> Thêm Ví Mới
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider mb-1.5 ml-1">Tên Ví / Tài khoản</label>
                <input
                  type="text"
                  required
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-semibold"
                  placeholder="Ví dụ: Ví MoMo, Thẻ Techcombank..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider mb-1.5 ml-1">Loại ví</label>
                <select
                  value={newWalletType}
                  onChange={(e) => setNewWalletType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-semibold"
                >
                  <option value="cash">Tiền mặt (Cash)</option>
                  <option value="bank">Tài khoản ngân hàng (Bank)</option>
                  <option value="wallet">Ví điện tử (E-Wallet)</option>
                  <option value="other">Khoản tiền khác (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider mb-1.5 ml-1">Số dư ban đầu (VND)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold font-heading">₫</span>
                  <input
                    type="text"
                    required
                    value={newWalletBalance}
                    onChange={(e) => setNewWalletBalance(formatNumberInput(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl glass-input text-xs font-extrabold font-heading text-purple-400"
                    placeholder="0"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-550 hover:to-indigo-550 text-white font-bold transition cursor-pointer text-xs btn-click-effect mt-2 shadow-lg shadow-purple-500/10 border border-purple-500/20"
              >
                Tạo ví mới
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Edit Balance */}
      {showEditModal && selectedWallet && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl shadow-2xl border border-purple-500/20 animate-slide-up relative">
            <button 
              onClick={() => {
                setSelectedWallet(null);
                setShowEditModal(false);
              }}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 font-heading mb-4 flex items-center gap-2">
              <Edit className="w-5 h-5 text-indigo-400" /> Chỉnh Sửa Ví / Tài Khoản
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-455 uppercase tracking-wider mb-1.5 ml-1">Tên Ví / Tài khoản</label>
                <input
                  type="text"
                  required
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-semibold"
                  placeholder="Ví dụ: Ví MoMo, Thẻ Techcombank..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-455 uppercase tracking-wider mb-1.5 ml-1">Loại ví</label>
                <select
                  value={editTypeInput}
                  onChange={(e) => setEditTypeInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-semibold"
                >
                  <option value="cash">Tiền mặt (Cash)</option>
                  <option value="bank">Tài khoản ngân hàng (Bank)</option>
                  <option value="wallet">Ví điện tử (E-Wallet)</option>
                  <option value="other">Khoản tiền khác (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-455 uppercase tracking-wider mb-1.5 ml-1">Số dư hiện tại (VND)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold font-heading">₫</span>
                  <input
                    type="text"
                    required
                    value={editBalanceInput}
                    onChange={(e) => setEditBalanceInput(formatNumberInput(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl glass-input text-xs font-extrabold font-heading text-purple-400"
                    placeholder="0"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-550 hover:to-indigo-550 text-white font-bold transition cursor-pointer text-xs btn-click-effect mt-2 shadow-lg shadow-purple-500/10 border border-purple-500/20"
              >
                Lưu thay đổi
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
