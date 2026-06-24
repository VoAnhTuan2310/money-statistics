import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Key, Trash2, Download, 
  Upload, AlertTriangle, Check, RefreshCw, X, Edit, ShieldAlert
} from 'lucide-react';
import { 
  getUsers, 
  adminCreateUser, 
  adminUpdateUserRole, 
  adminDeleteUser, 
  adminResetPassword,
  exportSystemDatabase,
  importSystemDatabase,
  getActiveUser
} from '../utils/storage';

export default function AccountManager() {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'backup'
  
  // Create user form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  
  // Password reset state
  const [resettingUser, setResettingUser] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // UI feedback states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadUsers();
    setActiveUser(getActiveUser());
  }, []);

  const loadUsers = () => {
    setUsers(getUsers());
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      showError('Vui lòng nhập đầy đủ tên tài khoản và mật khẩu!');
      return;
    }
    
    const res = adminCreateUser(newUsername.trim(), newPassword.trim(), newRole);
    if (res.success) {
      showSuccess(`Đã tạo thành công tài khoản "${newUsername.trim()}"!`);
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      loadUsers();
    } else {
      showError(res.error);
    }
  };

  const handleRoleChange = (username, role) => {
    const res = adminUpdateUserRole(username, role);
    if (res.success) {
      showSuccess(`Đã cập nhật vai trò của tài khoản "${username}" thành ${role.toUpperCase()}`);
      loadUsers();
    } else {
      showError(res.error);
    }
  };

  const handleDeleteUser = (username) => {
    if (username.toLowerCase() === activeUser.toLowerCase()) {
      showError('Bạn không thể tự xóa tài khoản của chính mình!');
      return;
    }
    
    if (window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${username}"? Toàn bộ ví, giao dịch và dữ liệu tài chính của tài khoản này sẽ bị xóa sạch!`)) {
      const res = adminDeleteUser(username);
      if (res.success) {
        showSuccess(`Đã xóa vĩnh viễn tài khoản "${username}" và dữ liệu kèm theo!`);
        loadUsers();
      } else {
        showError(res.error);
      }
    }
  };

  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();
    if (!newPasswordInput.trim()) {
      showError('Mật khẩu mới không được để trống!');
      return;
    }

    const res = adminResetPassword(resettingUser, newPasswordInput.trim());
    if (res.success) {
      showSuccess(`Đã đặt lại mật khẩu cho tài khoản "${resettingUser}" thành công!`);
      setResettingUser(null);
      setNewPasswordInput('');
    } else {
      showError(res.error);
    }
  };

  const handleExportSystem = () => {
    try {
      exportSystemDatabase();
      showSuccess('Xuất file sao lưu hệ thống thành công!');
    } catch (err) {
      showError('Lỗi khi xuất file sao lưu: ' + err.message);
    }
  };

  const handleImportSystem = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      if (window.confirm('CẢNH BÁO: Thao tác này sẽ ghi đè toàn bộ tài khoản và giao dịch hiện tại trên thiết bị này bằng dữ liệu từ file sao lưu. Bạn có chắc chắn muốn khôi phục?')) {
        const res = importSystemDatabase(content);
        if (res.success) {
          showSuccess('Khôi phục hệ thống thành công! Trang web sẽ tự tải lại để áp dụng dữ liệu mới.');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          showError('Khôi phục thất bại: ' + res.error);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
            Quản trị Hệ thống & Phân quyền
          </h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">
            Quản lý tài khoản thành viên và sao lưu/khôi phục toàn bộ cơ sở dữ liệu trên thiết bị.
          </p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex bg-slate-900/50 backdrop-blur-md p-1.5 rounded-xl border border-white/5 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          Quản lý Thành viên
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            activeTab === 'backup'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Download className="w-4 h-4" />
          Sao lưu & Đồng bộ
        </button>
      </div>

      {/* Tab: Users Management */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create User Form */}
          <div className="lg:col-span-1 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl h-fit">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              Thêm Tài Khoản Mới
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ví dụ: nguyenvana"
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Vai trò (Quyền hạn)
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="user">User (Chỉ xem báo cáo, không sửa được số liệu)</option>
                  <option value="manager">Manager (Quản lý - Xem, sửa số liệu cá nhân)</option>
                  <option value="admin">Admin (Quản trị hệ thống toàn quyền)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-emerald-950/20 active:scale-[0.98] transition-transform duration-100 mt-2 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Tạo tài khoản
              </button>
            </form>
          </div>

          {/* Users List Table */}
          <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl overflow-hidden">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <Users className="w-5 h-5 text-emerald-400" />
              Danh Sách Thành Viên ({users.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Tài khoản</th>
                    <th className="py-3 px-4">Vai trò</th>
                    <th className="py-3 px-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => {
                    const isSelf = u.username.toLowerCase() === activeUser.toLowerCase();
                    return (
                      <tr key={u.username} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{u.username}</span>
                            {isSelf && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Bạn
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <select
                            value={u.role || 'user'}
                            onChange={(e) => handleRoleChange(u.username, e.target.value)}
                            disabled={isSelf && u.role === 'admin'}
                            className="bg-slate-950/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="user">User (Chỉ xem)</option>
                            <option value="manager">Manager (Quản lý)</option>
                            <option value="admin">Admin (Quản trị)</option>
                          </select>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Reset Password Button */}
                            <button
                              onClick={() => setResettingUser(u.username)}
                              title="Đặt lại mật khẩu"
                              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            >
                              <Key className="w-4 h-4" />
                            </button>

                            {/* Delete User Button */}
                            <button
                              onClick={() => handleDeleteUser(u.username)}
                              disabled={isSelf}
                              title={isSelf ? "Không thể tự xóa bản thân" : "Xóa tài khoản vĩnh viễn"}
                              className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Backup & Sync */}
      {activeTab === 'backup' && (
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl max-w-3xl">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
            <Download className="w-5 h-5 text-emerald-400" />
            Sao lưu & Khôi phục Hệ thống
          </h2>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6 text-sm text-blue-300 flex gap-3">
            <ShieldAlert className="w-6 h-6 shrink-0 text-blue-400" />
            <div className="space-y-1.5">
              <p className="font-semibold text-white">Giải pháp cho lỗi không đồng bộ thiết bị:</p>
              <p>Do dữ liệu được lưu trữ cục bộ trong trình duyệt máy tính của bạn, điện thoại của bạn sẽ không có sẵn các tài khoản hay giao dịch đó.</p>
              <p><strong>Cách giải quyết:</strong> Xuất file sao lưu hệ thống từ máy tính của bạn, gửi file này qua điện thoại (Messenger, Zalo, Email, vv.) rồi vào tài khoản Admin trên điện thoại bấm <strong>"Chọn file sao lưu"</strong> bên dưới để khôi phục toàn bộ tài khoản và các dữ liệu tài chính giống hệt máy tính!</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Export Section */}
            <div className="p-5 bg-white/5 rounded-xl border border-white/5 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-400" />
                  Xuất Sao Lưu
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Đóng gói tất cả tài khoản người dùng, vai trò, cài đặt, và toàn bộ giao dịch tài chính của tất cả mọi người thành một tệp tin `.json` để lưu trữ hoặc chuyển sang điện thoại.
                </p>
              </div>
              <button
                onClick={handleExportSystem}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                Xuất file sao lưu (.json)
              </button>
            </div>

            {/* Import Section */}
            <div className="p-5 bg-white/5 rounded-xl border border-white/5 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" />
                  Nhập Sao Lưu
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Tải lên tệp tin `.json` sao lưu để khôi phục lại cấu hình và số liệu. Hành động này sẽ thay thế hoàn toàn cơ sở dữ liệu hiện tại trên trình duyệt này.
                </p>
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportSystem}
                  id="system-import-file"
                  className="hidden"
                />
                <label
                  htmlFor="system-import-file"
                  className="w-full bg-slate-800 hover:bg-slate-700 text-gray-300 font-medium py-3 rounded-xl border border-white/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
                >
                  <Upload className="w-4 h-4 text-gray-400" />
                  Chọn file sao lưu
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-scaleUp">
            <button
              onClick={() => {
                setResettingUser(null);
                setNewPasswordInput('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" />
              Đặt Lại Mật Khẩu
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Cập nhật mật khẩu mới cho tài khoản: <strong className="text-white">{resettingUser}</strong>
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResettingUser(null);
                    setNewPasswordInput('');
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-gray-300 font-medium py-3 rounded-xl transition-colors text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium py-3 rounded-xl transition-all shadow-md active:scale-[0.98] text-sm"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
