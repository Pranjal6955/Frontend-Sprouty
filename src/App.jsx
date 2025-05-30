import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import Reminder from './pages/Reminder';
import Profile from './pages/Profile';
import GardenLog from './pages/GardenLog';
import Diagnose from './pages/Diagnose';
import { ThemeProvider } from './components/ThemeProvider';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationPopup from './components/NotificationPopup';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gardenLog"
              element={
                <ProtectedRoute>
                  <GardenLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reminder"
              element={
                <ProtectedRoute>
                  <Reminder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diagnose"
              element={
                <ProtectedRoute>
                  <Diagnose />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diagnose/:plantId"
              element={
                <ProtectedRoute>
                  <Diagnose />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <NotificationPopup />
        </NotificationProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;