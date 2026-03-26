import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QRScanner from './QRScanner';
import { 
  Scan, 
  LogOut, 
  LayoutDashboard, 
  Package, 
  Users, 
  QrCode, 
  History,
  Menu,
  X,
  ChevronDown,
  Grid,
  FolderTree
} from 'lucide-react';
import NotificationBell from './notifications/NotificationBell';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showScanner, setShowScanner] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard, show: true },
    { path: '/assets', name: 'Assets', icon: Package, show: true },
    { path: '/assignments', name: 'Assignments', icon: Users, show: true },
  ];

  const adminLinks = [
    { path: '/categories', name: 'Categories', icon: FolderTree },
    { path: '/qr-management', name: 'QR Management', icon: QrCode },
    { path: '/history/logs', name: 'Audit Logs', icon: History },
  ];

  return (
    <>
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and main navigation */}
            <div className="flex items-center">
          
              {/* Logo/Brand */}
              <Link to="/dashboard" className="flex items-center">
                <Grid className="h-8 w-8 text-blue-600 mr-2" />
                <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">
                  Asset Management
                </h1>
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex ml-10 space-x-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 flex items-center ${
                      isActive(link.path)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <link.icon className="w-4 h-4 mr-2" />
                    {link.name}
                  </Link>
                ))}

                {/* Admin Dropdown */}
                {isAdmin && (
                  <div className="relative ml-2">
                    <button
                      onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                        adminDropdownOpen || adminLinks.some(link => isActive(link.path))
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Admin
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>

                    {/* Dropdown Menu */}
                    {adminDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setAdminDropdownOpen(false)}
                        />
                        <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                          {adminLinks.map((link) => (
                            <Link
                              key={link.path}
                              to={link.path}
                              className={`block px-4 py-2 text-sm ${
                                isActive(link.path)
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                              onClick={() => setAdminDropdownOpen(false)}
                            >
                              <div className="flex items-center">
                                <link.icon className="w-4 h-4 mr-2" />
                                {link.name}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side - User info and actions */}
            <div className="flex items-center space-x-4">
              {/* QR Scanner Button */}
              <button
                onClick={() => setShowScanner(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-150 relative group"
                title="Scan QR Code"
              >
                <Scan className="w-5 h-5" />
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
                  Scan QR
                </span>
              </button>
                    <NotificationBell />

              {/* User Info */}
              <div className="hidden sm:block">
                <span className="text-sm text-gray-700">
                  Welcome, <span className="font-medium">{user?.first_name || user?.username}</span>
                </span>
                <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {user?.role}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-2">
            <div className="px-4 space-y-1">
              {/* Mobile User Info */}
              <div className="px-3 py-2 bg-gray-50 rounded-lg mb-2">
                <p className="text-sm text-gray-600">Logged in as:</p>
                <p className="font-medium text-gray-900">{user?.first_name || user?.username}</p>
                <p className="text-xs text-gray-500 mt-1">Role: {user?.role}</p>
              </div>

              {/* Mobile Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(link.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <link.icon className="w-5 h-5 mr-3" />
                    {link.name}
                  </div>
                </Link>
              ))}

              {/* Mobile Admin Links */}
              {isAdmin && (
                <>
                  <div className="border-t border-gray-200 my-2 pt-2">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Admin
                    </p>
                  </div>
                  {adminLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        isActive(link.path)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <link.icon className="w-5 h-5 mr-3" />
                        {link.name}
                      </div>
                    </Link>
                  ))}
                </>
              )}

              {/* Mobile Logout */}
              <div className="border-t border-gray-200 my-2 pt-2">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  <div className="flex items-center">
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner onClose={() => setShowScanner(false)} />
      )}
    </>
  );
};

export default Navbar;