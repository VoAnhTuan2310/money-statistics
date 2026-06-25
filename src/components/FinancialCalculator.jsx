import React, { useState, useEffect } from 'react';
import { 
  Calculator, Trash2, Copy, ArrowRight, Check, HelpCircle 
} from 'lucide-react';

export default function FinancialCalculator({ onNavigate }) {
  // Pocket Calculator State
  const [expression, setExpression] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const [calcHistory, setCalcHistory] = useState(() => {
    const saved = localStorage.getItem('fintrack_calc_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Save history helper
  useEffect(() => {
    localStorage.setItem('fintrack_calc_history', JSON.stringify(calcHistory));
  }, [calcHistory]);

  const copyResultToClipboard = (val) => {
    const cleanNum = val.replace(/\./g, '').replace(/,/g, '');
    navigator.clipboard.writeText(cleanNum);
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  // --- Pocket Calculator Actions ---
  const handleCalcBtn = (value) => {
    if (value === 'C') {
      setExpression('');
      setCalcResult('');
    } else if (value === '⌫') {
      setExpression(prev => prev.slice(0, -1));
    } else if (value === '=') {
      try {
        if (!expression) return;
        // Evaluate safely
        let expr = expression.replace(/×/g, '*').replace(/÷/g, '/');
        // Check safety
        if (!/^[\d+\-*/.()]+$/.test(expr)) {
          setCalcResult('Lỗi biểu thức');
          return;
        }
        const evalResult = new Function(`return (${expr})`)();
        if (isNaN(evalResult) || !isFinite(evalResult)) {
          setCalcResult('Lỗi phép tính');
          return;
        }
        const formattedRes = Number(evalResult).toLocaleString('vi-VN');
        setCalcResult(formattedRes);
        
        // Add to history
        const newHistoryItem = {
          id: Date.now(),
          expr: expression,
          result: formattedRes,
          rawResult: evalResult
        };
        setCalcHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]);
      } catch (err) {
        setCalcResult('Lỗi');
      }
    } else {
      // Prevent consecutive operators
      const ops = ['+', '-', '×', '÷', '.'];
      const lastChar = expression.slice(-1);
      if (ops.includes(value) && ops.includes(lastChar)) {
        return;
      }
      setExpression(prev => prev + value);
    }
  };

  const clearHistory = () => {
    setCalcHistory([]);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-slide-up pb-12">
      
      {/* Title Header */}
      <div className="border-b border-slate-900 pb-5">
        <h2 className="text-2xl font-black text-slate-100 font-heading flex items-center gap-2.5">
          <Calculator className="w-7 h-7 text-purple-400" />
          <span>Máy Tính Tài Chính Cá Nhân</span>
        </h2>
        <p className="text-xs text-slate-405 mt-1">Hỗ trợ tính toán nhanh các biểu thức số liệu và tạo nhanh giao dịch từ kết quả.</p>
      </div>

      {/* Grid Layout containing Calculator and History */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Main Pocket Calculator (Span 3) */}
        <div className="md:col-span-3 glass-panel p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-center border border-purple-500/10 bg-slate-950/20">
          <div className="w-full max-w-md space-y-6">
            
            {/* Screen Display (LCD Style) */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-purple-500/15 text-right font-mono flex flex-col justify-between h-32 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] relative group overflow-hidden">
              <span className="text-slate-500 text-sm tracking-wider select-all h-6 truncate">{expression || '0'}</span>
              <span className="text-white text-3xl md:text-4xl font-extrabold tracking-tight select-all truncate">
                {calcResult ? `= ${calcResult}` : '0'}
              </span>
              
              {calcResult && (
                <button
                  onClick={() => copyResultToClipboard(calcResult)}
                  className="absolute left-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-slate-900 border border-slate-800 hover:text-purple-400 text-slate-450 cursor-pointer shadow-md"
                  title="Sao chép kết quả"
                >
                  {copiedAmount ? <Check className="w-4 h-4 text-emerald-450" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Keyboard Layout */}
            <div className="grid grid-cols-4 gap-3">
              {/* Row 1: Operations */}
              <button 
                onClick={() => handleCalcBtn('C')} 
                className="py-4 md:py-4.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 border border-rose-500/20 text-rose-400 font-black transition-all duration-75 text-lg select-none cursor-pointer"
              >
                C
              </button>
              <button 
                onClick={() => handleCalcBtn('(')} 
                className="py-4 md:py-4.5 rounded-2xl bg-slate-900/50 hover:bg-slate-850/80 active:scale-95 border border-slate-800/60 text-slate-300 font-bold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                (
              </button>
              <button 
                onClick={() => handleCalcBtn(')')} 
                className="py-4 md:py-4.5 rounded-2xl bg-slate-900/50 hover:bg-slate-850/80 active:scale-95 border border-slate-800/60 text-slate-300 font-bold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                )
              </button>
              <button 
                onClick={() => handleCalcBtn('÷')} 
                className="py-4 md:py-4.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-550 hover:to-indigo-600 active:scale-95 border border-purple-500/20 text-white font-extrabold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                ÷
              </button>

              {/* Row 2: 7, 8, 9, * */}
              <button 
                onClick={() => handleCalcBtn('7')} 
                className="py-4 md:py-4.5 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 active:scale-95 border border-slate-850 text-slate-200 font-bold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                7
              </button>
              <button 
                onClick={() => handleCalcBtn('8')} 
                className="py-4 md:py-4.5 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 active:scale-95 border border-slate-850 text-slate-200 font-bold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                8
              </button>
              <button 
                onClick={() => handleCalcBtn('9')} 
                className="py-4 md:py-4.5 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 active:scale-95 border border-slate-850 text-slate-200 font-bold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                9
              </button>
              <button 
                onClick={() => handleCalcBtn('×')} 
                className="py-4 md:py-4.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-550 hover:to-indigo-600 active:scale-95 border border-purple-500/20 text-white font-extrabold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                ×
              </button>

              {/* Row 3: 4, 5, 6, - */}
              <button 
                onClick={() => handleCalcBtn('4')} 
                className="py-4 md:py-4.5 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 active:scale-95 border border-slate-850 text-slate-200 font-bold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                4
              </button>
              <button 
                onClick={() => handleCalcBtn('5')} 
                className="py-4 md:py-4.5 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 active:scale-95 border border-slate-850 text-slate-200 font-bold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                5
              </button>
              <button 
                onClick={() => handleCalcBtn('6')} 
                className="py-4 md:py-4.5 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 active:scale-95 border border-slate-850 text-slate-200 font-bold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                6
              </button>
              <button 
                onClick={() => handleCalcBtn('-')} 
                className="py-4 md:py-4.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-550 hover:to-indigo-600 active:scale-95 border border-purple-500/20 text-white font-extrabold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                -
              </button>

              {/* Row 4: 1, 2, 3, + */}
              <button 
                onClick={() => handleCalcBtn('1')} 
                className="py-4 md:py-4.5 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 active:scale-95 border border-slate-850 text-slate-200 font-bold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                1
              </button>
              <button 
                onClick={() => handleCalcBtn('2')} 
                className="py-4 md:py-4.5 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 active:scale-95 border border-slate-850 text-slate-200 font-bold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                2
              </button>
              <button 
                onClick={() => handleCalcBtn('3')} 
                className="py-4 md:py-4.5 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 active:scale-95 border border-slate-850 text-slate-200 font-bold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                3
              </button>
              <button 
                onClick={() => handleCalcBtn('+')} 
                className="py-4 md:py-4.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-550 hover:to-indigo-600 active:scale-95 border border-purple-500/20 text-white font-extrabold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                +
              </button>

              {/* Row 5: 0, ., backspace, = */}
              <button 
                onClick={() => handleCalcBtn('0')} 
                className="py-4 md:py-4.5 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 active:scale-95 border border-slate-850 text-slate-200 font-bold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                0
              </button>
              <button 
                onClick={() => handleCalcBtn('.')} 
                className="py-4 md:py-4.5 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 active:scale-95 border border-slate-850 text-slate-200 font-bold transition-all duration-75 text-lg select-none cursor-pointer"
              >
                .
              </button>
              <button 
                onClick={() => handleCalcBtn('⌫')} 
                className="py-4 md:py-4.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800/50 text-slate-400 active:scale-95 transition-all duration-75 text-lg select-none cursor-pointer flex items-center justify-center"
              >
                ⌫
              </button>
              <button 
                onClick={() => handleCalcBtn('=')} 
                className="py-4 md:py-4.5 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-purple-800 hover:brightness-110 active:scale-95 border border-purple-500/35 text-white font-black transition-all duration-75 text-xl select-none cursor-pointer shadow-lg shadow-purple-900/20"
              >
                =
              </button>
            </div>

            {/* Quick Actions after calc */}
            {calcResult && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => copyResultToClipboard(calcResult)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 active:scale-98 border border-slate-800 hover:text-slate-200 text-slate-400 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  {copiedAmount ? <Check className="w-4 h-4 text-emerald-450 animate-bounce" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedAmount ? 'Đã sao chép!' : 'Sao chép số tiền'}</span>
                </button>
                <button
                  onClick={() => {
                    const cleanAmt = calcResult.replace(/\./g, '').replace(/,/g, '');
                    // Navigate to daily-ledger ledger page
                    onNavigate('daily-ledger');
                  }}
                  className="py-3 px-5 rounded-xl bg-purple-600/15 hover:bg-purple-650/30 active:scale-98 border border-purple-500/25 text-purple-400 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Lập giao dịch mới</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: Calculation History (Span 2) */}
        <div className="md:col-span-2 glass-panel p-6 rounded-3xl shadow-xl flex flex-col justify-between border border-slate-900 bg-slate-950/10">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-heading flex items-center gap-2">
                <span>Nhật ký phép tính</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-slate-900 text-slate-500 font-bold border border-slate-850">
                  {calcHistory.length}
                </span>
              </h3>
              {calcHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1 transition cursor-pointer"
                  title="Xóa tất cả phép tính"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa nhật ký</span>
                </button>
              )}
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1 text-xs scrollbar-thin">
              {calcHistory.map(item => (
                <div 
                  key={item.id} 
                  className="p-3.5 rounded-2xl bg-slate-950/65 border border-slate-900 hover:border-slate-800 transition cursor-pointer group relative flex flex-col justify-center"
                  onClick={() => {
                    setExpression(item.expr);
                    setCalcResult(item.result);
                  }}
                  title="Bấm để nạp lại phép tính"
                >
                  <span className="text-slate-500 font-mono block text-[10px] truncate pr-8">{item.expr}</span>
                  <span className="text-slate-200 font-mono font-bold block mt-1 text-right text-base">
                    = {item.result}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyResultToClipboard(item.result);
                    }}
                    className="absolute right-3.5 top-3.5 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-purple-400 shadow-sm cursor-pointer"
                    title="Sao chép kết quả"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {calcHistory.length === 0 && (
                <div className="text-center py-24 space-y-2 text-slate-500">
                  <HelpCircle className="w-8 h-8 mx-auto text-slate-650 opacity-60" />
                  <p className="font-medium text-xs">Chưa có phép tính nào thực hiện.</p>
                  <p className="text-[10px] text-slate-650">Các phép tính toán sẽ được tự động lưu lại tại đây.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-950/50 p-4.5 rounded-2xl border border-slate-900/60 mt-4">
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Mẹo nhỏ sử dụng</span>
            <p className="text-[10px] text-slate-455 leading-relaxed">
              Bạn có thể sao chép nhanh bất kỳ số tiền nào từ lịch sử bằng cách di chuột và bấm vào biểu tượng sao chép. Bấm trực tiếp vào khung phép tính để sửa lại công thức cũ.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
