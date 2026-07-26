import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import AdminPage from './app/admin/page';
import ReceptionPage from './app/reception/page';
import DoctorPage from './app/doctor/page';
import PharmacyPage from './app/pharmacy/page';
import AuthPage from './app/auth/page';
import Providers from './components/providers';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: string;
}

function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const savedUser = localStorage.getItem('medflowx_logged_in_user');
  if (!savedUser) {
    return <Navigate to="/auth" replace />;
  }

  try {
    const user = JSON.parse(savedUser);
    if (!user || user.role !== allowedRole) {
      return <Navigate to="/auth" replace />;
    }
  } catch (e) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="Admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reception"
            element={
              <ProtectedRoute allowedRole="Reception">
                <ReceptionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRole="Doctor">
                <DoctorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy"
            element={
              <ProtectedRoute allowedRole="Pharmacy">
                <PharmacyPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Link to="/" className="text-center py-10 block text-primary font-bold">Page Not Found. Go back to Home</Link>} />
        </Routes>
      </BrowserRouter>
    </Providers>
  );
}
