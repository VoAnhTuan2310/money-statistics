import React, { useState } from 'react';
import { Plus, Trash2, ArrowUpRight, ArrowDownLeft, X, Target, Calendar } from 'lucide-react';
import { formatVND, formatNumberInput } from '../utils/storage';

export default function Savings({ pots, transactions, onAddPot, onDeletePot, onUpdatePot, onAddTransaction }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedPot, setSelectedPot] = useState(null);
  const [transferType, setTransferType] = useState('deposit'); // 'deposit' or 'withdraw'
  const [transferAmount, setTransferAmount] = useState('');
  
  // New pot state
  const [newPotName, setNewPotName] = useState('');
  const [newPotTarget, setNewPotTarget] = useState('');
  const [newPotCurrent, setNewPotCurrent] = useState('');
  const [newPotColor, setNewPotColor] = useState('violet');
  const [newPotDate, setNewPotDate] = useState('');

  const colors = [
    { value: 'violet', label: 'Tím', bg: 'bg-violet-500/20', text: 'text-violet-400', progress: 'bg-violet-500', border: 'border-violet-500/30' },
    { value: 'emerald', label: 'Xanh Lá', bg: 'bg-emerald-500/20', text: 'text-emerald-400', progress: 'bg-emerald-500', border: 'border-emerald-500/30' },
    { value: 'blue', label: 'Xanh Dương', bg: 'bg-blue-500/20', text: 'text-blue-400', progress: 'bg-blue-500', border: 'border-blue-500/30' },
    { value: 'amber', label: 'Vàng Cát', bg: 'bg-amber-500/20', text: 'text-amber-400', progress: 'bg-amber-500', border: 'border-amber-500/30' },
    { value: 'rose', label: 'Hồng Đỏ', bg: 'bg-rose-500/20', text: 'text-rose-400', progress: 'bg-rose-500', border: 'border-rose-500/30' }
  ];

  const getColorData = (colorName) => {
    return colors.find(c => c.value === colorName) || colors[0];
  };

  const handleAddPotSubmit = (e) => {
    e.preventDefault();
    if (!newPotName || !newPotTarget) return;

    onAddPot({
      name: newPotName,
      targetAmount: Number(newPotTarget),
      currentAmount: Number(newPotCurrent) || 0,
      color: newPotColor,
      targetDate: newPotDate
    });

    // If starting with a current amount > 0, we can log a transaction
    if (Number(newPotCurrent) > 0) {
      onAddTransaction({
        type: 'expense',
        amount: Number(newPotCurrent),
        category: 'Tiết kiệm',
        date: new Date().toISOString().split('T')[0],
        note: `Khởi tạo quỹ tiết kiệm: ${newPotName}`
      });
    }

    // Reset fields
    setNewPotName('');
    setNewPotTarget('');
    setNewPotCurrent('');
    setNewPotColor('violet');
    setNewPotDate('');
    setShowAddModal(false);
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    const amount = Number(transferAmount);
    if (!amount || amount <= 0 || !selectedPot) return;

    let newAmount = selectedPot.currentAmount;
    if (transferType === 'deposit') {
      newAmount += amount;
      // Add transaction for bookkeeping
      onAddTransaction({
        type: 'expense',
        amount: amount,
        category: 'Tiết kiệm',
        date: new Date().toISOString().split('T')[0],
        note: `Gửi tiền vào quỹ: ${selectedPot.name}`
      });
    } else {
      if (amount > selectedPot.currentAmount) {
        alert('Số tiền rút vượt quá số tiền hiện tại của quỹ!');
        return;
      }
      newAmount -= amount;
      // Add transaction for bookkeeping
      onAddTransaction({
        type: 'income',
        amount: amount,
        category: 'Tiết kiệm',
        date: new Date().toISOString().split('T')[0],
        note: `Rút tiền từ quỹ: ${selectedPot.name}`
      });
    }

    onUpdatePot({
      ...selectedPot,
      currentAmount: newAmount
    });

    setTransferAmount('');
    setShowTransferModal(false);
    setSelectedPot(null);
  };

  const openTransfer = (pot, type) => {
    setSelectedPot(pot);
    setTransferType(type);
    setShowTransferModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100 font-heading">Quỹ Tiết Kiệm</h2>
          <p className="text-slate-400 mt-1">Quản lý và theo dõi tiến độ hoàn thành các mục tiêu tài chính.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition cursor-pointer shadow-lg shadow-purple-500/10 text-sm"
        >
          <Plus className="w-4 h-4" /> Tạo Quỹ Mới
        </button>
      </div>

      {/* Grid of saving pots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pots.map(pot => {
          const colorData = getColorData(pot.color);
          const percent = Math.min(100, Math.round((pot.currentAmount / pot.targetAmount) * 100)) || 0;
          
          return (
            <div key={pot.id} className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col justify-between h-64 hover:border-purple-500/25 hover:-translate-y-1.5 hover:shadow-[0_10px_25px_-5px_rgba(168,85,247,0.1)] transition-all duration-300 group">
              <div>
                <div className="flex justify-between items-start">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${colorData.bg} ${colorData.text} border ${colorData.border}`}>
                    {percent}% Hoàn thành
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Bạn có chắc chắn muốn xóa quỹ "${pot.name}" không?`)) {
                        onDeletePot(pot.id);
                      }
                    }}
                    className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Xóa quỹ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-xl font-bold text-slate-100 mt-4 line-clamp-1">{pot.name}</h3>
                
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-2xl font-black text-white font-heading">{formatVND(pot.currentAmount)}</span>
                  <span className="text-xs text-slate-400">mục tiêu: {formatVND(pot.targetAmount)}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-950 rounded-full h-2 mt-4 overflow-hidden border border-slate-900">
                  <div className={`h-full ${colorData.progress} rounded-full transition-all duration-500 ease-out group-hover:brightness-110`} style={{ width: `${percent}%` }}></div>
                </div>

                {pot.targetDate && (
                  <div className="flex items-center gap-1 text-slate-500 text-xs mt-3">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Hạn chót: {new Date(pot.targetDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-900">
                <button
                  onClick={() => openTransfer(pot, 'deposit')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> Gửi thêm
                </button>
                <button
                  onClick={() => openTransfer(pot, 'withdraw')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition cursor-pointer"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Rút tiền
                </button>
              </div>
            </div>
          );
        })}

        {pots.length === 0 && (
          <div className="col-span-full glass-panel py-16 px-4 text-center rounded-2xl">
            <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Bạn chưa tạo hũ tiết kiệm nào.</p>
            <p className="text-slate-500 text-sm mt-1">Hãy thiết lập một quỹ mới để quản lý tài chính thông minh hơn.</p>
          </div>
        )}
      </div>

      {/* MODAL: ADD SAVINGS POT */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-4 font-heading">
              <Target className="text-purple-400 w-5 h-5" /> Tạo Hũ Tiết Kiệm Mới
            </h3>

            <form onSubmit={handleAddPotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tên mục tiêu</label>
                <input
                  type="text"
                  required
                  value={newPotName}
                  onChange={(e) => setNewPotName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-sm"
                  placeholder="Ví dụ: Mua Macbook Pro, Đi Nhật..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Số tiền mục tiêu</label>
                  <input
                    type="text"
                    required
                    value={formatNumberInput(newPotTarget)}
                    onChange={(e) => setNewPotTarget(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-xl glass-input text-sm"
                    placeholder="20,000,000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Số tiền có sẵn</label>
                  <input
                    type="text"
                    value={formatNumberInput(newPotCurrent)}
                    onChange={(e) => setNewPotCurrent(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-xl glass-input text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Hạn chót mục tiêu (không bắt buộc)</label>
                <input
                  type="date"
                  value={newPotDate}
                  onChange={(e) => setNewPotDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Màu sắc chủ đề</label>
                <div className="flex gap-2.5">
                  {colors.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setNewPotColor(c.value)}
                      className={`w-7 h-7 rounded-full ${c.progress} border-2 ${newPotColor === c.value ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'} transition cursor-pointer`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition cursor-pointer text-sm shadow-lg shadow-purple-500/10 mt-2"
              >
                Khởi Tạo Quỹ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER MONEY (DEPOSIT/WITHDRAW) */}
      {showTransferModal && selectedPot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm p-6 rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowTransferModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-100 mb-2 font-heading">
              {transferType === 'deposit' ? 'Gửi Thêm Tiết Kiệm' : 'Rút Tiền Tiết Kiệm'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Quỹ: <span className="text-slate-200 font-semibold">{selectedPot.name}</span> (Hiện có: {formatVND(selectedPot.currentAmount)})
            </p>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Số tiền (VND)</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formatNumberInput(transferAmount)}
                  onChange={(e) => setTransferAmount(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl glass-input text-base font-semibold"
                  placeholder="Nhập số tiền..."
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl text-white font-semibold transition cursor-pointer text-sm shadow-md mt-2 ${
                  transferType === 'deposit' 
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/10' 
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/10'
                }`}
              >
                Xác Nhận {transferType === 'deposit' ? 'Gửi Tiền' : 'Rút Tiền'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
