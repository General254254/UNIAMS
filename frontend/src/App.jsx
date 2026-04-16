import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { UnitProvider } from './context/UnitContext';

import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Toast from './components/Toast';

import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import RepDashboard from './pages/RepDashboard';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <UnitProvider>
          <Toaster position="bottom-right" toastOptions={{ className: 'hidden' }} />
          <Toast />

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/student" replace />} />

            <Route path="/student" element={
              <ProtectedRoute role="student">
                <Navbar><StudentDashboard /></Navbar>
              </ProtectedRoute>
            } />

            <Route path="/lecturer" element={
              <ProtectedRoute role="lecturer">
                <Navbar><LecturerDashboard /></Navbar>
              </ProtectedRoute>
            } />

            <Route path="/rep" element={
              <ProtectedRoute role="rep">
                <Navbar><RepDashboard /></Navbar>
              </ProtectedRoute>
            } />
          </Routes>
        </UnitProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
