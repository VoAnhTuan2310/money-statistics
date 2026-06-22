import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, Send, Bot, AlertTriangle, KeyRound, ArrowRight, HelpCircle, User } from 'lucide-react';
import { formatVND, getCategories } from '../utils/storage';

export default function AiAssistant({ 
  transactions, 
  budget, 
  savingsPots, 
  activeUser, 
  geminiKey,
  onNavigate 
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState('gemini-1.5-flash');
  const messagesEndRef = useRef(null);

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
          // Prefer standard flash models, fallback to the first model in the list
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

  const initialGreeting = {
    id: 'init',
    role: 'model',
    text: `Xin chào **${activeUser}**! Tôi là **AnhTuanAI** - Trợ lý phân tích tài chính cá nhân của bạn. 

Tôi đã đọc dữ liệu chi tiêu thực tế của bạn tại AnhTuan. Tôi có thể giúp bạn:
- Phân tích và đánh giá xem bạn có đang tiêu xài lãng phí hay không.
- Tổng hợp các danh mục ngốn tiền nhiều nhất tháng này.
- Lên kế hoạch và đưa ra lộ trình tiết kiệm tối ưu để bạn nhanh chóng đạt mục tiêu.

*Lưu ý: Tôi được thiết lập để chỉ trả lời các câu hỏi về tài chính cá nhân của bạn và sẽ từ chối các câu hỏi ngoài lề (như thời tiết, viết code).*`,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  };

  // Initialize chat messages
  useEffect(() => {
    setMessages([initialGreeting]);
  }, [activeUser]);

  // Scroll to bottom when messages change
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

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    if (!textToSend) {
      setInputText('');
    }

    // Add user message
    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 1. Gather context data
      const finalCategories = getCategories();
      const contextData = `
        DỮ LIỆU TÀI CHÍNH HIỆN TẠI CỦA NGƯỜI DÙNG:
        - Tên tài khoản: ${activeUser}
        - Ngân sách tháng hiện tại:
          + Mục tiêu thu nhập (Tiền vào tối thiểu): ${budget.monthlyIncomeTarget} VND
          + Giới hạn chi tiêu tối đa (Tiền ra tối đa): ${budget.monthlyExpenseLimit} VND
        - Các quỹ tiết kiệm hiện tại:
          ${savingsPots.map(p => `- Quỹ "${p.name}": Đã có ${p.currentAmount} VND trên tổng mục tiêu ${p.targetAmount} VND (Đạt ${Math.min(100, Math.round(p.currentAmount / p.targetAmount * 100))}%). Hạn chót: ${p.targetDate || 'Không giới hạn'}`).join('\n')}
        - Lịch sử 40 giao dịch gần đây nhất:
          ${transactions.slice(0, 40).map(t => `- Ngày: ${t.date} | Loại: ${t.type === 'income' ? 'Thu nhập (+)' : 'Chi tiêu (-)'} | Danh mục: ${t.category} | Số tiền: ${t.amount} VND | Ghi chú: ${t.note || 'Không có'}`).join('\n')}
        - Tất cả danh mục Thu/Chi đang có trong hệ thống:
          + Danh mục thu: ${finalCategories.income.join(', ')}
          + Danh mục chi: ${finalCategories.expense.join(', ')}
      `;

      // 2. Format history for Gemini (strict alternation of user and model, starting with user)
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

      // 3. System Instructions constraint
      const systemInstruction = {
        parts: [{ text: `
          Bạn tên là AnhTuanAI - Trợ lý tư vấn tài chính cá nhân.
          Nhiệm vụ của bạn là hỗ trợ phân tích dữ liệu tài chính của người dùng dựa trên thông tin thực tế được cung cấp bên dưới.

          Dữ liệu tài chính hiện tại của người dùng:
          ${contextData}

          QUY TẮC BẮT BUỘC TUÂN THỦ:
          1. Bạn CHỈ được phép trả lời các câu hỏi liên quan đến tài chính cá nhân, phân tích thu chi, quản lý tiền bạc, lập kế hoạch ngân sách hoặc tiết kiệm của người dùng.
          2. Với bất kỳ câu hỏi nào ngoài phạm vi này (ví dụ: thời tiết thế nào, công thức nấu ăn, viết mã lập trình, giải toán học, câu hỏi khoa học/xã hội chung...), bạn TUYỆT ĐỐI KHÔNG trả lời nội dung của họ, mà phải từ chối lịch sự bằng tiếng Việt: 
             "Tôi là trợ lý tài chính AnhTuanAI. Tôi chỉ có thể giúp bạn phân tích số liệu tài chính và quản lý chi tiêu. Vui lòng đặt câu hỏi liên quan đến tài chính!"
          3. Hãy đưa ra các con số phân tích thực tế từ dữ liệu giao dịch của người dùng. Ví dụ: chỉ ra danh mục họ tiêu nhiều nhất, số tiền đã chi so với hạn mức ngân sách, cảnh báo nếu vượt hạn mức.
          4. Trả lời bằng tiếng Việt, ngắn gọn, súc tích, định dạng markdown đẹp mắt (in đậm các từ khóa quan trọng và dùng dấu gạch đầu dòng cho danh sách).
        ` }]
      };

      // 4. API Request to Gemini
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
        <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-650 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg animate-float">
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
            <li>Bấm chọn nút **"Get API Key"** màu xanh dương.</li>
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

  return (
    <div className="glass-panel rounded-3xl shadow-2xl border border-purple-500/15 flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] overflow-hidden animate-slide-up relative">
      
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
                <span className={`text-[9px] text-slate-550 block ${isUser ? 'text-right' : ''}`}>{m.timestamp}</span>
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
  );
}
