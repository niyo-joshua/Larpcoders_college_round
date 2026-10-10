import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme.jsx';
import { AdminAuthProvider, useAdminAuth } from './hooks/useAdminAuth.jsx';

import Landing from './pages/Landing.jsx';
import Verify from './pages/Verify.jsx';
import ReportForm from './pages/ReportForm.jsx';
import ReportSuccess from './pages/ReportSuccess.jsx';
import Track from './pages/Track.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminReportDetail from './pages/AdminReportDetail.jsx';
import SecurityDemo from './pages/SecurityDemo.jsx';

function RequireAdmin({ children }) {
  const { isAuthed } = useAdminAuth();
  if (!isAuthed) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/report/new" element={<ReportForm />} />
              <Route path="/report/success" element={<ReportSuccess />} />
              <Route path="/track" element={<Track />} />
              <Route path="/security" element={<SecurityDemo />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminDashboard />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/reports/:id"
                element={
                  <RequireAdmin>
                    <AdminReportDetail />
                  </RequireAdmin>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AdminAuthProvider>
    </ThemeProvider>
  );
}