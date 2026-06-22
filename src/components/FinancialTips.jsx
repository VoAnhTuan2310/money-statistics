import React, { useMemo } from 'react';
import { 
  Sparkles, CheckCircle, AlertTriangle, ArrowRight, 
  HelpCircle, DollarSign, PiggyBank, Calendar, Lightbulb
} from 'lucide-react';
import { formatVND } from '../utils/storage';

export default function FinancialTips({ transactions, budget, savingsPots }) {
  
  const analysis = useMemo(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthTxs = transactions.filter(t => t.date.startsWith(currentMonth));
    
    const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // Days calculation
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-11
    const totalDays = new Date(year, month + 1, 0).getDate();
    const currentDay = today.getDate();
    const remainingDays = Math.max(1, totalDays - currentDay + 1);

    // Savings rate
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
    
    // Remaining daily budget
    const remainingBudget = Math.max(0, budget.monthlyExpenseLimit - expense);
    const dailySpendLimit = Math.round(remainingBudget / remainingDays);
    const isExceeded = expense >= budget.monthlyExpenseLimit;

    // 50/30/20 analysis
    // Grouping:
    // Needs (Thiết yếu): 'Ăn uống', 'Di chuyển', 'Nhà cửa & Hóa đơn', 'Sức khỏe'
    // Wants (Sở thích): 'Mua sắm', 'Giải trí', 'Khác'
    // Savings (Tích lũy): 'Tiết kiệm', 'Giáo dục' (hoặc các hũ tiết kiệm)
    let needs = 0;
    let wants = 0;
    let savings = income - expense; // General savings
    
    monthTxs.filter(t => t.type === 'expense').forEach(tx => {
      if (['Ăn uống', 'Di chuyển', 'Nhà cửa & Hóa đơn', 'Sức khỏe'].includes(tx.category)) {
        needs += tx.amount;
      } else if (['Mua sắm', 'Giải trí', 'Khác'].includes(tx.category)) {
        wants += tx.amount;
      } else {
        // If they tag 'Tiết kiệm' or 'Giáo dục' as expense:
        savings += tx.amount; 
      }
    });

    const totalAllocated = needs + wants + (savings > 0 ? savings : 0);
    const needsPct = totalAllocated > 0 ? Math.round((needs / totalAllocated) * 100) : 0;
    const wantsPct = totalAllocated > 0 ? Math.round((wants / totalAllocated) * 100) : 0;
    const savingsPct = totalAllocated > 0 ? Math.round((Math.max(0, savings) / totalAllocated) * 100) : 0;

    return {
      income,
      expense,
      savingsRate,
      remainingDays,
      dailySpendLimit,
      isExceeded,
      remainingBudget,
      needsPct,
      wantsPct,
      savingsPct,
      needs,
      wants,
      savings: Math.max(0, savings)
    };
  }, [transactions, budget]);

  // Static Financial Tips Array
  const financialTips = [
    "Quy tắc 24 giờ: Trước khi mua một món đồ không thiết yếu, hãy đợi 24 giờ. Rất có thể bạn sẽ nhận ra mình không thực sự cần nó.",
    "Tự nấu ăn tại nhà thay vì đi ăn ngoài có thể giúp bạn tiết kiệm đến 40% - 50% chi phí ăn uống hàng tháng.",
    "Hủy các dịch vụ đăng ký không sử dụng (Netflix, Spotify Premium, iCloud thừa dung lượng...) để tránh lãng phí âm thầm.",
    "Luôn ưu tiên gửi tiền tiết kiệm vào các hũ tích lũy ngay khi nhận được lương (Pay yourself first), thay vì tiêu xong mới tiết kiệm số còn lại.",
    "Ghi chép giao dịch ngay lập tức: Việc ghi chép ngay sau khi tiêu dùng giúp bạn tránh quên và có ý thức kiểm soát dòng tiền tốt hơn.",
    "Quy tắc 50/30/20 là hướng dẫn tuyệt vời cho ngân sách. Hãy nỗ lực tối đa để đưa phần tích lũy (tiết kiệm) đạt mức tối thiểu 20%."
  ];

  // Pick 3 tips based on calculations or index
  const activeTips = useMemo(() => {
    const tips = [];
    if (analysis.savingsRate < 20) {
      tips.push("Tỷ lệ tiết kiệm hiện tại của bạn đang dưới mức khuyến nghị (20%). Hãy xem xét cắt bớt các khoản chi tiêu thuộc nhóm Sở thích (Mua sắm, Giải trí) để nâng cao tích lũy.");
    } else {
      tips.push("Chúc mừng! Tỷ lệ tiết kiệm của bạn rất tốt. Bạn có thể xem xét chuyển bớt tiền nhàn rỗi từ số dư chính vào các hũ tiết kiệm mục tiêu dài hạn để sinh lời hoặc mua sắm kế hoạch.");
    }
    
    if (analysis.isExceeded) {
      tips.push("Hạn mức chi tiêu tháng đã hết! Bạn nên dừng ngay các khoản mua sắm không thiết yếu. Chỉ chi cho ăn uống tối thiểu và đi lại cần thiết.");
    } else if (analysis.savingsRate < 0) {
      tips.push("Số tiền chi tiêu lớn hơn thu nhập của bạn trong tháng này! Bạn đang tiêu lạm vào tiền tiết kiệm tích lũy trước đó. Hãy lập tức rà soát và cắt giảm ngân sách.");
    } else {
      tips.push(`Bạn còn lại trung bình ${formatVND(analysis.dailySpendLimit)}/ngày cho ${analysis.remainingDays} ngày tới của tháng. Hãy duy trì mức chi tiêu này để giữ đúng kế hoạch.`);
    }

    // Add a random static tip
    const randomTip = financialTips[new Date().getDate() % financialTips.length];
    tips.push(randomTip);

    return tips;
  }, [analysis]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-100 font-heading">Trợ Lý Tài Chính Thông Minh</h2>
        <p className="text-slate-400 mt-2">
          Phân tích chuyên sâu dựa trên thói quen chi tiêu thực tế của bạn trong tháng này.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Daily Limit & Savings Rate */}
        <div className="md:col-span-2 space-y-6">
          {/* Health Check Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Savings Rate Card */}
            <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <PiggyBank className="w-6 h-6" />
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  analysis.savingsRate >= 20 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {analysis.savingsRate >= 20 ? 'An Toàn' : 'Cần Cải Thiện'}
                </span>
              </div>
              <div className="mt-4">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Tỷ lệ tiết kiệm thực tế</span>
                <span className={`text-3xl font-black font-heading ${analysis.savingsRate >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {analysis.savingsRate}%
                </span>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Tỷ lệ tiết kiệm lý tưởng là trên 20%. Bạn đã giữ lại được {formatVND(analysis.income - analysis.expense)} sau khi trừ chi phí.
                </p>
              </div>
            </div>

            {/* Daily Remaining Limit Card */}
            <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="text-xs text-slate-400 font-medium">Còn {analysis.remainingDays} ngày</span>
              </div>
              <div className="mt-4">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Ngân sách chi tiêu / ngày</span>
                <span className={`text-3xl font-black font-heading ${analysis.isExceeded ? 'text-rose-500' : 'text-purple-400'}`}>
                  {analysis.isExceeded ? '0đ' : formatVND(analysis.dailySpendLimit)}
                </span>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {analysis.isExceeded 
                    ? 'Bạn đã hết hạn mức chi tiêu cho tháng này. Không khuyến nghị chi tiêu thêm.' 
                    : `Bạn còn lại tổng cộng ${formatVND(analysis.remainingBudget)} chi tiêu khả dụng cho phần còn lại của tháng.`}
                </p>
              </div>
            </div>
          </div>

          {/* Rule 50/30/20 Comparison */}
          <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-heading">
              <Lightbulb className="w-5 h-5 text-indigo-400" /> So Sánh Với Quy Tắc 50/30/20
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quy tắc 50/30/20 khuyến nghị phân bổ tài chính: 50% Thiết yếu, 30% Sở thích, 20% Tiết kiệm. 
              Dưới đây là tỷ lệ phân bổ thực tế dựa trên chi tiêu và tiết kiệm của bạn trong tháng này:
            </p>

            <div className="space-y-4 pt-2">
              {/* Needs bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Nhu cầu Thiết yếu (Mục tiêu 50%)</span>
                  <span className="text-slate-400">{analysis.needsPct}% ({formatVND(analysis.needs)})</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${analysis.needsPct}%` }}></div>
                </div>
              </div>

              {/* Wants bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Sở thích & Mong muốn (Mục tiêu 30%)</span>
                  <span className="text-slate-400">{analysis.wantsPct}% ({formatVND(analysis.wants)})</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: `${analysis.wantsPct}%` }}></div>
                </div>
              </div>

              {/* Savings bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Tích lũy & Tiết kiệm (Mục tiêu 20%)</span>
                  <span className="text-slate-400">{analysis.savingsPct}% ({formatVND(analysis.savings)})</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${analysis.savingsPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: List of advice & recommendations */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col justify-between h-full space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-heading">
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" /> Gợi ý & Lời khuyên
            </h3>
            
            <div className="space-y-4">
              {activeTips.map((tip, i) => (
                <div key={i} className="flex gap-3 items-start border-b border-slate-900/50 pb-3 last:border-b-0 last:pb-0">
                  <div className="p-1 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20 p-5 rounded-2xl text-center">
            <PiggyBank className="w-8 h-8 text-purple-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-purple-200">Bắt đầu tích lũy sớm</h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              "Đừng tiết kiệm những gì còn lại sau khi chi tiêu, mà hãy chi tiêu những gì còn lại sau khi tiết kiệm." - Warren Buffett
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
