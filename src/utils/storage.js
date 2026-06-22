// LocalStorage Keys
const KEYS = {
  TRANSACTIONS: 'fintrack_transactions',
  BUDGET: 'fintrack_budget',
  SAVINGS_POTS: 'fintrack_savings_pots',
  USERS: 'fintrack_users',
  GEMINI_API_KEY: 'fintrack_gemini_api_key'
};

// Initial Default Values
const DEFAULT_BUDGET = {
  monthlyIncomeTarget: 15000000, // Tiền phải cho vào 1 tháng (mục tiêu thu nhập/tiết kiệm)
  monthlyExpenseLimit: 10000000  // Giới hạn chi tiêu tối đa 1 tháng (giới hạn ra)
};

const DEFAULT_CATEGORIES = {
  income: ['Lương', 'Thưởng', 'Kinh doanh', 'Được tặng', 'Khác'],
  expense: ['Ăn uống', 'Di chuyển', 'Mua sắm', 'Nhà cửa & Hóa đơn', 'Giải trí', 'Sức khỏe', 'Giáo dục', 'Tiết kiệm', 'Khác']
};

const DEFAULT_SAVINGS_POTS = [
  {
    id: 'pot-1',
    name: 'Quỹ Dự Phòng Khẩn Cấp',
    targetAmount: 20000000,
    currentAmount: 5000000,
    color: 'emerald',
    targetDate: '2026-12-31',
    createdAt: new Date().toISOString()
  },
  {
    id: 'pot-2',
    name: 'Mua Laptop Mới', 
    targetAmount: 25000000,
    currentAmount: 8000000,
    color: 'violet',
    targetDate: '2026-10-31',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_TRANSACTIONS = [
  {
    id: 'tx-1',
    type: 'income',
    amount: 15000000,
    category: 'Lương',
    date: new Date().toISOString().split('T')[0],
    note: 'Lương tháng này'
  },
  {
    id: 'tx-2',
    type: 'expense',
    amount: 150000,
    category: 'Ăn uống',
    date: new Date().toISOString().split('T')[0],
    note: 'Ăn trưa & cafe với đồng nghiệp'
  },
  {
    id: 'tx-3',
    type: 'expense',
    amount: 800000,
    category: 'Mua sắm',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    note: 'Mua giày thể thao'
  },
  {
    id: 'tx-4',
    type: 'income',
    amount: 2000000,
    category: 'Kinh doanh',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    note: 'Bán đồ cũ'
  }
];

// Helper functions for safely interacting with localStorage
const getJSON = (key, defaultValue) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const setJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
    return false;
  }
};

// --- Authentication & User Scoping Helpers ---
export const getActiveUser = () => {
  return localStorage.getItem('fintrack_active_user') || '';
};

export const setActiveUser = (username) => {
  if (username) {
    localStorage.setItem('fintrack_active_user', username);
  } else {
    localStorage.removeItem('fintrack_active_user');
  }
};

export const getUsers = () => {
  return getJSON(KEYS.USERS, []);
};

export const registerUser = (username, password) => {
  const users = getUsers();
  const normalized = username.trim();
  const exists = users.some(u => u.username.toLowerCase() === normalized.toLowerCase());
  if (exists) {
    return { success: false, error: 'Tên tài khoản đã tồn tại!' };
  }
  users.push({ username: normalized, password });
  setJSON(KEYS.USERS, users);
  return { success: true };
};

export const loginUser = (username, password) => {
  const users = getUsers();
  const normalized = username.trim();
  const user = users.find(u => u.username.toLowerCase() === normalized.toLowerCase() && u.password === password);
  if (!user) {
    return { success: false, error: 'Tài khoản hoặc mật khẩu không chính xác!' };
  }
  setActiveUser(user.username);
  return { success: true, username: user.username };
};

export const logoutUser = () => {
  setActiveUser('');
};

export const changeUserPassword = (username, newPassword) => {
  const users = getUsers();
  const normalized = username.trim();
  const index = users.findIndex(u => u.username.toLowerCase() === normalized.toLowerCase());
  if (index === -1) {
    return { success: false, error: 'Tài khoản không tồn tại!' };
  }
  users[index].password = newPassword;
  setJSON(KEYS.USERS, users);
  return { success: true };
};

export const clearUserData = (username) => {
  const normalized = username.trim();
  localStorage.removeItem(`${KEYS.TRANSACTIONS}_${normalized}`);
  localStorage.removeItem(`${KEYS.BUDGET}_${normalized}`);
  localStorage.removeItem(`${KEYS.SAVINGS_POTS}_${normalized}`);
  localStorage.removeItem(`fintrack_categories_${normalized}`);
  localStorage.removeItem(`fintrack_recurring_${normalized}`);
  return { success: true };
};

const getDynamicKey = (baseKey) => {
  const username = getActiveUser();
  return username ? `${baseKey}_${username}` : baseKey;
};

// --- Custom Categories API ---
export const getUserCategories = () => {
  const username = getActiveUser();
  if (!username) return DEFAULT_CATEGORIES;
  const key = `fintrack_categories_${username}`;
  const categories = getJSON(key, null);
  if (categories === null) {
    setJSON(key, DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }
  return categories;
};

export const saveUserCategories = (categories) => {
  const username = getActiveUser();
  if (!username) return false;
  return setJSON(`fintrack_categories_${username}`, categories);
};

export const addUserCategory = (type, category) => {
  const categories = getUserCategories();
  const normalized = category.trim();
  if (!normalized) return { success: false, error: 'Tên danh mục không được để trống!' };
  if (categories[type].some(c => c.toLowerCase() === normalized.toLowerCase())) {
    return { success: false, error: 'Danh mục này đã tồn tại!' };
  }
  categories[type].push(normalized);
  saveUserCategories(categories);
  return { success: true, categories };
};

export const deleteUserCategory = (type, category) => {
  const categories = getUserCategories();
  categories[type] = categories[type].filter(c => c !== category);
  saveUserCategories(categories);
  return { success: true, categories };
};

// Keep for compatibility
export const getCategories = () => {
  return getUserCategories();
};

// --- Recurring Transactions API ---
export const getRecurringTransactions = () => {
  const username = getActiveUser();
  if (!username) return [];
  const key = `fintrack_recurring_${username}`;
  return getJSON(key, []);
};

export const saveRecurringTransactions = (list) => {
  const username = getActiveUser();
  if (!username) return false;
  const key = `fintrack_recurring_${username}`;
  return setJSON(key, list);
};

export const addRecurringTransaction = (item) => {
  const list = getRecurringTransactions();
  const newItem = {
    ...item,
    id: `rec-${Date.now()}`,
    amount: Number(item.amount) || 0,
    lastProcessedDate: new Date().toISOString().split('T')[0]
  };
  list.push(newItem);
  saveRecurringTransactions(list);
  return newItem;
};

export const deleteRecurringTransaction = (id) => {
  const list = getRecurringTransactions();
  const filtered = list.filter(item => item.id !== id);
  saveRecurringTransactions(filtered);
  return filtered;
};

export const processRecurringTransactions = (username) => {
  if (!username) return { success: false, addedCount: 0, addedList: [] };
  
  const recurringList = getRecurringTransactions();
  if (recurringList.length === 0) return { success: true, addedCount: 0, addedList: [] };

  const transactionsKey = `${KEYS.TRANSACTIONS}_${username}`;
  const txs = getJSON(transactionsKey, DEFAULT_TRANSACTIONS);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);
  
  let updatedRecurring = [...recurringList];
  let newlyAddedTxs = [];
  let changed = false;

  updatedRecurring = updatedRecurring.map(item => {
    const lastDateStr = item.lastProcessedDate;
    const lastDate = new Date(lastDateStr);
    
    // Calculate days difference
    const diffTime = today - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return item; // Already processed today or in future

    let datesToGenerate = [];
    
    // Generate dates between lastProcessedDate (exclusive) and today (inclusive)
    for (let i = 1; i <= diffDays; i++) {
      const genDate = new Date(lastDate);
      genDate.setDate(lastDate.getDate() + i);
      const genDateStr = genDate.toISOString().split('T')[0];

      let isDue = false;
      if (item.frequency === 'daily') {
        isDue = true;
      } else if (item.frequency === 'weekly') {
        if (genDate.getDay() === Number(item.dayOfPeriod)) {
          isDue = true;
        }
      } else if (item.frequency === 'monthly') {
        const targetDay = Number(item.dayOfPeriod);
        const currentDay = genDate.getDate();
        
        if (currentDay === targetDay) {
          isDue = true;
        } else {
          // Handle shorter months
          const nextDay = new Date(genDate);
          nextDay.setDate(genDate.getDate() + 1);
          if (nextDay.getDate() === 1 && targetDay > currentDay) {
            isDue = true;
          }
        }
      }

      if (isDue) {
        datesToGenerate.push(genDateStr);
      }
    }

    if (datesToGenerate.length > 0) {
      datesToGenerate.forEach(dateStr => {
        const newTx = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: item.type,
          amount: item.amount,
          category: item.category,
          date: dateStr,
          note: `${item.note} (Định kỳ tự động)`,
          createdAt: new Date().toISOString()
        };
        txs.unshift(newTx);
        newlyAddedTxs.push(newTx);
      });
      
      changed = true;
      return {
        ...item,
        lastProcessedDate: todayStr
      };
    }

    return item;
  });

  if (changed) {
    setJSON(transactionsKey, txs);
    const recurringKey = `fintrack_recurring_${username}`;
    setJSON(recurringKey, updatedRecurring);
  }

  return {
    success: true,
    addedCount: newlyAddedTxs.length,
    addedList: newlyAddedTxs
  };
};

// --- Transactions API ---
export const getTransactions = () => {
  const key = getDynamicKey(KEYS.TRANSACTIONS);
  const txs = getJSON(key, null);
  if (txs === null) {
    setJSON(key, DEFAULT_TRANSACTIONS);
    return DEFAULT_TRANSACTIONS;
  }
  return txs;
};

export const saveTransactions = (transactions) => {
  return setJSON(getDynamicKey(KEYS.TRANSACTIONS), transactions);
};

export const addTransaction = (tx) => {
  const txs = getTransactions();
  const newTx = {
    ...tx,
    id: tx.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString()
  };
  txs.unshift(newTx); // Add to the top of the list
  saveTransactions(txs);
  return newTx;
};

export const deleteTransaction = (id) => {
  const txs = getTransactions();
  const filtered = txs.filter(t => t.id !== id);
  saveTransactions(filtered);
  return filtered;
};

export const updateTransaction = (updatedTx) => {
  const txs = getTransactions();
  const index = txs.findIndex(t => t.id === updatedTx.id);
  if (index !== -1) {
    txs[index] = updatedTx;
    saveTransactions(txs);
  }
  return txs;
};

// --- Budget API ---
export const getBudget = () => {
  const key = getDynamicKey(KEYS.BUDGET);
  const budget = getJSON(key, null);
  if (budget === null) {
    setJSON(key, DEFAULT_BUDGET);
    return DEFAULT_BUDGET;
  }
  return budget;
};

export const saveBudget = (budget) => {
  return setJSON(getDynamicKey(KEYS.BUDGET), budget);
};

// --- Savings Pots API ---
export const getSavingsPots = () => {
  const key = getDynamicKey(KEYS.SAVINGS_POTS);
  const pots = getJSON(key, null);
  if (pots === null) {
    setJSON(key, DEFAULT_SAVINGS_POTS);
    return DEFAULT_SAVINGS_POTS;
  }
  return pots;
};

export const saveSavingsPots = (pots) => {
  return setJSON(getDynamicKey(KEYS.SAVINGS_POTS), pots);
};

export const addSavingsPot = (pot) => {
  const pots = getSavingsPots();
  const newPot = {
    ...pot,
    id: `pot-${Date.now()}`,
    currentAmount: Number(pot.currentAmount) || 0,
    targetAmount: Number(pot.targetAmount) || 0,
    createdAt: new Date().toISOString()
  };
  pots.push(newPot);
  saveSavingsPots(pots);
  return newPot;
};

export const deleteSavingsPot = (id) => {
  const pots = getSavingsPots();
  const filtered = pots.filter(p => p.id !== id);
  saveSavingsPots(filtered);
  return filtered;
};

export const updateSavingsPot = (updatedPot) => {
  const pots = getSavingsPots();
  const index = pots.findIndex(p => p.id === updatedPot.id);
  if (index !== -1) {
    pots[index] = {
      ...pots[index],
      ...updatedPot,
      currentAmount: Number(updatedPot.currentAmount),
      targetAmount: Number(updatedPot.targetAmount)
    };
    saveSavingsPots(pots);
  }
  return pots;
};

// --- Export & Import ---
export const exportData = () => {
  const data = {
    transactions: getTransactions(),
    budget: getBudget(),
    savingsPots: getSavingsPots(),
    version: '1.0.0',
    exportedAt: new Date().toISOString()
  };
  
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `anhtuan_data_${getActiveUser() || 'guest'}_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const importData = (jsonData) => {
  try {
    const data = JSON.parse(jsonData);
    if (data.transactions && Array.isArray(data.transactions)) {
      saveTransactions(data.transactions);
    }
    if (data.budget) {
      saveBudget(data.budget);
    }
    if (data.savingsPots && Array.isArray(data.savingsPots)) {
      saveSavingsPots(data.savingsPots);
    }
    return { success: true };
  } catch (error) {
    console.error('Error importing data:', error);
    return { success: false, error: error.message };
  }
};

// Currency Formatter
export const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

// Input Number Formatter (adds commas every 3 digits for input values)
export const formatNumberInput = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const isNegative = val.toString().startsWith('-');
  const digits = val.toString().replace(/\D/g, '');
  if (!digits) return isNegative ? '-' : '';
  const formatted = new Intl.NumberFormat('en-US').format(digits);
  return isNegative ? `-${formatted}` : formatted;
};

// --- Gemini API Key Helpers ---
export const getGeminiApiKey = () => {
  const username = getActiveUser();
  if (!username) return '';
  return localStorage.getItem(`${KEYS.GEMINI_API_KEY}_${username}`) || '';
};

export const saveGeminiApiKey = (key) => {
  const username = getActiveUser();
  if (!username) return false;
  if (key) {
    localStorage.setItem(`${KEYS.GEMINI_API_KEY}_${username}`, key.trim());
  } else {
    localStorage.removeItem(`${KEYS.GEMINI_API_KEY}_${username}`);
  }
  return true;
};
