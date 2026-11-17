import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email.trim(), password);

      // Role-based routing to respective dashboard
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'hod') {
        navigate('/hod/dashboard');
      } else if (user.role === 'faculty') {
        navigate('/faculty/dashboard');
      } else if (user.role === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen max-h-screen bg-gradient-to-br from-[#061129] via-[#0a1b40] to-[#0f2858] flex items-center justify-center p-3 sm:p-5 overflow-hidden font-sans select-none relative">
      {/* Background soft ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Login Card - Reduced height top & bottom by 20px, clean shadow and border */}
      <div className="relative z-10 w-full max-w-[620px] max-h-[430px] sm:max-h-[450px] bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-row border border-white/20">
        
        {/* Left Side: Campus Visual matching 02_Login_Page.png */}
        <div className="hidden sm:flex w-[38%] relative shrink-0 bg-sky-200 overflow-hidden items-stretch">
          <img
            src="/assets/Login_Page_Original_Campus_Image.png"
            alt="Campus Architecture"
            className="w-full h-full object-cover object-left"
          />
        </div>

        {/* Right Side: Clean White Login Form - Top to Bottom distributed layout */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between bg-white">
          
          {/* Top: Header */}
          <div className="text-center space-y-0.5">
            <div className="inline-flex w-9 h-9 rounded-2xl bg-[#1e6bff] items-center justify-center text-white shadow-md shadow-blue-500/25 mb-1 mx-auto">
              <GraduationCap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Smart Campus
            </h1>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-800">
              Welcome Back!
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">
              Login to continue your journey
            </p>
          </div>

          {/* Middle: Form Inputs & Error */}
          <form onSubmit={handleSubmit} className="space-y-2.5 my-auto py-2">
            {/* Error Banner */}
            {error && (
              <div className="p-1.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-2 text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                <span className="flex-1 text-[10px]">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e6bff] focus:border-transparent transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-8 pr-8 py-1.5 sm:py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e6bff] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#1e6bff] focus:ring-[#1e6bff]"
                />
                <span className="text-slate-600 font-medium text-[10px]">Remember Me</span>
              </label>

              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Please contact the campus administrator to reset your credentials.');
                }}
                className="font-semibold text-[#1e6bff] hover:text-blue-700 transition-colors text-[10px]"
              >
                Forgot Password?
              </a>
            </div>

            {/* Bottom: Primary Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-5 rounded-xl bg-[#1e6bff] hover:bg-blue-600 active:scale-[0.99] text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
