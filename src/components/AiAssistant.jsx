import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, MessageSquare, Send, Bot, AlertTriangle, KeyRound, 
  ArrowRight, HelpCircle, User, Activity, CheckCircle, RefreshCw, 
  ShieldAlert, Sparkle, Heart, ListTodo, FileText, Info
} from 'lucide-react';
import { formatVND, getCategories } from '../utils/storage';

export default function AiAssistant({ 
  transactions, 
  budget, 
  savingsPots, 
  activeUser, 
  geminiKey,
  onNavigate 
}) {
  // Mobile tab navigation state: 'chat' or 'audit'
  const [assistantView, setAssistantView] = useState('chat');

  // Chatbot State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState('gemini-1.5-flash');
  const messagesEndRef = useRef(null);

  // Financial Auditor State
  const [auditResult, setAuditResult] = useState(() => {
    const saved = localStorage.getItem(`fintrack_audit_result_${activeUser}`);
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // Dynamically detect supported models for the API key
  useEffect(() => {
    if (!geminiKey) return;
    
    const detectModel = async () => {
      try {
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`;
        const response = await fetch(listUrl);
        const data = await response.json();
        
        if (response.ok && data.models) {
          const modelNames = data.models.map(m => m.name.replace('models/', ''));
          const flashModel = modelNames.find(name => name.includes('flash')) || modelNames[0];
          if (flashModel) {
            setActiveModel(flashModel);
            console.log('Dynamic model selected:', flashModel);
          }
        }
      } catch (err) {
        console.error('Error auto-detecting model:', err);
      }
    };

    detectModel();
  }, [geminiKey]);

  // Auditor Loading steps simulation
  useEffect(() => {
    if (!isAuditing) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, [isAuditing]);

  const loadingMessages = [
    "Đang quét toàn bộ danh sách giao dịch tháng này...",
    "Đang đối soát thực tế thu chi so với hạn mức ngân sách...",
    "Đang đánh giá hiệu suất hoàn thành các quỹ tiết kiệm...",
    "Đang lập biểu đồ và đề xuất giải pháp tiết kiệm tối ưu..."
  ];

  const initialGreeting = {
    id: 'init',
    role: 'model',
    text: `Xin chào **${activeUser}**! Tôi là **AnhTuanAI** - Trợ lý phân tích tài chính cá nhân của bạn. 
    
Tôi đã đọc dữ liệu chi tiêu thực tế của bạn tại AnhTuan. Tôi có thể giúp bạn:
- Phân tích và đánh giá xem bạn có đang tiêu xài lãng phí hay không.
- Tổng hợp các danh mục ngốn tiền nhiều nhất tháng này.
- Lên kế hoạch và đưa ra lộ trình tiết kiệm tối ưu để bạn nhanh chóng đạt mục tiêu.

👉 Bạn cũng có thể sử dụng công cụ **"Kiểm toán tài chính 1-Click"** ở bên cạnh để nhận báo cáo phân tích toàn diện và thang điểm sức khỏe tài chính tức thì!`,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  };

  // Initialize chat messages
  useEffect(() => {
    setMessages([initialGreeting]);
  }, [activeUser]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Quick Questions
  const quickPrompts = [
    { text: 'Tháng này tôi chi tiêu thế nào?', label: 'Phân tích thu chi' },
    { text: 'Tôi tiêu tiền có lãng phí không?', label: 'Đánh giá lãng phí' },
    { text: 'Đề xuất lộ trình hoàn thành mục tiêu tiết kiệm', label: 'Tối ưu tiết kiệm' },
    { text: 'Tóm tắt tài chính ngắn gọn của tôi', label: 'Tóm tắt dòng tiền' }
  ];

  // Helper to parse simple markdown to HTML safely
  const renderMessageText = (text) => {
    if (!text) return '';
    
    // Bold text (**bold**)
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-300 font-bold">$1</strong>');
    
    // List items starting with '-'
    html = html.replace(/^\s*-\s+(.*?)$/gm, '<li class="ml-4 list-disc pl-1">$1</li>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br />');
    
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  // Chat message submission
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    if (!textToSend) {
      setInputText('');
    }

    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const finalCategories = getCategories();
      const contextData = `
        DỮ LIỆU TÀI CHÍNH HIỆN TẠI CỦA NGƯỜI DÙNG:
        - Tên tài khoản: ${activeUser}
        - Ngân sách tháng hiện tại:
          + Mục tiêu thu nhập (Tiền vào tối thiểu): ${budget.monthlyIncomeTarget} VND
          + Giới hạn chi tiêu (Tiền ra tối đa): ${budget.monthlyExpenseLimit} VND
        - Các quỹ tiết kiệm hiện tại:
          ${savingsPots.map(p => `- Quỹ "${p.name}": Đã có ${p.currentAmount} VND trên tổng mục tiêu ${p.targetAmount} VND (Đạt ${Math.min(100, Math.round(p.currentAmount / p.targetAmount * 100))}%). Hạn chót: ${p.targetDate || 'Không giới hạn'}`).join('\n')}
        - Lịch sử 40 giao dịch gần đây nhất:
          ${transactions.slice(0, 40).map(t => `- Ngày: ${t.date} | Loại: ${t.type === 'income' ? 'Thu nhập (+)' : 'Chi tiêu (-)'} | Danh mục: ${t.category} | Số tiền: ${t.amount} VND | Ghi chú: ${t.note || 'Không có'}`).join('\n')}
        - Tất cả danh mục Thu/Chi đang có trong hệ thống:
          + Danh mục thu: ${finalCategories.income.join(', ')}
          + Danh mục chi: ${finalCategories.expense.join(', ')}
      `;

      const historyMessages = messages.filter(m => m.id !== 'init');
      const contents = [
        ...historyMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        {
          role: 'user',
          parts: [{ text: query }]
        }
      ];

      const systemInstruction = {
        parts: [{ text: `
          Bạn tên là AnhTuanAI - Trợ lý tư vấn tài chính cá nhân.
          Nhiệm vụ của bạn là hỗ trợ phân tích dữ liệu tài chính của người dùng dựa trên thông tin thực tế được cung cấp bên dưới.

          Dữ liệu tài chính hiện tại của người dùng:
          ${contextData}

          QUY TẮC BẮT BUỘC TUÂN THỦ:
          1. Bạn CHỈ được phép trả lời các câu hỏi liên quan đến tài chính cá nhân, phân tích thu chi, quản lý tiền bạc, lập kế hoạch ngân sách hoặc tiết kiệm của người dùng.
          2. Với bất kỳ câu hỏi nào ngoài phạm vi này, bạn phải từ chối lịch sự bằng tiếng Việt.
          3. Hãy đưa ra các con số phân tích thực tế từ dữ liệu giao dịch của người dùng.
          4. Trả lời bằng tiếng Việt, ngắn gọn, súc tích, định dạng markdown đẹp mắt (in đậm các từ khóa quan trọng và dùng dấu gạch đầu dòng cho danh sách).
        ` }]
      };

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${geminiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: contents,
          systemInstruction: systemInstruction
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Lỗi kết nối API Gemini');
      }

      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có câu trả lời nào từ hệ thống AI.';

      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'model',
        text: `🔴 **Lỗi kết nối:** Không thể gửi câu hỏi đến AI. Vui lòng kiểm tra lại khóa API Gemini trong phần cài đặt hoặc kết nối mạng của bạn.\n\nChi tiết lỗi: *${err.message}*`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run 1-Click Financial Audit
  const handleRunAudit = async () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditError(null);

    try {
      const finalCategories = getCategories();
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      const monthTxs = transactions.filter(t => t.date.startsWith(currentMonth));
      
      const monthlyIncome = monthTxs.filter(t => t.type === 'income' && !t.excludeFromStats).reduce((sum, t) => sum + t.amount, 0);
      const monthlyExpense = monthTxs.filter(t => t.type === 'expense' && !t.excludeFromStats).reduce((sum, t) => sum + t.amount, 0);
      
      const totalSavings = savingsPots.reduce((sum, p) => sum + p.currentAmount, 0);

      const contextData = `
        DỮ LIỆU TÀI CHÍNH THÁNG NÀY (${currentMonth}) CỦA NGƯỜI DÙNG:
        - Tên tài khoản: ${activeUser}
        - Hạn mức ngân sách tháng này:
          + Mục tiêu thu nhập: ${budget.monthlyIncomeTarget} VND
          + Giới hạn chi tiêu: ${budget.monthlyExpenseLimit} VND
        - Thực tế thu nhập tháng này: ${monthlyIncome} VND
        - Thực tế chi tiêu tháng này: ${monthlyExpense} VND
        - Tổng tích lũy trong các quỹ tiết kiệm: ${totalSavings} VND
        
        - Các quỹ tiết kiệm chi tiết:
          ${savingsPots.map(p => `- Quỹ "${p.name}": Đã có ${p.currentAmount} VND / mục tiêu ${p.targetAmount} VND (Đạt ${Math.min(100, Math.round(p.currentAmount / p.targetAmount * 100))}%). Hạn chót: ${p.targetDate || 'Không giới hạn'}`).join('\n')}
        
        - Lịch sử giao dịch chi tiết trong tháng này (${monthTxs.length} giao dịch):
          ${monthTxs.map(t => `- Ngày: ${t.date} | Loại: ${t.type === 'income' ? 'Thu nhập (+)' : 'Chi tiêu (-)'} | Danh mục: ${t.category} | Số tiền: ${t.amount} VND | Ghi chú: ${t.note || 'Không có'}`).join('\n')}
      `;

      const systemInstruction = `
        Bạn là chuyên gia kiểm toán tài chính cá nhân AnhTuanAI.
        Nhiệm vụ của bạn là phân tích dữ liệu tài chính người dùng cung cấp và trả về một báo cáo kiểm toán tài chính chính xác, sâu sắc.
        Báo cáo của bạn BẮT BUỘC phải ở định dạng JSON duy nhất và không chứa thêm bất kỳ văn bản nào khác bên ngoài JSON.
        Cấu trúc JSON bắt buộc phải như sau:
        {
          "score": <số nguyên từ 0 đến 100 đại diện cho điểm sức khỏe tài chính của người dùng dựa trên thu chi và tiết kiệm của họ>,
          "status": "<Tuyệt vời | Khá tốt | Cần chú ý | Báo động>",
          "summary": "<Tóm tắt ngắn gọn tình trạng tài chính trong tháng của họ, nêu rõ ưu điểm và nhược điểm hiện tại>",
          "warnings": [
            "<Cảnh báo chi tiết thứ nhất, ví dụ: 'Chi tiêu ăn uống đã vượt 15% hạn mức.'>",
            "<Cảnh báo thứ hai, hoặc ghi 'Không có cảnh báo đặc biệt nào' nếu tình hình rất tốt>",
            ...
          ],
          "recommendations": [
            "<Hành động cụ thể thứ nhất để cải thiện tài chính, ví dụ: 'Cắt giảm 20% chi phí ăn ngoài.'>",
            "<Hành động cụ thể thứ hai...>",
            ...
          ]
        }
      `;

      const contents = [
        {
          role: 'user',
          parts: [{ text: `Hãy thực hiện kiểm toán tài chính dựa trên dữ liệu sau đây:\n${contextData}` }]
        }
      ];

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${geminiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: contents,
          systemInstruction: { parts: [{ text: systemInstruction }] }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Lỗi kết nối API Gemini');
      }

      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Clean code fences if AI returned them
      let cleanText = replyText.trim();
      if (cleanText.includes('```')) {
        cleanText = cleanText.replace(/```json/gi, '').replace(/```/g, '').trim();
      }

      try {
        const parsed = JSON.parse(cleanText);
        
        const finalResult = {
          ...parsed,
          timestamp: new Date().toLocaleString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        };

        setAuditResult(finalResult);
        localStorage.setItem(`fintrack_audit_result_${activeUser}`, JSON.stringify(finalResult));
      } catch (jsonErr) {
        console.error('Failed to parse AI JSON. Raw reply:', replyText);
        // Fallback if parsing fails
        const fallbackResult = {
          score: 65,
          status: 'Cần chú ý',
          summary: 'Báo cáo từ AI không đúng định dạng bảng dữ liệu. Dưới đây là nội dung phân tích dạng thô.',
          warnings: [replyText],
          recommendations: ['Vui lòng bấm chạy lại kiểm toán để nhận phân tích chi tiết chuẩn hóa.'],
          timestamp: new Date().toLocaleString('vi-VN')
        };
        setAuditResult(fallbackResult);
        localStorage.setItem(`fintrack_audit_result_${activeUser}`, JSON.stringify(fallbackResult));
      }

    } catch (err) {
      console.error(err);
      setAuditError(err.message);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // If no API Key configured, display key required instruction
  if (!geminiKey) {
    return (
      <div className="glass-panel p-8 rounded-3xl shadow-2xl max-w-xl mx-auto text-center space-y-6 mt-12 border border-purple-500/15 animate-slide-up">
        <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-655 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg animate-float">
          <KeyRound className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-100 font-heading">Yêu Cầu Cài Đặt Khóa API Gemini</h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Trang **Trợ lý AI** yêu cầu cấu hình khóa API Gemini để hoạt động. Khóa API của bạn sẽ được bảo mật offline hoàn toàn trên thiết bị này.
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-left space-y-2.5">
          <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-indigo-400" /> Cách lấy khóa API Gemini miễn phí:
          </h4>
          <ol className="text-xs text-slate-400 space-y-2 list-decimal pl-4">
            <li>Truy cập <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline font-semibold hover:text-purple-300">Google AI Studio</a> và đăng nhập bằng tài khoản Google.</li>
            <li>Bấm chọn nút **"Get API Key"** màu xanh dung.</li>
            <li>Chọn **"Create API Key"** và sao chép khóa (bắt đầu bằng `AIzaSy...`).</li>
            <li>Quay lại AnhTuan, vào **Cài đặt & Bảo mật** &rarr; **Tài khoản & Bảo mật** để dán khóa này.</li>
          </ol>
        </div>

        <button
          onClick={() => onNavigate('budget')}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-550 hover:to-indigo-600 text-white font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 cursor-pointer btn-click-effect shimmer-btn border border-purple-500/20 text-sm"
        >
          <span>Đi đến Cài đặt để cấu hình khóa</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Get score colors
  const getScoreColor = (score) => {
    if (score >= 80) return { stroke: 'stroke-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (score >= 60) return { stroke: 'stroke-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    return { stroke: 'stroke-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
  };

  const scoreColors = auditResult ? getScoreColor(auditResult.score) : getScoreColor(0);
  const scoreRadius = 50;
  const scoreCircumference = 2 * Math.PI * scoreRadius;
  const scoreStrokeDashoffset = auditResult 
    ? scoreCircumference - (auditResult.score / 100) * scoreCircumference
    : scoreCircumference;

  return (
    <div className="flex flex-col space-y-4 md:space-y-0 h-full">
      {/* Tab bar header switcher on mobile */}
      <div className="md:hidden flex p-1 bg-slate-900 border border-slate-800 rounded-xl mb-3 gap-1">
        <button 
          onClick={() => setAssistantView('chat')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
            assistantView === 'chat' 
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-[0_0_10px_-2px_rgba(168,85,247,0.3)]' 
              : 'text-slate-400'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            <span>Trò chuyện AI</span>
          </div>
        </button>
        <button 
          onClick={() => setAssistantView('audit')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
            assistantView === 'audit' 
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-[0_0_10px_-2px_rgba(168,85,247,0.3)]' 
              : 'text-slate-400'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Kiểm toán 1-Click</span>
          </div>
        </button>
      </div>

      {/* Main Grid: Chat Left (3 cols), Auditor Right (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-175px)] md:h-[calc(100vh-100px)] overflow-hidden items-stretch">
        
        {/* ================= LEFT COLUMN: Chat Assistant ================= */}
        <div className={`lg:col-span-3 glass-panel rounded-3xl border border-purple-500/15 flex flex-col overflow-hidden relative h-full ${
          assistantView === 'chat' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Chat header */}
          <div className="p-4 border-b border-slate-900/60 bg-slate-950/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-650 rounded-xl flex items-center justify-center text-white shadow-md animate-float">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-100 text-sm font-heading">Trợ lý Tài chính AnhTuanAI</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-semibold">Gemini 1.5 Flash</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Đang hoạt động • Chế độ bảo mật offline</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm('Bạn có muốn xóa sạch cuộc hội thoại này không?')) {
                  setMessages([initialGreeting]);
                }
              }}
              className="text-xs text-slate-500 hover:text-slate-350 bg-slate-950 border border-slate-900 px-3 py-1.5 rounded-lg hover:border-slate-800 transition cursor-pointer"
            >
              Xóa chat
            </button>
          </div>

          {/* Message list area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-950/10 scrollbar-thin">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white ${
                    isUser 
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20' 
                      : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Chat bubble */}
                  <div className="space-y-1">
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser 
                        ? 'bg-gradient-to-r from-purple-650 to-indigo-650 text-white rounded-tr-none glow-purple' 
                        : 'glass-card border border-slate-850/50 text-slate-200 rounded-tl-none hover:border-slate-800'
                    }`}>
                      {renderMessageText(m.text)}
                    </div>
                    <span className={`text-[9px] text-slate-500 block ${isUser ? 'text-right' : ''}`}>{m.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 mr-auto max-w-[75%] animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="space-y-2">
                  <div className="p-3.5 rounded-2xl glass-card text-xs text-slate-400 rounded-tl-none border border-slate-850/50 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    <span>AnhTuanAI đang suy nghĩ và phân tích dữ liệu...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts area */}
          {messages.length === 1 && !isLoading && (
            <div className="p-4 border-t border-slate-900/40 bg-slate-950/20 space-y-2">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block ml-1">Đề xuất câu hỏi nhanh:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {quickPrompts.map((qp, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(qp.text)}
                    className="text-left px-3 py-2 rounded-xl glass-card border border-slate-900 hover:border-purple-500/20 text-slate-300 hover:text-purple-400 text-xs font-semibold flex items-center gap-2 transition cursor-pointer btn-click-effect"
                  >
                    <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                    <span>{qp.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message input panel */}
          <div className="p-4 border-t border-slate-900/60 bg-slate-950/30 flex gap-2">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi về chi tiêu, ngân sách, tiết kiệm của bạn..."
              className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs font-medium resize-none max-h-24 scrollbar-none"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="p-3.5 rounded-xl bg-purple-600 hover:bg-purple-550 text-white font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center shadow-lg shadow-purple-500/10 border border-purple-500/20 btn-click-effect"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: AI Auditor ================= */}
        <div className={`lg:col-span-2 glass-panel rounded-3xl border border-purple-500/15 flex flex-col overflow-hidden relative h-full ${
          assistantView === 'audit' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-900/60 bg-slate-950/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm font-heading">Kiểm Toán Tài Chính 1-Click</h3>
                <span className="text-[10px] text-slate-500 block">Đánh giá sức khỏe tài chính tháng</span>
              </div>
            </div>

            {auditResult && !isAuditing && (
              <button
                onClick={handleRunAudit}
                className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:text-purple-400 transition cursor-pointer text-slate-400 btn-click-effect"
                title="Chạy lại kiểm toán"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Audit Body Content */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 bg-slate-950/5 scrollbar-thin">
            
            {/* Case 1: Currently Auditing */}
            {isAuditing && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 border-4 border-purple-500/10 border-t-purple-500 rounded-full animate-spin"></div>
                  <Sparkles className="w-7 h-7 text-purple-400 absolute animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white">AnhTuanAI đang phân tích tài chính...</h4>
                  <p className="text-xs text-purple-400 font-semibold animate-pulse">{loadingMessages[loadingStep]}</p>
                  <p className="text-[10px] text-slate-500">Quá trình này có thể mất vài giây. Vui lòng giữ mạng ổn định.</p>
                </div>
              </div>
            )}

            {/* Case 2: Error occurred */}
            {auditError && !isAuditing && (
              <div className="glass-panel p-6 border-rose-500/20 bg-rose-950/5 text-center space-y-4 rounded-2xl">
                <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-rose-350">Lỗi Kiểm Toán Tài Chính</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{auditError}</p>
                </div>
                <button
                  onClick={handleRunAudit}
                  className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/30 text-rose-300 border border-rose-900/40 rounded-xl text-xs font-bold transition cursor-pointer btn-click-effect"
                >
                  Thử lại ngay
                </button>
              </div>
            )}

            {/* Case 3: Initial Empty State */}
            {!auditResult && !isAuditing && !auditError && (
              <div className="flex flex-col items-center justify-center text-center space-y-6 py-10 h-full">
                <div className="w-16 h-16 rounded-2xl bg-purple-650/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-md">
                  <Sparkle className="w-8 h-8 animate-float" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <h4 className="text-sm font-bold text-slate-200">Báo Cáo Sức Khỏe Tài Chính</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Hệ thống sẽ tổng hợp toàn bộ các ca thu chi, hạn mức ngân sách và tiến độ tiết kiệm để chấm điểm tài chính và đưa ra lời khuyên thực tế nhất.
                  </p>
                </div>
                <button
                  onClick={handleRunAudit}
                  className="w-full max-w-xs py-3 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-550 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl transition cursor-pointer btn-click-effect border border-purple-500/20 shadow-lg shadow-purple-500/10 shimmer-btn"
                >
                  🎯 Bắt đầu kiểm toán tài chính
                </button>
              </div>
            )}

            {/* Case 4: Display Audit Report */}
            {auditResult && !isAuditing && !auditError && (
              <div className="space-y-6">
                {/* Gauge Score Circle */}
                <div className="glass-card p-5 rounded-2xl border border-slate-850 flex flex-col items-center text-center">
                  <div className="relative flex items-center justify-center select-none">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r={scoreRadius}
                        className="stroke-slate-900/60 fill-transparent"
                        strokeWidth={scoreStroke}
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r={scoreRadius}
                        className={`fill-transparent transition-all duration-500 ${scoreColors.stroke}`}
                        strokeWidth={scoreStroke}
                        strokeDasharray={scoreCircumference}
                        strokeDashoffset={scoreStrokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-white drop-shadow">{auditResult.score}</span>
                      <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Health Score</span>
                    </div>
                  </div>

                  <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full mt-4 border ${scoreColors.text} ${scoreColors.bg} ${scoreColors.border}`}>
                    Tình trạng: {auditResult.status}
                  </span>
                </div>

                {/* AI Summary Card */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-purple-400" />
                    <span>Đánh giá tổng quan</span>
                  </h4>
                  <div className="glass-card p-4 rounded-xl border border-slate-850 bg-slate-950/20 text-xs text-slate-300 leading-relaxed font-medium">
                    {auditResult.summary}
                  </div>
                </div>

                {/* Warnings Section */}
                {auditResult.warnings && auditResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Cảnh báo & Lãng phí ({auditResult.warnings.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {auditResult.warnings.map((warn, i) => (
                        <div 
                          key={i} 
                          className="flex gap-2.5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs text-slate-300 items-start"
                        >
                          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                          <span className="font-semibold text-slate-350">{warn}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations Section */}
                {auditResult.recommendations && auditResult.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ListTodo className="w-3.5 h-3.5" />
                      <span>Hành động đề xuất ({auditResult.recommendations.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {auditResult.recommendations.map((rec, i) => (
                        <div 
                          key={i} 
                          className="flex gap-2.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-slate-300 items-start"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="font-semibold text-slate-350">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Audit Timestamp / Info footer */}
                <div className="text-center pt-2">
                  <span className="text-[9px] text-slate-500 block">Thời gian kiểm toán gần nhất:</span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold block mt-0.5">{auditResult.timestamp}</span>
                </div>
              </div>
            )}

          </div>

          {/* Footer Auditing Action bottom banner */}
          {auditResult && !isAuditing && !auditError && (
            <div className="p-4 border-t border-slate-900/60 bg-slate-950/20 text-center">
              <button
                onClick={handleRunAudit}
                className="w-full py-2.5 bg-purple-650 hover:bg-purple-600 text-white font-bold text-xs rounded-xl border border-purple-500/10 transition cursor-pointer btn-click-effect flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Chạy kiểm toán tài chính mới</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
const scoreStroke = 6;
