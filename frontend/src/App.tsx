import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AdminPage from './app/admin/page';
import ReceptionPage from './app/reception/page';
import DoctorPage from './app/doctor/page';
import PharmacyPage from './app/pharmacy/page';
import AuthPage from './app/auth/page';
import Providers from './components/providers';
import { Stethoscope, ShieldCheck, Users, Activity, HardDrive, Key } from 'lucide-react';

function LandingDashboard() {
  const portals = [
    {
      name: 'Reception Portal',
      path: '/reception',
      desc: 'Patient registrations, OPD visits scheduler, Live queues, and consultation payments.',
      icon: Users,
      gradient: 'from-teal-600 to-emerald-500',
    },
    {
      name: 'Doctor Portal',
      path: '/doctor',
      desc: 'Real-time patient queue consultations, EHR notes, drug prescriptions, and EHR logs.',
      icon: Activity,
      gradient: 'from-emerald-600 to-green-500',
    },
    {
      name: 'Admin Portal',
      path: '/admin',
      desc: 'Staff user registration accounts, permission boundaries, live metrics, and finance audits.',
      icon: ShieldCheck,
      gradient: 'from-green-700 to-emerald-650',
    },
    {
      name: 'Pharmacy Portal',
      path: '/pharmacy',
      desc: 'Prescription lookup, medicine issuing, billing receipts, and inventory logs.',
      icon: HardDrive,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      name: 'Authentication',
      path: '/auth',
      desc: 'Log in to your credentials file to authorize access tokens.',
      icon: Key,
      gradient: 'from-green-800 to-teal-650',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-body text-zinc-700">
      <header className="h-20 border-b border-zinc-150 bg-white px-8 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary text-white shadow-inner">
            <Stethoscope className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-zinc-900 tracking-tight text-xl font-heading">
            Medflow<span className="text-primary">X</span>
          </span>
        </div>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-heading">
          Central Terminal Router
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="text-center space-y-3 mb-12">
          <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight font-heading">
            Welcome to Medflow<span className="text-primary">X</span>
          </h1>
          <p className="text-zinc-500 text-sm max-w-xl mx-auto leading-relaxed font-medium">
            Select a department portal below to access the clinic terminals. The system automatically synchronizes databases and live queues.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link
                key={portal.path}
                to={portal.path}
                className={`p-6 border rounded-2xl flex flex-col justify-between h-56 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group bg-white shadow-sm`}
              >
                <div>
                  <div className={`p-2.5 rounded-xl inline-block bg-gradient-to-br ${portal.gradient} text-white shadow-sm`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-extrabold text-zinc-900 text-lg mt-4 font-heading group-hover:text-primary transition-colors">
                    {portal.name}
                  </h4>
                  <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
                    {portal.desc}
                  </p>
                </div>
                <span className="text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform duration-200 block mt-4">
                  Open Terminal →
                </span>
              </Link>
            );
          })}
        </div>
      </main>

      <footer className="py-6 border-t border-zinc-150 bg-white text-center text-xs text-zinc-400 font-semibold font-heading">
        MedflowX Clinic System Terminal v2.1.0 • Running React 19 + Vite 6
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingDashboard />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/reception" element={<ReceptionPage />} />
          <Route path="/doctor" element={<DoctorPage />} />
          <Route path="/pharmacy" element={<PharmacyPage />} />
          <Route path="*" element={<Link to="/" className="text-center py-10 block text-primary font-bold">Page Not Found. Go back to Home</Link>} />
        </Routes>
      </BrowserRouter>
    </Providers>
  );
}
