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

  const loadUsers = async () => {
    const list = await getUsers();
    setUsers(list);
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      showError('Vui lòng nhập đầy đủ tên tài khoản và mật khẩu!');
      return;
    }
    
    const res = await adminCreateUser(newUsername.trim(), newPassword.trim(), newRole);
    if (res.success) {
      showSuccess(`Đã tạo thành công tài khoản "${newUsername.trim()}"!`);
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      await loadUsers();
    } else {
      showError(res.error);
    }
  };

  const handleRoleChange = async (username, role) => {
    const res = await adminUpdateUserRole(username, role);
    if (res.success) {
      showSuccess(`Đã cập nhật vai trò của tài khoản "${username}" thành ${role.toUpperCase()}`);
      await loadUsers();
    } else {
      showError(res.error);
    }
  };

  const handleDeleteUser = async (username) => {
    if (username.toLowerCase() === activeUser.toLowerCase()) {
      showError('Bạn không thể tự xóa tài khoản của chính mình!');
      return;
    }
    
    if (window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${username}"? Toàn bộ ví, giao dịch và dữ liệu tài chính của tài khoản này sẽ bị xóa sạch!`)) {
      const res = await adminDeleteUser(username);
      if (res.success) {
        showSuccess(`Đã xóa vĩnh viễn tài khoản "${username}" và dữ liệu kèm theo!`);
        await loadUsers();
      } else {
        showError(res.error);
      }
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPasswordInput.trim()) {
      showError('Mật khẩu mới không được để trống!');
      return;
    }

    const res = await adminResetPassword(resettingUser, newPasswordInput.trim());
    if (res.success) {
      showSuccess(`Đã đặt lại mật khẩu cho tài khoản "${resettingUser}" thành công!`);
      setResettingUser(null);
      setNewPasswordInput('');
    } else {
      showError(res.error);
    }
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
            Quản lý tài khoản thành viên và phân quyền người dùng trong hệ thống.
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

      {/* Tab: Users Management */}
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
