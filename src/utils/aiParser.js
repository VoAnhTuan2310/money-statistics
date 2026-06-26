/**
 * UTILITY FOR PARSING NATURAL LANGUAGE TRANSACTION DESCRIPTIONS
 * Supports both Gemini API (if key is provided) and local regex rules.
 */

// Helper to get local YYYY-MM-DD date string (timezone-safe)
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Regex-based offline transaction parser
export function parseTransactionLocally(text, wallets = [], categories = { income: [], expense: [] }) {
  const cleanText = text.toLowerCase().trim();
  const today = new Date();
  const todayStr = getLocalDateString(today);
  
  // 1. Determine transaction type (income vs expense)
  let type = 'expense';
  const incomeKeywords = [
    'nhận', 'thu', 'lương', 'thưởng', 'được cho', 'được tặng', 'lời', 
    'cộng', 'bo', 'tip', 'bán', 'income', 'hoàn tiền'
  ];
  if (incomeKeywords.some(kw => cleanText.includes(kw))) {
    type = 'income';
  }
  
  // 2. Extract Amount
  // Match forms like 100k, 1.5tr, 100.000, 100000, 1 triệu, etc.
  let amount = 0;
  const amountMatch = cleanText.match(/(\d+[\d.,]*)\s*(k|tr|triệu|trieu|ngàn|ngan|nghìn|nghin|đ|d|vnd)/i);
  
  if (amountMatch) {
    let numStr = amountMatch[1].replace(/,/g, '').replace(/\./g, '');
    let num = parseFloat(numStr);
    let unit = amountMatch[2].toLowerCase();
    
    if (unit === 'k') {
      amount = num * 1000;
    } else if (unit === 'tr' || unit === 'triệu' || unit === 'trieu') {
      amount = num * 1000000;
    } else if (unit === 'ngàn' || unit === 'ngan' || unit === 'nghìn' || unit === 'nghin') {
      amount = num * 1000;
    } else {
      amount = num;
    }
  } else {
    // Look for any raw numbers
    const plainNumberMatch = cleanText.match(/\b\d+[\d.,]*\b/);
    if (plainNumberMatch) {
      let numStr = plainNumberMatch[0].replace(/,/g, '').replace(/\./g, '');
      amount = parseFloat(numStr);
      // If it's a small number like 50, 100, assume it's in thousands (k)
      if (amount > 0 && amount < 1000) {
        amount = amount * 1000;
      }
    }
  }

  // 3. Match Wallet
  let walletId = wallets[0]?.id || '';
  let foundWallet = false;
  
  // Try exact match in name
  for (const w of wallets) {
    const wName = w.name.toLowerCase();
    if (cleanText.includes(wName)) {
      walletId = w.id;
      foundWallet = true;
      break;
    }
  }
  
  // Synonyms and type match
  if (!foundWallet) {
    if (cleanText.includes('tiền mặt') || cleanText.includes('ví mặt') || cleanText.includes('trong ví') || cleanText.includes('tiền túi')) {
      const cashW = wallets.find(w => w.type === 'cash' || w.name.toLowerCase().includes('tiền mặt'));
      if (cashW) walletId = cashW.id;
    } else if (
      cleanText.includes('tài khoản') || cleanText.includes('ngân hàng') || 
      cleanText.includes('bank') || cleanText.includes('chuyển khoản') || 
      cleanText.includes('atm') || cleanText.includes('momo') || cleanText.includes('ck') ||
      cleanText.includes('bidv') || cleanText.includes('vcb') || cleanText.includes('tcb')
    ) {
      const bankW = wallets.find(w => w.type === 'bank' || w.name.toLowerCase().includes('tài khoản') || w.name.toLowerCase().includes('ngân hàng') || w.name.toLowerCase().includes('bidv') || w.name.toLowerCase().includes('vcb'));
      if (bankW) walletId = bankW.id;
    }
  }

  // 4. Match Category
  const incomeCats = categories.income || [];
  const expenseCats = categories.expense || [];
  const activeCats = type === 'income' ? incomeCats : expenseCats;
  
  let category = activeCats[0] || 'Khác';
  let foundCategory = false;
  
  // Direct matching
  for (const cat of activeCats) {
    if (cleanText.includes(cat.toLowerCase())) {
      category = cat;
      foundCategory = true;
      break;
    }
  }
  
  // Keywords match
  if (!foundCategory) {
    if (type === 'expense') {
      const eatKeywords = ['ăn', 'uống', 'cafe', 'phở', 'bún', 'cơm', 'trà sữa', 'bánh', 'kẹo', 'nhậu', 'nhà hàng', 'food'];
      const moveKeywords = ['xăng', 'xe', 'grab', 'taxi', 'đi lại', 'phí xe', 'ship', 'vận chuyển', 'shopeefood'];
      const shopKeywords = ['mua', 'sắm', 'quần áo', 'giày', 'túi', 'shopee', 'lazada', 'tiki', 'siêu thị'];
      const houseKeywords = ['điện', 'nước', 'wifi', 'hóa đơn', 'nhà', 'phòng', 'trọ'];
      
      if (eatKeywords.some(kw => cleanText.includes(kw))) {
        const eatCat = expenseCats.find(c => c.toLowerCase().includes('ăn') || c.toLowerCase().includes('uống') || c.toLowerCase().includes('thực phẩm'));
        if (eatCat) category = eatCat;
      } else if (moveKeywords.some(kw => cleanText.includes(kw))) {
        const moveCat = expenseCats.find(c => c.toLowerCase().includes('di chuyển') || c.toLowerCase().includes('xe') || c.toLowerCase().includes('đi lại'));
        if (moveCat) category = moveCat;
      } else if (shopKeywords.some(kw => cleanText.includes(kw))) {
        const shopCat = expenseCats.find(c => c.toLowerCase().includes('mua sắm') || c.toLowerCase().includes('sắm'));
        if (shopCat) category = shopCat;
      } else if (houseKeywords.some(kw => cleanText.includes(kw))) {
        const houseCat = expenseCats.find(c => c.toLowerCase().includes('nhà') || c.toLowerCase().includes('hóa đơn') || c.toLowerCase().includes('điện'));
        if (houseCat) category = houseCat;
      }
    } else {
      // Income defaults
      const salaryKeywords = ['lương', 'công ty', 'company', 'salary'];
      const businessKeywords = ['kinh doanh', 'bán hàng', 'khách', 'shopeefood', 'chạy', 'ship'];
      
      if (salaryKeywords.some(kw => cleanText.includes(kw))) {
        const salCat = incomeCats.find(c => c.toLowerCase().includes('lương') || c.toLowerCase().includes('thưởng'));
        if (salCat) category = salCat;
      } else if (businessKeywords.some(kw => cleanText.includes(kw))) {
        const bizCat = incomeCats.find(c => c.toLowerCase().includes('doanh') || c.toLowerCase().includes('bán') || c.toLowerCase().includes('khác'));
        if (bizCat) category = bizCat;
      }
    }
  }

  // 5. Generate Note
  let note = text;
  // Capitalize first letter
  if (note) {
    note = note.charAt(0).toUpperCase() + note.slice(1);
  }

  // 6. Handle Date
  let date = todayStr;
  if (cleanText.includes('hôm qua') || cleanText.includes('hôm trươc') || cleanText.includes('hôm trước')) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    date = getLocalDateString(yesterday);
  } else if (cleanText.includes('ngày kia') || cleanText.includes('hôm kia')) {
    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 2);
    date = getLocalDateString(dayBefore);
  } else if (cleanText.includes('ngày mai')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    date = getLocalDateString(tomorrow);
  }

  // 7. Exclude From Stats
  let excludeFromStats = false;
  if (cleanText.includes('không thống kê') || cleanText.includes('loại trừ') || cleanText.includes('không tính')) {
    excludeFromStats = true;
  }

  return {
    type,
    amount,
    walletId,
    category,
    note,
    date,
    excludeFromStats,
    isLocal: true
  };
}

// Advanced Gemini API natural language parser
export async function parseTransactionWithAI(text, wallets = [], categories = { income: [], expense: [] }, geminiKey) {
  if (!geminiKey) {
    return parseTransactionLocally(text, wallets, categories);
  }

  try {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 2);

    const todayStr = getLocalDateString(today);
    const yesterdayStr = getLocalDateString(yesterday);
    const dayBeforeStr = getLocalDateString(dayBefore);

    const systemPrompt = `
Bạn là AI chuyên gia trích xuất dữ liệu tài chính từ câu nói tự nhiên tiếng Việt cho ứng dụng quản lý tài chính AnhTuan.
Nhiệm vụ của bạn là phân tích câu mô tả giao dịch của người dùng và trả về một đối tượng JSON duy nhất mô tả đầy đủ thông tin giao dịch.

DỮ LIỆU CẤU HÌNH CỦA NGƯỜI DÙNG:
- Danh sách ví/tài khoản khả dụng:
${wallets.map(w => `  * ID: "${w.id}" | Tên ví: "${w.name}" | Loại: "${w.type}"`).join('\n')}
- Danh mục Thu (income categories): ${categories.income.join(', ')}
- Danh mục Chi (expense categories): ${categories.expense.join(', ')}
- Ngày hôm nay: ${todayStr}

QUY TẮC TRÍCH XUẤT CỦA BẠN:
1. "type": Phải là "income" (tiền vào, lương, thưởng, bo, tip, bán đồ, được cho...) hoặc "expense" (tiền ra, mua sắm, trả tiền, đi ăn, mua xăng...).
2. "amount": Số tiền giao dịch chính là số nguyên.
   * LƯU Ý ĐẶC BIỆT: Nếu câu mô tả có số tiền chính và tiền bo phụ, ví dụ "chạy shopeefood nhận được 100k tiền mặt được khách bo 5k", hãy trích xuất số tiền chính 100000 VND và đưa thông tin bo vào "note". Số tiền giao dịch chính là 100000.
3. "walletId": ID ví phù hợp nhất từ danh sách ví được cung cấp. Khớp dựa trên tên hoặc loại ví (ví dụ: "tiền mặt" -> ví có tên "Tiền mặt" hoặc loại "cash", "bank"/"tài khoản"/"thẻ"/"bidv" -> ví ngân hàng). Nếu không thể khớp, hãy chọn ID ví đầu tiên trong danh sách ví của người dùng.
4. "category": Phải khớp hoặc gần giống nhất với một trong các danh mục có sẵn trong danh sách của người dùng ở trên. Nếu là Thu, chỉ chọn từ danh mục Thu. Nếu là Chi, chỉ chọn từ danh mục Chi.
5. "note": Ghi chú ngắn gọn, súc tích (ví dụ: "chạy shopeefood nhận được 100k tiền mặt được khách bo 5k" -> ghi chú là "Chạy shopeefood (khách bo 5k)"). Viết hoa chữ cái đầu.
6. "date": Định dạng YYYY-MM-DD. Hãy tính toán chính xác ngày:
   * Nếu có từ "hôm nay" -> dùng ngày "${todayStr}"
   * Nếu có từ "hôm qua" -> dùng ngày "${yesterdayStr}"
   * Nếu có từ "hôm kia" hoặc "ngày kia" -> dùng ngày "${dayBeforeStr}"
   * Mặc định là ngày hôm nay: "${todayStr}"
7. "excludeFromStats": Nhận giá trị true nếu người dùng yêu cầu loại trừ thống kê (ví dụ: "không thống kê", "loại trừ"), mặc định là false.

ĐỊNH DẠNG TRẢ VỀ:
Hãy chỉ trả về một đối tượng JSON duy nhất có cấu trúc sau:
{
  "type": "income" | "expense",
  "amount": number,
  "walletId": "string",
  "category": "string",
  "note": "string",
  "date": "YYYY-MM-DD",
  "excludeFromStats": boolean
}

LƯU Ý: CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG CHỨA BẤT KỲ CHỮ NÀO KHÁC NGOÀI JSON. KHÔNG BỌC TRONG BLOCK CODE \`\`\`json.
`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `Phân tích câu giao dịch này: "${text}"` }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API Error');
    }

    let replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON block between first '{' and last '}'
    const firstBrace = replyText.indexOf('{');
    const lastBrace = replyText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      replyText = replyText.substring(firstBrace, lastBrace + 1);
    }
    
    const parsed = JSON.parse(replyText);
    
    // Ensure safety defaults
    return {
      type: parsed.type || 'expense',
      amount: Number(parsed.amount) || 0,
      walletId: parsed.walletId || (wallets[0]?.id || ''),
      category: parsed.category || (parsed.type === 'income' ? categories.income[0] : categories.expense[0]),
      note: parsed.note || text,
      date: parsed.date || todayStr,
      excludeFromStats: !!parsed.excludeFromStats,
      isLocal: false
    };

  } catch (error) {
    console.error('Gemini AI Parsing error, falling back to local regex:', error);
    // Fallback to local parsing
    return parseTransactionLocally(text, wallets, categories);
  }
}

export function parseDescriptionAddressLocally(addressText) {
  const raw = addressText.trim();
  
  // Define keywords/prefixes for relative descriptions in lowercase
  const relativeKeywords = [
    'đối diện cổng', 'đối diện', 'kế bên', 'bên cạnh', 'cạnh', 
    'sát bên', 'sát', 'gần cổng', 'gần', 'phía trước', 'phía sau', 
    'đằng trước', 'đằng sau', 'trước cửa', 'trước', 'sau'
  ];
  
  // 1. Try to find relative text inside parentheses first, e.g. "120 Hoàng Diệu (đối diện quán cafe)"
  const parenRegex = /\(([^)]+)\)/;
  const parenMatch = raw.match(parenRegex);
  if (parenMatch) {
    const insideText = parenMatch[1].trim();
    const lowerInside = insideText.toLowerCase();
    if (relativeKeywords.some(kw => lowerInside.includes(kw))) {
      const cleanTarget = raw.replace(parenMatch[0], '').replace(/\s*,\s*$/, '').replace(/^\s*,\s*/, '').trim();
      return {
        routeTarget: cleanTarget.replace(/\s+/g, ' '),
        clue: insideText,
        explanation: `Hãy đi đến địa điểm: "${cleanTarget}" rồi tìm xung quanh theo mốc: "${insideText}"`
      };
    }
  }

  // 2. Try to split by common separators like comma or semicolon and check parts
  // E.g., "120/15 CMT8, đối diện quán cafe Highlands"
  const parts = raw.split(/[,;]\s*/);
  if (parts.length > 1) {
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      const lowerPart = part.toLowerCase();
      const matchedKeyword = relativeKeywords.find(kw => lowerPart.startsWith(kw));
      if (matchedKeyword) {
        const otherParts = parts.filter((_, idx) => idx !== i);
        const cleanTarget = otherParts.join(', ').trim();
        return {
          routeTarget: cleanTarget,
          clue: part,
          explanation: `Hãy đi đến địa điểm: "${cleanTarget}" rồi tìm xung quanh theo mốc: "${part}"`
        };
      }
    }
  }

  // 3. Regex for prefix matching if not split by commas, e.g. "đối diện cafe Highlands hẻm 120 Hoàng Diệu"
  const relationPattern = new RegExp(`^(${relativeKeywords.join('|')})\\s+(?:quán\\s+|tiệm\\s+|nhà\\s+|trường\\s+|cổng\\s+|cửa\\s+hàng\\s+|cafe\\s+|cà\\s+phê\\s+)?([a-zA-Z0-9\\sÀ-ỹ]+?)(?:\\s+(?:hẻm|ngõ|kiệt|số|đường|quận|huyện|phường|tp|tphcm).*)$`, 'i');
  const prefixMatch = raw.match(relationPattern);
  if (prefixMatch) {
    const relation = prefixMatch[1];
    const targetObj = prefixMatch[2];
    const rest = raw.substring(prefixMatch[0].length - (raw.match(/(?:hẻm|ngõ|kiệt|số|đường|quận|huyện|phường|tp|tphcm).*$/i)?.[0]?.length || 0));
    return {
      routeTarget: rest.trim(),
      clue: `${relation} ${targetObj.trim()}`,
      explanation: `Hãy đi đến địa điểm: "${rest.trim()}" rồi tìm xung quanh theo mốc: "${relation} ${targetObj.trim()}"`
    };
  }

  // 4. Regex for suffix matching if not split by commas, e.g. "hẻm 120 Hoàng Diệu đối diện cafe Highlands"
  const suffixRelationPattern = new RegExp(`^(.*?)\\s+(${relativeKeywords.join('|')})\\s+(.+)$`, 'i');
  const suffixMatch = raw.match(suffixRelationPattern);
  if (suffixMatch) {
    const rest = suffixMatch[1];
    const relation = suffixMatch[2];
    const targetObj = suffixMatch[3];
    return {
      routeTarget: rest.trim(),
      clue: `${relation} ${targetObj.trim()}`,
      explanation: `Hãy đi đến địa điểm: "${rest.trim()}" rồi tìm xung quanh theo mốc: "${relation} ${targetObj.trim()}"`
    };
  }

  // Default: no relative info found
  return {
    routeTarget: raw,
    clue: null,
    explanation: null
  };
}

export async function parseDescriptionAddressWithAI(addressText, geminiKey) {
  if (!geminiKey) {
    return parseDescriptionAddressLocally(addressText);
  }

  const systemPrompt = `
Bạn là trợ lý đắc lực cho tài xế giao hàng ở Việt Nam. Bạn có nhiệm vụ giải mã các địa chỉ không cụ thể hoặc chứa các chỉ dẫn/mốc định vị tương đối để chuyển nó thành địa chỉ/tên địa điểm sạch có khả năng tìm kiếm tốt nhất trên Google Maps.

Hãy phân tích chuỗi địa chỉ đầu vào sau:
- Nếu địa chỉ có dạng: "đối diện quán cafe X, hẻm 123 đường Y" -> địa chỉ để Google Maps tìm kiếm tốt nhất là "hẻm 123 đường Y, Phường, Quận, Thành phố". Còn chỉ dẫn "đối diện quán cafe X" là mốc định vị thực tế bằng mắt.
- Nếu địa chỉ có dạng: "bên cạnh nhà số 150 Cách Mạng Tháng Tám" -> địa chỉ Google Maps tốt nhất là "150 Cách Mạng Tháng Tám". Mốc thực tế là "bên cạnh nhà số 150".
- Nếu địa chỉ có dạng: "Highlands Coffee Hoàng Diệu, đối diện trường học" -> địa chỉ Google Maps tốt nhất là "Highlands Coffee Hoàng Diệu". Mốc thực tế là "đối diện trường học".

Hãy trả về một đối tượng JSON duy nhất có cấu trúc sau:
{
  "routeTarget": "Địa chỉ sạch hoặc tên địa điểm sạch tốt nhất dùng để dẫn đường trên Google Maps",
  "clue": "Mốc định vị thực tế (ví dụ: 'Đối diện quán cafe X', 'Kế bên nhà số 150') hoặc null nếu không có",
  "explanation": "Lời khuyên ngắn gọn để tìm nhà (ví dụ: 'Hãy tìm nhà sát bên số 150', 'Đi đến hẻm 123 rồi nhìn sang đối diện thấy quán X')"
}

LƯU Ý: CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG CHỨA BẤT KỲ CHỮ NÀO KHÁC NGOÀI JSON. KHÔNG BỌC TRONG BLOCK CODE \`\`\`json.
`;

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `Phân tích mô tả địa chỉ này: "${addressText}"` }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API Error');
    }

    let replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const firstBrace = replyText.indexOf('{');
    const lastBrace = replyText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      replyText = replyText.substring(firstBrace, lastBrace + 1);
    }
    
    const parsed = JSON.parse(replyText);
    return {
      routeTarget: parsed.routeTarget || addressText,
      clue: parsed.clue || null,
      explanation: parsed.explanation || null
    };
  } catch (err) {
    console.error('Gemini Address parsing error, falling back locally:', err);
    return parseDescriptionAddressLocally(addressText);
  }
}
