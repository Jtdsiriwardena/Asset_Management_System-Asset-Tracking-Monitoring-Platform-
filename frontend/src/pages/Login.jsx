import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, LogIn, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsLoading(true);
    const result = await login(formData.username, formData.password);
    setIsLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrors({ general: result.error });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 flex-col justify-between p-12 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-5 rounded-full" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 bg-blue-400 opacity-10 rounded-full" />
          <div className="absolute -bottom-20 right-1/4 w-64 h-64 bg-indigo-400 opacity-10 rounded-full" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Logo */}
        <div className="flex items-center">
          <Package className="h-8 w-8 text-white" />
          <span className="ml-2 text-xl font-bold text-gray-100">
            Asset <span className="text-gray-100">Manager</span>
          </span>
        </div>

        {/* Center content */}
        <div className="relative">
          <div className="inline-flex items-center px-3 py-1.5 bg-white bg-opacity-15 rounded-full mb-6">
            <Shield className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-black text-sm font-medium">Enterprise-grade security</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Take control of your
            <br />
            <span className="text-blue-200">organizational assets</span>
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
            Track, manage, and optimize IT equipment, furniture, vehicles, and more — all in one powerful platform.
          </p>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { value: '99.9%', label: 'Uptime' },
              { value: '10x', label: 'Faster' },
              { value: '500+', label: 'Assets' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-blue-200 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="relative text-blue-200 text-sm">
          © {new Date().getFullYear()} AssetManager. All rights reserved.
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-gray-50">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center mb-10">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="ml-2 text-xl font-bold text-gray-900">
            Asset<span className="text-blue-600">Manager</span>
          </span>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                Create one free
              </Link>
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">
            {errors.general && (
              <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  className={`w-full px-4 py-3 rounded-xl border text-gray-900 placeholder-gray-400 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500 ${errors.username
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:bg-white'
                    }`}
                />
                {errors.username && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 pr-11 rounded-xl border text-gray-900 placeholder-gray-400 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500 ${errors.password
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:bg-white'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                  Keep me signed in
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-blue-700/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign in
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              <span>SSL Encrypted</span>
            </div>
            <div className="w-px h-3 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>99.9% Uptime</span>
            </div>
            <div className="w-px h-3 bg-gray-200" />
            <span>SOC 2 Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;