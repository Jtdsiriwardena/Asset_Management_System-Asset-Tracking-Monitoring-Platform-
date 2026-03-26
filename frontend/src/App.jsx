import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/AssetList';
import AssetForm from './pages/AssetForm';
import AssetDetail from './pages/AssetDetail';
import Unauthorized from './pages/Unauthorized';
import QRManagement from './pages/QRManagement';
import AssignmentList from './pages/assignments/AssignmentList';
import AssignmentForm from './pages/assignments/AssignmentForm';
import AssignmentDetail from './pages/assignments/AssignmentDetail';
import AuditLogs from './pages/history/AuditLogs';
import RetentionPolicies from './pages/history/RetentionPolicies';
import Categories from './pages/Categories';
import HomePage from './pages/HomePage';
import NotificationCenter from './components/notifications/NotificationCenter';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <Router>
      <AuthProvider>
         <NotificationProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected routes - accessible to both roles */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Asset routes */}
          <Route
            path="/assets"
            element={
              <ProtectedRoute>
                <AssetList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assets/new"
            element={
              <ProtectedRoute>
                <AssetForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assets/:id"
            element={
              <ProtectedRoute>
                <AssetDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assets/:id/edit"
            element={
              <ProtectedRoute>
                <AssetForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/qr-management"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <QRManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assignments"
            element={
              <ProtectedRoute>
                <AssignmentList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assignments/new"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AssignmentForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assignments/:id"
            element={
              <ProtectedRoute>
                <AssignmentDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/history/logs"
            element={
              <ProtectedRoute>
                <AuditLogs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/history/retention"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <RetentionPolicies />
              </ProtectedRoute>
            }
          />

          <Route
            path="/categories"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Categories />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationCenter />
                
              </ProtectedRoute>
            }/>

          {/* Admin only routes - example */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <div>Admin Panel (Coming Soon)</div>
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard or login based on auth */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 route */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900">404</h1>
                <p className="text-gray-600">Page not found</p>
              </div>
            </div>
          } />
        </Routes>
        </NotificationProvider>
      </AuthProvider>

    </Router>
  );
}

export default App;