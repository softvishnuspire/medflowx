'use client';

import React, { useState, useEffect } from 'react';
import TrueUpLogo from '@/components/ui/trueup-logo';
import {
  Stethoscope,
  Shield,
  Users,
  HardDrive,
  Mail,
  Lock,
  ChevronDown,
  Check,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface RoleOption {
  id: string;
  name: string;
  dbRoleName: string;
  description: string;
  path: string;
  defaultEmail: string;
  icon: React.ComponentType<any>;
  badgeColor: string;
  iconColor: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'admin',
    name: 'Administrator',
    dbRoleName: 'Administrator',
    description: 'Full system access',
    path: '/admin',
    defaultEmail: 'sarahpost@trueupmedia.com', // Prefilled as in screenshot
    icon: Shield,
    badgeColor: 'bg-blue-600/10 border-blue-500/20 text-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.15)]',
    iconColor: 'text-blue-400'
  },
  {
    id: 'reception',
    name: 'Receptionist',
    dbRoleName: 'Receptionist',
    description: 'Patient desk & billing services',
    path: '/reception',
    defaultEmail: 'sarah@medflowx.com',
    icon: Users,
    badgeColor: 'bg-teal-600/10 border-teal-500/20 text-teal-400 shadow-[0_0_12px_rgba(13,148,136,0.15)]',
    iconColor: 'text-teal-400'
  },
  {
    id: 'doctor',
    name: 'Doctor / Consultant',
    dbRoleName: 'Doctor',
    description: 'Clinical queue & patient EHR',
    path: '/doctor',
    defaultEmail: 'varma@medflowx.com',
    icon: Stethoscope,
    badgeColor: 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(5,150,105,0.15)]',
    iconColor: 'text-emerald-400'
  },
  {
    id: 'pharmacy',
    name: 'Pharmacist',
    dbRoleName: 'Pharmacist',
    description: 'Medication dispense & inventory logs',
    path: '/pharmacy',
    defaultEmail: 'alex@medflowx.com',
    icon: HardDrive,
    badgeColor: 'bg-amber-600/10 border-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(217,119,6,0.15)]',
    iconColor: 'text-amber-400'
  }
];

export default function AuthPage() {
  const [activeRole, setActiveRole] = useState<RoleOption>(ROLES[0]);
  const [email, setEmail] = useState<string>(ROLES[0].defaultEmail);
  const [password, setPassword] = useState<string>('password123');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Update email when active role changes
  const handleRoleChange = (role: RoleOption) => {
    setActiveRole(role);
    setEmail(role.defaultEmail);
    setErrorMsg(null);
    setIsDropdownOpen(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);

    // Simulated network latencies for a premium login feedback cycle
    setTimeout(() => {
      try {
        const userProfile = {
          email: email,
          role: activeRole.id === 'admin' ? 'Admin' 
                : activeRole.id === 'reception' ? 'Reception'
                : activeRole.id === 'doctor' ? 'Doctor'
                : 'Pharmacy',
          name: activeRole.id === 'admin' ? 'Sarah Connor (Admin)' 
                : activeRole.id === 'reception' ? 'Sarah Connor'
                : activeRole.id === 'doctor' ? 'Dr. Phanindra Varma'
                : 'Alex Mercer',
          avatarCode: activeRole.id === 'admin' ? 'AD'
                      : activeRole.id === 'reception' ? 'SC'
                      : activeRole.id === 'doctor' ? 'PV'
                      : 'AM'
        };
        localStorage.setItem('medflowx_logged_in_user', JSON.stringify(userProfile));

        // Redirect to active workspace path
        window.location.href = activeRole.path;
      } catch (err: any) {
        setErrorMsg('Authentication failed. Please try again.');
        setLoading(false);
      }
    }, 1200);
  };

  const ActiveIcon = activeRole.icon;

  return (
    <div className="relative min-h-screen bg-[#040812] flex items-center justify-center p-4 md:p-6 overflow-hidden select-none font-body">
      {/* Background radial glowing circles matching the screenshot backdrop */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main card grid */}
      <div className="relative z-10 w-full max-w-4xl bg-[#0a0d16]/95 border border-[#1b253b]/40 rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col md:flex-row backdrop-blur-md">
        
        {/* Left Panel: Welcome and TrueUp Media Branding */}
        <div className="md:w-[42%] bg-[#080b13] p-10 md:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-[#1b253b]/30">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            
            {/* Custom styled logo box container */}
            <TrueUpLogo className="w-52 h-24 mb-10 shadow-inner" />
            
            <h2 className="text-white text-3xl font-extrabold tracking-tight font-heading leading-tight">
              Welcome Back
            </h2>
            
            <p className="text-zinc-400 text-sm leading-relaxed mt-4 max-w-xs font-medium">
              Access your personalized dashboard by selecting your designated role below.
            </p>
          </div>
        </div>

        {/* Right Panel: Input Fields and Selector */}
        <div className="flex-1 p-10 md:p-12 flex flex-col justify-center bg-[#0d111d]/90">
          <div className="max-w-md w-full mx-auto">
            
            {/* Title headers */}
            <div className="mb-8">
              <h3 className="text-white text-2xl font-bold tracking-tight font-heading">
                Select your role
              </h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-1.5 font-heading">
                Choose your workspace to continue
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignIn} className="space-y-5">
              
              {/* Workspace Role Dropdown Selector */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2 font-heading">
                  Workspace Role
                </label>
                
                {/* Custom Button Selector */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={loading}
                  className="w-full flex items-center justify-between bg-[#0a0d16] border border-[#1d293f] hover:border-zinc-700 transition-all rounded-2xl p-3.5 px-4 text-left cursor-pointer group focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Glowing Left Icon Badge */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${activeRole.badgeColor}`}>
                      <ActiveIcon className="h-5.5 w-5.5" />
                    </div>
                    <div>
                      <span className="block text-base font-bold text-white leading-tight">
                        {activeRole.name}
                      </span>
                      <span className="block text-[11px] text-zinc-500 font-semibold mt-1">
                        {activeRole.description}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="h-5 w-5 text-zinc-500 transition-transform duration-300" />
                </button>

                {/* Open selector floating dropdown */}
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20 cursor-default"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 mt-2 bg-[#0c101a] border border-[#1e2a44] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden z-30 animate-slide-in">
                      <div className="p-2 space-y-1">
                        {ROLES.map((role) => {
                          const RoleIcon = role.icon;
                          const isSelected = activeRole.id === role.id;

                          return (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => handleRoleChange(role)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#1b253b] text-cyan-400'
                                  : 'hover:bg-[#131b2c] text-zinc-300 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3.5">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                                  isSelected ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-[#0a0d16] border-[#1d293f]'
                                } ${role.iconColor}`}>
                                  <RoleIcon className="h-5 w-5" />
                                </div>
                                <div>
                                  <span className="block text-sm font-bold leading-tight">
                                    {role.name}
                                  </span>
                                  <span className="block text-[10px] text-zinc-500 font-semibold mt-0.5">
                                    {role.description}
                                  </span>
                                </div>
                              </div>
                              {isSelected && <Check className="h-5 w-5 text-cyan-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Email Address Input (Light grayish tint with dark text as in screenshot) */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2 font-heading">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full bg-[#edf2f6] border border-[#c9d3e0] focus:border-[#a0aec0] focus:bg-white text-slate-800 text-sm font-semibold rounded-2xl py-3.5 pl-12 pr-4 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* Password Input (Light grayish tint with dark text as in screenshot) */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2 font-heading">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full bg-[#edf2f6] border border-[#c9d3e0] focus:border-[#a0aec0] focus:bg-white text-slate-800 text-sm font-semibold rounded-2xl py-3.5 pl-12 pr-4 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {/* Forgot password link */}
                <div className="flex justify-end mt-2">
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Demo Note: Password reset link is disabled in the preview environment.');
                    }}
                    className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-semibold text-red-400">
                  {errorMsg}
                </div>
              )}

              {/* Sign In CTA Button (Glowing gradient cyan as in screenshot) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-[#0284c7] hover:from-sky-400 hover:to-[#0284c7]/90 active:scale-[0.98] text-white text-sm font-black py-4 px-4 rounded-2xl transition-all shadow-[0_6px_24px_rgba(14,165,233,0.35)] hover:shadow-[0_10px_32px_rgba(14,165,233,0.55)] disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none cursor-pointer focus:outline-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    <span>Signing in to workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as {activeRole.dbRoleName}</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
