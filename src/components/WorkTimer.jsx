import React, { useState, useEffect, useRef } from 'react';
import { 
  Timer, Play, Pause, RotateCcw, SkipForward, Trash2, 
  Clock, Briefcase, BookOpen, Code, PenTool, Coffee, 
  Volume2, VolumeX, History, Award, CheckCircle2, ChevronRight
} from 'lucide-react';

export default function WorkTimer({ activeUser }) {
  // Timer modes: 'pomodoro' (countdown) or 'tracker' (count up)
  const [timerMode, setTimerMode] = useState('pomodoro');
  
  // Pomodoro sub-modes: 'focus', 'shortBreak', 'longBreak'
  const [pomodoroMode, setPomodoroMode] = useState('focus');

  // Custom durations (in minutes)
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);

  // Core Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60); // for Pomodoro (in seconds)
  const [elapsedTime, setElapsedTime] = useState(0); // for Stopwatch (in seconds)
  const [isRunning, setIsRunning] = useState(false);
  
  // Settings/Metadata for current session
  const [selectedCategory, setSelectedCategory] = useState('Lập trình');
  const [notes, setNotes] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // Stats & History
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem(`fintrack_work_sessions_${activeUser}`);
    return saved ? JSON.parse(saved) : [];
  });

  const timerRef = useRef(null);

  // Load custom Pomodoro durations if saved
  useEffect(() => {
    const savedFocus = localStorage.getItem(`fintrack_timer_focus_${activeUser}`);
    const savedShort = localStorage.getItem(`fintrack_timer_short_${activeUser}`);
    const savedLong = localStorage.getItem(`fintrack_timer_long_${activeUser}`);
    if (savedFocus) setFocusDuration(parseInt(savedFocus));
    if (savedShort) setShortBreakDuration(parseInt(savedShort));
    if (savedLong) setLongBreakDuration(parseInt(savedLong));
  }, [activeUser]);

  // Synchronize timeLeft when pomodoro durations or modes change
  useEffect(() => {
    if (timerMode === 'pomodoro' && !isRunning) {
      if (pomodoroMode === 'focus') {
        setTimeLeft(focusDuration * 60);
      } else if (pomodoroMode === 'shortBreak') {
        setTimeLeft(shortBreakDuration * 60);
      } else if (pomodoroMode === 'longBreak') {
        setTimeLeft(longBreakDuration * 60);
      }
    }
  }, [focusDuration, shortBreakDuration, longBreakDuration, pomodoroMode, timerMode, isRunning]);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem(`fintrack_work_sessions_${activeUser}`, JSON.stringify(sessions));
  }, [sessions, activeUser]);

  // Web Audio API Synthesized Sound Alarm
  const playAlarmSound = () => {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playTone = (freq, startTime, duration, type = 'sine') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Nice premium double-chime chord
      playTone(523.25, ctx.currentTime, 0.4);       // C5
      playTone(659.25, ctx.currentTime + 0.1, 0.4); // E5
      playTone(783.99, ctx.currentTime + 0.2, 0.5); // G5
      playTone(1046.50, ctx.currentTime + 0.35, 0.8, 'triangle'); // C6 soft chime
    } catch (err) {
      console.error("Synthesizer error:", err);
    }
  };

  // Timer Tick Effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (timerMode === 'pomodoro') {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              setIsRunning(false);
              playAlarmSound();
              handlePomodoroComplete();
              return 0;
            }
            return prev - 1;
          });
        } else {
          setElapsedTime((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timerMode]);

  // Handle automatic completion of Pomodoro
  const handlePomodoroComplete = () => {
    if (pomodoroMode === 'focus') {
      // Save focus session
      const newSession = {
        id: Date.now(),
        date: new Date().toLocaleDateString('vi-VN'),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        mode: 'pomodoro',
        type: 'Tập trung',
        category: selectedCategory,
        notes: notes || 'Hoàn thành phiên Pomodoro',
        duration: focusDuration * 60, // in seconds
      };
      setSessions((prev) => [newSession, ...prev]);
      setNotes('');

      // Prompt to switch to break
      if (confirm('🎉 Phiên tập trung đã hoàn thành! Bạn muốn bắt đầu nghỉ ngơi ngắn 5 phút không?')) {
        setPomodoroMode('shortBreak');
        setTimeLeft(shortBreakDuration * 60);
      } else {
        // Just reset to focus
        setTimeLeft(focusDuration * 60);
      }
    } else {
      alert('☕ Nghỉ ngơi đã hết! Sẵn sàng quay trở lại công việc chưa nào?');
      setPomodoroMode('focus');
      setTimeLeft(focusDuration * 60);
    }
  };

  // Start / Pause
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Reset Timer
  const resetTimer = () => {
    if (confirm('Bạn có muốn đặt lại đồng hồ đếm giờ không?')) {
      setIsRunning(false);
      if (timerMode === 'pomodoro') {
        if (pomodoroMode === 'focus') setTimeLeft(focusDuration * 60);
        else if (pomodoroMode === 'shortBreak') setTimeLeft(shortBreakDuration * 60);
        else setTimeLeft(longBreakDuration * 60);
      } else {
        setElapsedTime(0);
      }
    }
  };

  // Skip/Complete Session early
  const handleSkipOrSave = () => {
    if (timerMode === 'pomodoro') {
      if (pomodoroMode === 'focus') {
        if (confirm('Bạn muốn hoàn thành sớm và ghi nhận phiên này không?')) {
          setIsRunning(false);
          const elapsed = focusDuration * 60 - timeLeft;
          if (elapsed > 10) { // Only log if worked > 10s
            const newSession = {
              id: Date.now(),
              date: new Date().toLocaleDateString('vi-VN'),
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              mode: 'pomodoro',
              type: 'Tập trung (sớm)',
              category: selectedCategory,
              notes: notes || 'Hoàn thành sớm phiên Pomodoro',
              duration: elapsed,
            };
            setSessions((prev) => [newSession, ...prev]);
          }
          setNotes('');
          // Switch to break
          setPomodoroMode('shortBreak');
          setTimeLeft(shortBreakDuration * 60);
        }
      } else {
        // Skip break
        if (confirm('Bạn có muốn bỏ qua phiên nghỉ ngơi để bắt đầu làm việc ngay?')) {
          setIsRunning(false);
          setPomodoroMode('focus');
          setTimeLeft(focusDuration * 60);
        }
      }
    } else {
      // Stopwatch: Save tracked session
      if (elapsedTime < 5) {
        alert('Thời gian làm việc quá ngắn (dưới 5 giây), hệ thống không ghi nhận.');
        setIsRunning(false);
        setElapsedTime(0);
        return;
      }
      if (confirm('Bạn muốn dừng đếm giờ và lưu phiên làm việc này vào nhật ký?')) {
        setIsRunning(false);
        const newSession = {
          id: Date.now(),
          date: new Date().toLocaleDateString('vi-VN'),
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          mode: 'tracker',
          type: 'Đếm tự do',
          category: selectedCategory,
          notes: notes || 'Theo dõi thời gian tự do',
          duration: elapsedTime,
        };
        setSessions((prev) => [newSession, ...prev]);
        setElapsedTime(0);
        setNotes('');
      }
    }
  };

  // Delete log item
  const handleDeleteSession = (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa phiên ghi nhận này khỏi nhật ký?')) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleClearAllHistory = () => {
    if (confirm('🚨 CẢNH BÁO: Bạn có chắc muốn XÓA TOÀN BỘ nhật ký đếm giờ làm việc? Hành động này không thể hoàn tác!')) {
      setSessions([]);
    }
  };

  // Custom durations save helper
  const handleSaveDurations = (e) => {
    e.preventDefault();
    localStorage.setItem(`fintrack_timer_focus_${activeUser}`, focusDuration);
    localStorage.setItem(`fintrack_timer_short_${activeUser}`, shortBreakDuration);
    localStorage.setItem(`fintrack_timer_long_${activeUser}`, longBreakDuration);
    if (!isRunning) {
      if (pomodoroMode === 'focus') setTimeLeft(focusDuration * 60);
      else if (pomodoroMode === 'shortBreak') setTimeLeft(shortBreakDuration * 60);
      else setTimeLeft(longBreakDuration * 60);
    }
    alert('Đã lưu cấu hình thời gian mới!');
  };

  // Formatting utilities
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const formattedMins = mins.toString().padStart(2, '0');
    const formattedSecs = secs.toString().padStart(2, '0');

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${formattedMins}:${formattedSecs}`;
    }
    return `${formattedMins}:${formattedSecs}`;
  };

  const formatDurationText = (sec) => {
    if (sec < 60) return `${sec} giây`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (s === 0) return `${m} phút`;
    return `${m}m ${s}s`;
  };

  // Stats calculation
  const getTodayStats = () => {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const todaySessions = sessions.filter((s) => s.date === todayStr);
    
    const totalFocusSeconds = todaySessions
      .filter((s) => s.type.includes('Tập trung') || s.type.includes('Đếm tự do'))
      .reduce((sum, s) => sum + s.duration, 0);

    const pomodorosCount = todaySessions.filter((s) => s.mode === 'pomodoro' && s.type.includes('Tập trung')).length;

    const hours = Math.floor(totalFocusSeconds / 3600);
    const minutes = Math.floor((totalFocusSeconds % 3600) / 60);

    let durationText = '';
    if (hours > 0) durationText += `${hours} giờ `;
    durationText += `${minutes} phút`;

    return {
      durationText,
      pomodorosCount,
      totalFocusSeconds
    };
  };

  const stats = getTodayStats();

  // Mode settings configurations
  const currentTotalSeconds = timerMode === 'pomodoro' 
    ? (pomodoroMode === 'focus' ? focusDuration * 60 : pomodoroMode === 'shortBreak' ? shortBreakDuration * 60 : longBreakDuration * 60)
    : 3600; // arbitrary reference for circular percentage in stopwatch mode

  const currentSeconds = timerMode === 'pomodoro' ? timeLeft : elapsedTime;
  const progressPercent = timerMode === 'pomodoro'
    ? ((currentTotalSeconds - currentSeconds) / currentTotalSeconds) * 100
    : (currentSeconds % 60) * 1.666; // Loop around stopwatch animation every minute

  // SVG circular properties
  const radius = 120;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Category list configuration with icons
  const categories = [
    { name: 'Lập trình', icon: Code },
    { name: 'Học tập', icon: BookOpen },
    { name: 'Thiết kế', icon: PenTool },
    { name: 'Họp hành', icon: Briefcase },
    { name: 'Khác', icon: Coffee }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-slide-up pb-12">
      
      {/* Title Header */}
      <div className="border-b border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 font-heading flex items-center gap-2.5">
            <Timer className="w-7 h-7 text-purple-400 animate-pulse" />
            <span>Đếm Giờ Làm Việc & Năng Suất</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ứng dụng phương pháp Pomodoro và đếm giờ tự do để tối đa hóa sự tập trung và cân bằng cuộc sống.
          </p>
        </div>
        
        {/* Mode Selector tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-900 self-start">
          <button
            onClick={() => {
              if (isRunning && !confirm('Đồng hồ đang chạy. Bạn có muốn đổi chế độ và đặt lại đồng hồ?')) return;
              setIsRunning(false);
              setTimerMode('pomodoro');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              timerMode === 'pomodoro'
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-[0_0_10px_-2px_rgba(168,85,247,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pomodoro (Đập tập trung)
          </button>
          <button
            onClick={() => {
              if (isRunning && !confirm('Đồng hồ đang chạy. Bạn có muốn đổi chế độ và đặt lại đồng hồ?')) return;
              setIsRunning(false);
              setTimerMode('tracker');
              setElapsedTime(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              timerMode === 'tracker'
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-[0_0_10px_-2px_rgba(168,85,247,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đếm giờ tự do (Stopwatch)
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Clock Display and Controls (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          
          {/* Main Timer Display Panel */}
          <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center border border-purple-500/10 bg-slate-950/20 relative overflow-hidden flex-1 min-h-[450px]">
            {/* Top Sub-modes for Pomodoro */}
            {timerMode === 'pomodoro' && (
              <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 mb-6 z-10">
                <button
                  onClick={() => {
                    if (isRunning && !confirm('Đồng hồ đang chạy. Bạn muốn chuyển phiên và đặt lại?')) return;
                    setIsRunning(false);
                    setPomodoroMode('focus');
                    setTimeLeft(focusDuration * 60);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    pomodoroMode === 'focus'
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/10'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Tập trung ({focusDuration}m)</span>
                </button>
                <button
                  onClick={() => {
                    if (isRunning && !confirm('Đồng hồ đang chạy. Bạn muốn chuyển phiên và đặt lại?')) return;
                    setIsRunning(false);
                    setPomodoroMode('shortBreak');
                    setTimeLeft(shortBreakDuration * 60);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    pomodoroMode === 'shortBreak'
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/10'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Nghỉ ngắn ({shortBreakDuration}m)</span>
                </button>
                <button
                  onClick={() => {
                    if (isRunning && !confirm('Đồng hồ đang chạy. Bạn muốn chuyển phiên và đặt lại?')) return;
                    setIsRunning(false);
                    setPomodoroMode('longBreak');
                    setTimeLeft(longBreakDuration * 60);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    pomodoroMode === 'longBreak'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/10'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Nghỉ dài ({longBreakDuration}m)</span>
                </button>
              </div>
            )}

            {/* Circular Timer Display */}
            <div className="relative flex items-center justify-center select-none z-10">
              <svg className="w-72 h-72 transform -rotate-90">
                {/* Background circle track */}
                <circle
                  cx="144"
                  cy="144"
                  r={radius}
                  className="stroke-slate-900/60 fill-transparent"
                  strokeWidth={strokeWidth}
                />
                {/* Active animated progress indicator */}
                <circle
                  cx="144"
                  cy="144"
                  r={radius}
                  className={`fill-transparent transition-all duration-300 ${
                    timerMode === 'pomodoro'
                      ? pomodoroMode === 'focus'
                        ? 'stroke-purple-500'
                        : pomodoroMode === 'shortBreak'
                        ? 'stroke-emerald-500'
                        : 'stroke-blue-500'
                      : 'stroke-indigo-500'
                  }`}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    filter: `drop-shadow(0 0 8px var(--theme-primary))`
                  }}
                />
              </svg>
              
              {/* Inner central text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase tracking-widest text-slate-550 font-bold mb-1">
                  {timerMode === 'pomodoro'
                    ? pomodoroMode === 'focus'
                      ? 'Đang tập trung'
                      : 'Giờ nghỉ ngơi'
                    : 'Đang theo dõi tự do'}
                </span>
                <span className="text-4xl font-extrabold font-mono tracking-tight text-white mb-1.5 drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]">
                  {formatTime(currentSeconds)}
                </span>
                <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-950/60 border border-slate-900 max-w-[150px] truncate">
                  📌 {selectedCategory}
                </span>
              </div>
            </div>

            {/* Timer Actions & Controls */}
            <div className="flex items-center gap-6 mt-8 z-10">
              <button
                onClick={resetTimer}
                title="Đặt lại đồng hồ"
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer btn-click-effect hover:shadow-lg"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={toggleTimer}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-xl cursor-pointer btn-click-effect ${
                  isRunning 
                    ? 'bg-amber-600 hover:bg-amber-550 shadow-amber-500/10' 
                    : 'bg-purple-650 hover:bg-purple-650 shadow-purple-500/20'
                }`}
                style={{
                  boxShadow: isRunning ? '0 0 20px rgba(217,119,6,0.2)' : '0 0 20px rgba(168,85,247,0.2)'
                }}
              >
                {isRunning ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white translate-x-0.5" />}
              </button>

              <button
                onClick={handleSkipOrSave}
                title={timerMode === 'pomodoro' ? 'Bỏ qua phiên / Lưu sớm' : 'Hoàn thành và lưu phiên'}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer btn-click-effect hover:shadow-lg"
              >
                {timerMode === 'pomodoro' && pomodoroMode !== 'focus' ? (
                  <SkipForward className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
              </button>
            </div>

            {/* Mute and decorative control */}
            <div className="absolute bottom-4 right-4 z-10">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-300 transition cursor-pointer bg-slate-950/40"
                title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tagging and Session Config Section */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-900/60 bg-slate-950/20">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-400" />
              <span>Thiết Lập Phiên Làm Việc Hiện Tại</span>
            </h3>
            
            <div className="space-y-4">
              {/* Category tags */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider mb-2">Chọn nhóm công việc:</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const CatIcon = cat.icon;
                    const isSelected = selectedCategory === cat.name;
                    return (
                      <button
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer btn-click-effect ${
                          isSelected
                            ? 'bg-purple-600/15 border-purple-500/35 text-purple-450 shadow-sm'
                            : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <CatIcon className="w-3.5 h-3.5" />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note Input */}
              <div className="grid grid-cols-1 gap-1.5">
                <label className="text-[11px] font-bold text-slate-550 uppercase tracking-wider">Mô tả chi tiết công việc:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Lập trình giao diện, Thiết kế tài liệu, Viết bài blog..."
                  className="glass-input px-4 py-2.5 rounded-xl text-xs w-full focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Performance Analytics & Settings Panel */}
        <div className="space-y-6 flex flex-col">
          
          {/* Daily Stats Cards */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-900/60 bg-slate-950/20 space-y-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-900 pb-3">
              <Award className="w-4.5 h-4.5 text-amber-400" />
              <span>Năng Suất Hôm Nay</span>
            </h3>
            
            {/* Hour statistic card */}
            <div className="glass-card p-4 rounded-2xl border border-slate-850 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">Tập trung tích lũy</span>
                <span className="text-base font-extrabold text-white">{stats.totalFocusSeconds > 0 ? stats.durationText : '0 phút'}</span>
              </div>
            </div>

            {/* Focus Session card */}
            <div className="glass-card p-4 rounded-2xl border border-slate-850 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">Hoàn thành Pomodoro</span>
                <span className="text-base font-extrabold text-white">{stats.pomodorosCount} phiên tập trung</span>
              </div>
            </div>
          </div>

          {/* Pomodoro Timer Configuration Form */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-900/60 bg-slate-950/20">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
              <Timer className="w-4.5 h-4.5 text-purple-400" />
              <span>Cấu Hình Thời Gian (Phút)</span>
            </h3>
            
            <form onSubmit={handleSaveDurations} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold block uppercase">Tập trung</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={focusDuration}
                    onChange={(e) => setFocusDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={isRunning && pomodoroMode === 'focus'}
                    className="glass-input px-3 py-2 rounded-xl text-xs w-full text-center disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold block uppercase">Nghỉ ngắn</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={shortBreakDuration}
                    onChange={(e) => setShortBreakDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={isRunning && pomodoroMode === 'shortBreak'}
                    className="glass-input px-3 py-2 rounded-xl text-xs w-full text-center disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold block uppercase">Nghỉ dài</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={longBreakDuration}
                    onChange={(e) => setLongBreakDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={isRunning && pomodoroMode === 'longBreak'}
                    className="glass-input px-3 py-2 rounded-xl text-xs w-full text-center disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-650 hover:bg-purple-600 text-white font-bold text-xs transition cursor-pointer btn-click-effect border border-purple-550/20"
              >
                Lưu cấu hình thời gian
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Bottom Section: Focus History Log Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-900/60 bg-slate-950/20">
        <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <History className="w-4.5 h-4.5 text-purple-400" />
            <span>Nhật Ký Năng Suất Làm Việc ({sessions.length})</span>
          </h3>
          {sessions.length > 0 && (
            <button
              onClick={handleClearAllHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/10 text-rose-400 hover:bg-rose-500/10 transition cursor-pointer text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa lịch sử</span>
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12 text-slate-550 text-xs">
            📭 Chưa ghi nhận phiên làm việc nào. Bắt đầu đếm giờ để xây dựng thói quen tập trung!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-slate-900/60">
                  <th className="py-2.5 font-bold">Ngày & Giờ</th>
                  <th className="py-2.5 font-bold">Chế độ</th>
                  <th className="py-2.5 font-bold">Danh mục</th>
                  <th className="py-2.5 font-bold">Ghi chú công việc</th>
                  <th className="py-2.5 font-bold text-right">Thời lượng</th>
                  <th className="py-2.5 text-center font-bold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b border-slate-900/40 hover:bg-slate-900/10 transition">
                    <td className="py-3 font-medium text-slate-300">
                      <div>{session.date}</div>
                      <div className="text-[10px] text-slate-550">{session.time}</div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        session.type.includes('Tập trung') 
                          ? 'bg-purple-950/60 text-purple-400 border border-purple-900/40' 
                          : 'bg-indigo-950/60 text-indigo-400 border border-indigo-900/40'
                      }`}>
                        {session.type}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-slate-200">
                      {session.category}
                    </td>
                    <td className="py-3 text-slate-400 max-w-[250px] truncate" title={session.notes}>
                      {session.notes}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-100">
                      {formatDurationText(session.duration)}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition cursor-pointer hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10"
                        title="Xóa phiên"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
