// src/components/layout/footer.tsx
import React from 'react';
import Link from 'next/link';
import { 
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Youtube,
  Send,
  ArrowRight,
  BookOpen
} from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'মেনু',
      links: [
        { name: 'বিষয়সমূহ', href: '/subjects' },
        { name: 'কুইজ', href: '/quizzes' },
        { name: 'লিডারবোর্ড', href: '/leaderboard' },
        { name: 'ব্লগ', href: '/blog' },
      ],
    },
    {
      title: 'সাপোর্ট',
      links: [
        { name: 'সাহায্য কেন্দ্র', href: '/help' },
        { name: 'যোগাযোগ', href: '/contact' },
        { name: 'প্রাইভেসি পলিসি', href: '/privacy' },
        { name: 'টার্মস অফ সার্ভিস', href: '/terms' },
      ],
    },
    {
      title: 'রিসোর্স',
      links: [
        { name: 'বিসিএস গাইড', href: '/guide' },
        { name: 'সিলেবাস', href: '/syllabus' },
        { name: 'পরীক্ষার নিয়ম', href: '/exam-rules' },
        { name: 'সাকসেস স্টোরি', href: '/success-stories' },
      ],
    },
  ];

  const socialLinks = [
    { name: 'Facebook', href: '#', icon: Facebook, color: 'hover:bg-blue-600 hover:text-white' },
    { name: 'Twitter', href: '#', icon: Twitter, color: 'hover:bg-sky-500 hover:text-white' },
    { name: 'YouTube', href: '#', icon: Youtube, color: 'hover:bg-rose-600 hover:text-white' },
  ];

  return (
    <footer className="relative bg-slate-950 text-slate-300 border-t border-slate-900 overflow-hidden font-sans">
      {/* Visual Accent Glow Top Border (Blue to Purple) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500"></div>

      {/* Decorative background visual blobs */}
      <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -top-48 -left-48 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Footer Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          
          {/* Brand Info & Address */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.25)] group-hover:scale-105 transition-transform duration-300">
                <BookOpen className="w-5.5 h-5.5 text-white" />
              </div>
              <span className="text-2xl font-bold font-bengali text-white group-hover:text-blue-500 transition-colors duration-300">
                বিসিএস প্রস্তুতি
              </span>
            </Link>
            <p className="text-slate-400 font-bengali leading-relaxed text-sm max-w-md">
              বাংলাদেশ সিভিল সার্ভিস পরীক্ষার জন্য সম্পূর্ণ অনলাইন প্রস্তুতিমূলক প্ল্যাটফর্ম। 
              আধুনিক ও ইন্টারঅ্যাক্টিভ প্রযুক্তি, কাস্টমাইজড প্র্যাকটিস কুইজ এবং সঠিক নির্দেশনায় আপনার বিসিএস পাসের স্বপ্ন নিশ্চিত করুন।
            </p>
            
            {/* Structured Contact Info */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center space-x-3.5 text-slate-300 group/contact">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-blue-500 group-hover/contact:bg-blue-500 group-hover/contact:text-white transition-all duration-300">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold tracking-wider font-bengali">+৮৮ ০১৭XX-XXXXXX</span>
              </div>
              <div className="flex items-center space-x-3.5 text-slate-300 group/contact">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-blue-500 group-hover/contact:bg-blue-500 group-hover/contact:text-white transition-all duration-300">
                  <Mail className="w-4 h-4" />
                </div>
                <a href="mailto:support@bcspreparation.com" className="text-sm font-semibold hover:text-blue-500 transition-colors">support@bcspreparation.com</a>
              </div>
              <div className="flex items-center space-x-3.5 text-slate-300 group/contact">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-blue-500 group-hover/contact:bg-blue-500 group-hover/contact:text-white transition-all duration-300">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold font-bengali">ঢাকা, বাংলাদেশ</span>
              </div>
            </div>
          </div>

          {/* Structured Link Columns */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-5">
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-bengali border-l-2 border-blue-600 pl-3">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center text-slate-400 hover:text-blue-500 font-medium font-bengali text-sm transition-all duration-300 hover:translate-x-1 group"
                    >
                      <ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-blue-500" />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mid-Footer Divider & Socials / Newsletter */}
        <div className="border-t border-slate-900 mt-16 pt-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            {/* Social Icons with Glow Effects */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className={`w-11 h-11 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 ${social.color} transition-all duration-300 transform hover:scale-105 shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-lg`}
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
            
            {/* Redesigned Glassmorphic Newsletter Sign-up */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto max-w-md">
              <div className="text-center sm:text-left">
                <p className="text-white font-bold font-bengali text-sm">
                  নিউজলেটার সাবস্ক্রাইব করুন
                </p>
                <p className="text-slate-500 text-xs font-bengali mt-0.5">
                  নতুন আপডেট এবং ফিচারের তথ্য সবার আগে পান।
                </p>
              </div>
              <div className="flex w-full sm:w-auto relative group">
                <input
                  type="email"
                  placeholder="আপনার ইমেইল"
                  className="w-full sm:w-64 px-4.5 py-3 bg-slate-900/50 border border-slate-850 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-305"
                />
                <button className="absolute right-1.5 top-1.5 bottom-1.5 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white px-3.5 rounded-lg flex items-center justify-center transition-all duration-300 hover:shadow-md active:scale-95 cursor-pointer">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Credits & Privacy Links */}
      <div className="bg-slate-950 border-t border-slate-900/60 py-6 relative z-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-center md:text-left font-bengali">
              © {currentYear} বিসিএস প্রস্তুতি. সকল অধিকার সংরক্ষিত।
            </p>
            <div className="flex flex-wrap justify-center gap-6 font-bengali">
              <Link href="/privacy" className="hover:text-blue-500 transition-colors">
                গোপনীয়তা নীতি
              </Link>
              <span className="text-slate-800">|</span>
              <Link href="/terms" className="hover:text-blue-500 transition-colors">
                ব্যবহারের শর্তাবলী
              </Link>
              <span className="text-slate-800">|</span>
              <Link href="/sitemap" className="hover:text-blue-500 transition-colors">
                সাইটম্যাপ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;