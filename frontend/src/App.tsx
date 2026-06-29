import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AdminPage from './app/admin/page';
import ReceptionPage from './app/reception/page';
import DoctorPage from './app/doctor/page';
import PharmacyPage from './app/pharmacy/page';
import AuthPage from './app/auth/page';
import Providers from './components/providers';
export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />
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
