// components/layout/header.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  FolderOpen, 
  BookOpen, 
  Target, 
  Award, 
  HelpCircle, 
  Trophy, 
  MessageSquare, 
  User, 
  History, 
  Search, 
  Lock, 
  TrendingUp, 
  LogOut, 
  ChevronDown, 
  Menu, 
  X,
  Coins,
  Sparkles,
  LayoutDashboard,
  Bell,
  Settings,
  Sun,
  Moon,
  CaseSensitive,
  Paintbrush
} from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  
  const { theme, setTheme, fontSize, setFontSize } = useTheme();

  // Handle scroll effect for glassmorphic navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle clicks outside of dropdown, mobile menu and reader menu to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
      if (readerRef.current && !readerRef.current.contains(event.target as Node)) {
        setIsReaderOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  const isActivePath = (path: string) => pathname === path;
  const isActiveSubPath = (path: string) => pathname.startsWith(path) && path !== '/';

  const navLinks = [
    { href: '/', label: 'হোম', icon: Home, exact: true },
    { href: '/categories', label: 'ক্যাটাগরি', icon: FolderOpen, exact: false },
    { href: '/subjects', label: 'বিষয়সমূহ', icon: BookOpen, exact: false },
    { href: '/practice', label: 'প্র্যাকটিস', icon: Target, exact: false },
    { href: '/quizzes', label: 'কুইজ', icon: Award, exact: false },
    { href: '/questions', label: 'প্রশ্নব্যাংক', icon: HelpCircle, exact: false },
    { href: '/leaderboard', label: 'লিডারবোর্ড', icon: Trophy, exact: false },
    { href: '/discussions', label: 'আলোচনা', icon: MessageSquare, exact: false}
  ];

  const userMenuItems = [
    { href: '/dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { href: '/practice/history', label: 'প্র্যাকটিস ইতিহাস', icon: History },
    { href: '/practice/all-answer', label: 'উত্তর বিশ্লেষণ', icon: Search },
    { href: '/profile', label: 'প্রোফাইল', icon: User },
    { href: '/profile/change-password', label: 'পাসওয়ার্ড পরিবর্তন', icon: Lock },
    { href: '/progress', label: 'প্রগতি', icon: TrendingUp },
  ];

  // Dynamically calculate user progress level
  const userCoins = user?.coins || 0;
  const userLevel = Math.floor(userCoins / 100) + 1;
  const levelProgress = userCoins % 100;

  const activeUserMenuItems = [...userMenuItems];
  if (user?.user_type === 'admin') {
    activeUserMenuItems.push({ href: '/admin', label: 'এডমিন প্যানেল', icon: Settings });
  }

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/85 backdrop-blur-md shadow-md border-b border-slate-100 py-1.5' 
        : 'bg-white border-b border-slate-100 py-2.5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 focus:outline-none transition-all duration-200 cursor-pointer"
              aria-label="মেনু খুলুন"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Premium Logo (Blue themed) */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.25)] group-hover:shadow-[0_4px_20px_rgba(37,99,235,0.4)] group-hover:scale-105 transition-all duration-300">
                <BookOpen className="w-5.5 h-5.5 text-white" />
              </div>
              <div className="leading-tight">
                <span className="block font-extrabold text-lg text-slate-950 font-bengali group-hover:text-blue-600 transition-colors duration-300">
                  বিসিএস প্রস্তুতি
                </span>
                <span className="block text-[9px] font-semibold text-slate-400 font-bengali uppercase tracking-widest group-hover:text-slate-500 transition-colors">
                  মুক্ত জ্ঞানের আলো
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Link Menu - Highly optimized for fitting and spacing */}
          <nav className="hidden md:flex items-center space-x-0.5 xl:space-x-1 overflow-x-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.exact ? isActivePath(link.href) : isActiveSubPath(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 xl:px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 group relative ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border border-blue-100/55 shadow-sm'
                      : 'text-slate-655 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'
                  }`} />
                  <span className="font-bengali">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Auth Action Center */}
          <div className="flex items-center space-x-3.5 flex-shrink-0">
            {/* Theme & Reader Settings Panel */}
            <div className="relative" ref={readerRef}>
              <button
                onClick={() => setIsReaderOpen(!isReaderOpen)}
                className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
                  isReaderOpen 
                    ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
                title="পঠন সেটিংস (থিম ও ফন্ট)"
              >
                <CaseSensitive className="w-5 h-5" />
              </button>
              
              {isReaderOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] p-5 z-50 border border-slate-100/90 animate-in fade-in-50 slide-in-from-top-4 duration-300">
                  <h3 className="font-extrabold text-sm text-slate-900 font-bengali mb-4 flex items-center border-b border-slate-100 pb-2">
                    <Paintbrush className="w-4 h-4 text-primary-500 mr-2" />
                    পঠন ও প্রদর্শন সেটিংস
                  </h3>
                  
                  {/* Theme Section */}
                  <div className="mb-5">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-400 font-bengali block mb-2.5">ডিসপ্লে থিম নির্বাচন করুন</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setTheme('light')}
                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                          theme === 'light'
                            ? 'border-primary-500 bg-primary-50/50 text-primary-600 shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Sun className="w-4 h-4 mb-1.5" />
                        <span className="font-bengali">লাইট মোড</span>
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                          theme === 'dark'
                            ? 'border-primary-500 bg-primary-50/50 text-primary-400 shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Moon className="w-4 h-4 mb-1.5" />
                        <span className="font-bengali">ডার্ক মোড</span>
                      </button>
                      <button
                        onClick={() => setTheme('sepia')}
                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                          theme === 'sepia'
                            ? 'border-primary-500 bg-[#fbfaf5] text-[#65543c] shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={{
                          backgroundColor: theme === 'sepia' ? '#fdfaf2' : undefined,
                          borderColor: theme === 'sepia' ? '#4f46e5' : undefined,
                        }}
                      >
                        <BookOpen className="w-4 h-4 mb-1.5" />
                        <span className="font-bengali">সেপিয়া মোড</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Font Size Section */}
                  <div>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-400 font-bengali block mb-2.5">ফন্ট সাইজ নির্বাচন করুন</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { value: 'small', label: 'ছোট' },
                        { value: 'default', label: 'ডিফল্ট' },
                        { value: 'large', label: 'বড়' },
                        { value: 'xlarge', label: 'খুব বড়' },
                      ].map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setFontSize(item.value as any)}
                          className={`py-2 px-1 rounded-lg border text-[11px] font-extrabold transition-all duration-200 cursor-pointer text-center ${
                            fontSize === item.value
                              ? 'border-primary-500 bg-primary-50 text-primary-600 shadow-sm'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span className="font-bengali">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3.5">
                {/* Notification Bell */}
                <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors duration-200 hidden sm:block cursor-pointer">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                </button>

                {/* Profile Selector Trigger */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300 border cursor-pointer ${
                      isDropdownOpen 
                        ? 'bg-slate-50 border-slate-300 shadow-sm' 
                        : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    } group`}
                    aria-label="ব্যবহারকারী মেনু"
                    aria-expanded={isDropdownOpen}
                  >
                    {/* User Avatar with Ring */}
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 p-0.5 shadow-[0_2px_8px_rgba(59,130,246,0.2)] group-hover:scale-105 transition-transform duration-300">
                      <div className="w-full h-full bg-white rounded-md flex items-center justify-center text-slate-800 text-sm font-black uppercase">
                        {user?.username?.charAt(0) || 'U'}
                      </div>
                    </div>
                    {/* Username and Coin quick-view */}
                    <div className="hidden sm:block text-left leading-none">
                      <div className="text-slate-800 font-bold font-bengali text-xs group-hover:text-slate-955 transition-colors">
                        {user?.username || 'User'}
                      </div>
                      <div className="text-amber-500 text-[10px] font-bold flex items-center space-x-0.5 mt-0.5">
                        <Coins className="w-3 h-3 text-amber-500" />
                        <span>{userCoins} কয়েন</span>
                      </div>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Card */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] py-3.5 z-50 border border-slate-100/90 animate-in fade-in-50 slide-in-from-top-4 duration-300">
                      {/* User Header */}
                      <div className="px-4.5 pb-3.5 mb-2 border-b border-slate-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-[0_3px_10px_rgba(59,130,246,0.15)]">
                            {user?.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="leading-tight overflow-hidden">
                            <div className="flex items-center space-x-1.5">
                              <h4 className="font-bold text-slate-900 font-bengali truncate">{user?.username}</h4>
                              {user?.is_premium && (
                                <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider scale-90">Pro</span>
                              )}
                            </div>
                            <span className="text-slate-400 text-xs truncate block mt-0.5">{user?.email}</span>
                          </div>
                        </div>

                        {/* Level and Progression Info */}
                        <div className="mt-3.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs text-slate-600 font-bold font-bengali flex items-center space-x-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span>লেভেল {userLevel}</span>
                            </span>
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <Coins className="w-3 h-3 text-amber-500" />
                              <span>{userCoins} কয়েন</span>
                            </span>
                          </div>
                          {/* Progress bar to next level */}
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-550" style={{ width: `${levelProgress}%` }}></div>
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1 block text-right font-bengali font-semibold">পরবর্তী লেভেল: {100 - levelProgress} কয়েন বাকি</span>
                        </div>
                      </div>

                      {/* Dropdown Menu Items */}
                      <div className="max-h-72 overflow-y-auto px-1.5 space-y-0.5">
                        {activeUserMenuItems.map((item) => {
                          const ItemIcon = item.icon;
                          const isItemActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`flex items-center px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group/item ${
                                isItemActive 
                                  ? 'bg-blue-50 text-blue-600 border border-blue-100/50' 
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <div className={`p-1.5 rounded-lg mr-3 transition-colors ${
                                isItemActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover/item:bg-slate-200 group-hover/item:text-slate-655'
                              }`}>
                                <ItemIcon className="w-4 h-4" />
                              </div>
                              <span className="font-bengali flex-1">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>

                      {/* Logout Action Button */}
                      <div className="border-t border-slate-100 pt-2 mt-2 px-1.5">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors font-bengali group/logout cursor-pointer"
                        >
                          <div className="p-1.5 bg-red-50 text-red-600 rounded-lg mr-3 group-hover/logout:bg-red-100 transition-colors">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span>লগআউট</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  id="header-btn-login"
                  href="/login"
                  className="text-slate-600 hover:text-blue-600 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-slate-200 hover:border-blue-200 hover:bg-blue-50/20 font-bengali"
                >
                  লগইন
                </Link>
                <Link
                  id="header-btn-register"
                  href="/register"
                  className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 px-4.5 py-2 rounded-xl text-sm font-bold text-white transition-all duration-300 transform hover:scale-[1.02] shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.3)] font-bengali"
                >
                  নিবন্ধন
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Animated Drawer Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm animate-in fade-in-50 duration-300" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            ref={mobileMenuRef} 
            className="fixed top-20 left-4 right-4 bg-white rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-in slide-in-from-top-6 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-5 max-h-[75vh] overflow-y-auto space-y-4">
              {/* Profile card headers for logged-in users on mobile */}
              {isAuthenticated && (
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-lg">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 font-bengali text-sm leading-tight">{user?.username}</h4>
                    <div className="flex items-center space-x-1.5 text-amber-500 text-[10px] font-bold mt-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>{userCoins} কয়েন</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-550">লেভেল {userLevel}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation links grid/list */}
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const LinkIcon = link.icon;
                  const isActive = link.exact ? isActivePath(link.href) : isActiveSubPath(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      <LinkIcon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="font-bengali">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
              {/* Reader Settings on Mobile */}
              <div className="border-t border-slate-100 pt-4 mt-2">
                <h4 className="font-extrabold text-xs text-slate-400 font-bengali mb-3">পঠন সেটিংস (থিম ও ফন্ট)</h4>
                
                {/* Theme options on mobile */}
                <div className="grid grid-cols-3 gap-2 mb-3.5">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center py-2 px-2.5 rounded-xl border text-[11px] font-extrabold transition-all duration-200 cursor-pointer ${
                      theme === 'light'
                        ? 'border-primary-500 bg-primary-50 text-primary-600'
                        : 'border-slate-200 bg-slate-50 text-slate-655'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 mr-1" />
                    <span className="font-bengali">লাইট</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center py-2 px-2.5 rounded-xl border text-[11px] font-extrabold transition-all duration-200 cursor-pointer ${
                      theme === 'dark'
                        ? 'border-primary-500 bg-primary-50 text-primary-400'
                        : 'border-slate-200 bg-slate-50 text-slate-655'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 mr-1" />
                    <span className="font-bengali">ডার্ক</span>
                  </button>
                  <button
                    onClick={() => setTheme('sepia')}
                    className={`flex items-center justify-center py-2 px-2.5 rounded-xl border text-[11px] font-extrabold transition-all duration-200 cursor-pointer ${
                      theme === 'sepia'
                        ? 'border-primary-500 bg-[#fbfaf5] text-[#65543c]'
                        : 'border-slate-200 bg-slate-50 text-slate-655'
                    }`}
                    style={{
                      backgroundColor: theme === 'sepia' ? '#fdfaf2' : undefined,
                      borderColor: theme === 'sepia' ? '#4f46e5' : undefined,
                    }}
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1" />
                    <span className="font-bengali">সেপিয়া</span>
                  </button>
                </div>
                
                {/* Font Size options on mobile */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { value: 'small', label: 'ছোট' },
                    { value: 'default', label: 'ডিফল্ট' },
                    { value: 'large', label: 'বড়' },
                    { value: 'xlarge', label: 'খুব বড়' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setFontSize(item.value as any)}
                      className={`py-1.5 px-1 rounded-lg border text-[10px] font-black transition-all duration-200 cursor-pointer text-center ${
                        fontSize === item.value
                          ? 'border-primary-500 bg-primary-50 text-primary-600'
                          : 'border-slate-200 bg-slate-50 text-slate-655'
                      }`}
                    >
                      <span className="font-bengali">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Action buttons at bottom */}
              <div className="border-t border-slate-100 pt-4 mt-2">
                {!isAuthenticated ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      id="mobile-btn-login"
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:text-blue-600 border border-slate-200 font-bengali bg-slate-50/50 cursor-pointer"
                    >
                      লগইন
                    </Link>
                    <Link
                      id="mobile-btn-register"
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-bengali shadow-md cursor-pointer"
                    >
                      নিবন্ধন
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {user?.user_type === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bengali transition-colors cursor-pointer"
                      >
                        <Settings className="w-4.5 h-4.5" />
                        <span>এডমিন প্যানেল</span>
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-250 font-bengali transition-colors cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>ড্যাশবোর্ড</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 font-bengali transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>লগআউট</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}