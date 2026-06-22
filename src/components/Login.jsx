import React, { useState, useEffect } from 'react';
import { Lock, User, UserPlus, LogIn, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { loginUser, registerUser } from '../utils/storage';

export default function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [particles, setParticles] = useState([]);

  const cornerLines = [
    { id: 1, x2: 180, y2: 30, delay: '0s', duration: '2.5s', color: '#a855f7' },
    { id: 2, x2: 150, y2: 70, delay: '0.5s', duration: '3s', color: '#6366f1' },
    { id: 3, x2: 100, y2: 100, delay: '1s', duration: '2.2s', color: '#ec4899' },
    { id: 4, x2: 70, y2: 150, delay: '1.5s', duration: '2.8s', color: '#3b82f6' },
    { id: 5, x2: 30, y2: 180, delay: '2s', duration: '3.2s', color: '#d946ef' }
  ];

  // Generate starry background on mount
  useEffect(() => {
    const generated = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 1.5}px`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 3 + 3}s`,
    }));
    setParticles(generated);
  }, []);

  const handleToggleMode = () => {
    setIsRegistering(!isRegistering);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Vui lòng nhập tên tài khoản!');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu!');
      return;
    }

    if (isRegistering) {
      if (password.length < 6) {
        setError('Mật khẩu phải chứa ít nhất 6 ký tự!');
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không trùng khớp!');
        return;
      }

      const res = registerUser(trimmedUsername, password);
      if (res.success) {
        setSuccessMsg('Đăng ký tài khoản thành công! Hãy đăng nhập.');
        setIsRegistering(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(res.error);
      }
    } else {
      const res = loginUser(trimmedUsername, password);
      if (res.success) {
        onLoginSuccess();
      } else {
        setError(res.error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Cyber Laser burst rays shooting from the 4 corners of the screen */}
      {/* Top-Left */}
      <div className="absolute top-0 left-0 w-[200px] h-[200px] pointer-events-none z-0">
        <svg className="w-full h-full">
          {cornerLines.map(line => (
            <line
              key={line.id}
              x1="0"
              y1="0"
              x2={line.x2}
              y2={line.y2}
              stroke={line.color}
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-laser"
              style={{ animationDelay: line.delay, animationDuration: line.duration }}
            />
          ))}
        </svg>
      </div>

      {/* Top-Right */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] pointer-events-none z-0">
        <svg className="w-full h-full">
          {cornerLines.map(line => (
            <line
              key={line.id}
              x1="200"
              y1="0"
              x2={200 - line.x2}
              y2={line.y2}
              stroke={line.color}
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-laser"
              style={{ animationDelay: line.delay, animationDuration: line.duration }}
            />
          ))}
        </svg>
      </div>

      {/* Bottom-Left */}
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] pointer-events-none z-0">
        <svg className="w-full h-full">
          {cornerLines.map(line => (
            <line
              key={line.id}
              x1="0"
              y1="200"
              x2={line.x2}
              y2={200 - line.y2}
              stroke={line.color}
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-laser"
              style={{ animationDelay: line.delay, animationDuration: line.duration }}
            />
          ))}
        </svg>
      </div>

      {/* Bottom-Right */}
      <div className="absolute bottom-0 right-0 w-[200px] h-[200px] pointer-events-none z-0">
        <svg className="w-full h-full">
          {cornerLines.map(line => (
            <line
              key={line.id}
              x1="200"
              y1="200"
              x2={200 - line.x2}
              y2={200 - line.y2}
              stroke={line.color}
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-laser"
              style={{ animationDelay: line.delay, animationDuration: line.duration }}
            />
          ))}
        </svg>
      </div>

      {/* 1. Starry sparkling background particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white opacity-20 pointer-events-none animate-twinkle"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.4)'
          }}
        />
      ))}

      {/* 2. Large moving background orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-650/10 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-650/10 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-fuchsia-650/5 rounded-full blur-[130px] pointer-events-none z-0"></div>

      {/* Halo Glow for Login Card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[650px] bg-gradient-to-tr from-purple-550/5 to-indigo-550/5 rounded-3xl blur-2xl z-0 pointer-events-none"></div>

      {/* 3. Main Login Card Container */}
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.55)] border border-purple-500/15 relative z-10 flex flex-col items-center text-center space-y-6 animate-slide-up">
        
        {/* Brand Header */}
        <div className="space-y-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl shadow-xl shadow-purple-500/20 flex items-center justify-center mx-auto mb-2 text-white">
            {isRegistering ? <UserPlus className="w-8 h-8" /> : <LogIn className="w-8 h-8" />}
          </div>
          <h1 className="text-3xl font-black font-heading bg-gradient-to-r from-white via-slate-100 to-purple-400 bg-clip-text text-transparent">FinTrack</h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-[280px] mx-auto">
            {isRegistering 
              ? 'Tạo tài khoản mới để bắt đầu theo dõi thu chi & tiết kiệm' 
              : 'Đăng nhập vào hệ thống quản lý tài chính cá nhân'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
          
          {/* Username Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1.5 ml-1">Tên tài khoản</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm font-medium"
                placeholder="Nhập tên đăng nhập..."
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-1.5 ml-1">Mật khẩu</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 rounded-xl glass-input text-sm font-medium"
                placeholder={isRegistering ? "Tối thiểu 6 ký tự..." : "Nhập mật khẩu..."}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-purple-400 p-1.5 rounded-lg hover:bg-slate-950/60 transition cursor-pointer"
                title={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input (only in Register mode) */}
          {isRegistering && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-250">
              <label className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-1.5 ml-1">Xác nhận mật khẩu</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm font-medium"
                  placeholder="Nhập lại mật khẩu..."
                />
              </div>
            </div>
          )}

          {/* Success messages */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-550 hover:to-indigo-600 text-white font-bold shadow-lg shadow-purple-500/15 transition-all duration-200 cursor-pointer mt-4 flex items-center justify-center gap-2 border border-purple-500/20 shimmer-btn"
          >
            {isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            {isRegistering ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
          </button>
        </form>

        {/* Toggle link */}
        <div className="pt-2 text-xs">
          <span className="text-slate-400">
            {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
          </span>{' '}
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-purple-400 hover:text-purple-300 font-bold underline transition cursor-pointer"
          >
            {isRegistering ? 'Đăng nhập ngay' : 'Đăng ký tài khoản mới'}
          </button>
        </div>

      </div>
    </div>
  );
}
