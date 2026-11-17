import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Building2,
  Calendar,
  QrCode,
  Sparkles,
  Award,
  ChevronRight,
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="h-screen w-screen max-h-screen relative flex flex-col justify-between overflow-hidden font-sans select-none bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/assets/landing-bg.png')` }}
    >
      {/* Dynamic Ambient Gradient Overlays matching 01_Landing_Page.png */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#051026] via-[#051026]/75 to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#051026]/90 via-transparent to-transparent pointer-events-none"></div>

      {/* 1. TOP NAVIGATION BAR */}
      <header className="relative z-20 max-w-7xl w-full mx-auto px-6 sm:px-10 pt-5 sm:pt-6 pb-2 flex items-center justify-between shrink-0">
        {/* Brand Logo */}
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-all">
            <GraduationCap className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-xl font-black tracking-tight text-white drop-shadow">Smart Campus</span>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 lg:space-x-10 text-xs font-bold tracking-wide text-slate-200">
          <a href="#home" className="text-white hover:text-white transition-colors">Home</a>
          <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
          <a href="#about" className="text-slate-300 hover:text-white transition-colors">About</a>
          <a href="#contact" className="text-slate-300 hover:text-white transition-colors">Contact</a>
        </nav>

        {/* Right CTA Button */}
        <div>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 rounded-full bg-white hover:bg-slate-100 text-primary-600 hover:text-primary-700 font-extrabold text-xs shadow-md shadow-white/10 active:scale-95 transition-all"
          >
            Login
          </button>
        </div>
      </header>

      {/* 2. HERO CONTENT SECTION */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 sm:px-10 py-2 sm:py-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1 min-h-0">
        {/* Left Column: Headline & Action Buttons */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-5">
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] xl:text-[64px] font-black tracking-tight leading-[1.08]">
              <span className="block text-white drop-shadow-md">AI-Powered</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400 drop-shadow">
                Smart Campus
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg font-bold text-white/95 tracking-wide pt-1">
              Learn • Connect • Grow
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed font-medium">
            A next-gen college management system for a smarter academic journey.
          </p>

          {/* Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              onClick={() => navigate('/login')}
              className="px-7 py-3 rounded-full bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-pill flex items-center space-x-2 transition-all"
            >
              <span>Get Started</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>

            <button
              onClick={() => navigate('/login')}
              className="px-7 py-3 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Right Column: 3 Floating Feature Pills stacked over the Campus Building background */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-end justify-center space-y-4 lg:pr-8 xl:pr-12">
          {/* Floating Pill 1: AI Analytics */}
          <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-full shadow-2xl border border-white/80 flex items-center space-x-3.5 hover:scale-105 transition-all cursor-pointer min-w-[210px]">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 fill-sky-600" />
            </div>
            <span className="text-slate-900 font-black text-xs sm:text-sm tracking-tight">AI Analytics</span>
          </div>

          {/* Floating Pill 2: QR Attendance */}
          <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-full shadow-2xl border border-white/80 flex items-center space-x-3.5 hover:scale-105 transition-all cursor-pointer min-w-[210px]">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4 stroke-[2.4]" />
            </div>
            <span className="text-slate-900 font-black text-xs sm:text-sm tracking-tight">QR Attendance</span>
          </div>

          {/* Floating Pill 3: Smart Timetable */}
          <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-full shadow-2xl border border-white/80 flex items-center space-x-3.5 hover:scale-105 transition-all cursor-pointer min-w-[210px]">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 stroke-[2.4]" />
            </div>
            <span className="text-slate-900 font-black text-xs sm:text-sm tracking-tight">Smart Timetable</span>
          </div>
        </div>
      </main>

      {/* 3. BOTTOM STATS BANNER */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 sm:px-10 pb-5 sm:pb-7 pt-2 shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-4 border-t border-white/10">
          {/* Stat 1: 10K+ Students */}
          <div className="flex items-center space-x-3.5 sm:space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-sky-400 shrink-0">
              <Users className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-none">10K+</p>
              <p className="text-[11px] sm:text-xs text-sky-200/80 font-bold mt-1 tracking-wide">Students</p>
            </div>
          </div>

          {/* Stat 2: 500+ Faculty */}
          <div className="flex items-center space-x-3.5 sm:space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-sky-400 shrink-0">
              <GraduationCap className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-none">500+</p>
              <p className="text-[11px] sm:text-xs text-sky-200/80 font-bold mt-1 tracking-wide">Faculty</p>
            </div>
          </div>

          {/* Stat 3: 50+ Departments */}
          <div className="flex items-center space-x-3.5 sm:space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-sky-400 shrink-0">
              <Building2 className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-none">50+</p>
              <p className="text-[11px] sm:text-xs text-sky-200/80 font-bold mt-1 tracking-wide">Departments</p>
            </div>
          </div>

          {/* Stat 4: 100% Smart Campus */}
          <div className="flex items-center space-x-3.5 sm:space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-sky-400 shrink-0">
              <Award className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-none">100%</p>
              <p className="text-[11px] sm:text-xs text-sky-200/80 font-bold mt-1 tracking-wide">Smart Campus</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
