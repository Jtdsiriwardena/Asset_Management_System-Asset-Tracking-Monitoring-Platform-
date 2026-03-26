import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  ShieldCheck,
  CheckCircle,
  UserCog,
} from 'lucide-react';

const InputField = ({ label, id, name, type = 'text', value, onChange, error, placeholder, required, icon: Icon, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
      {label} {required && <span className="text-blue-600">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon className="w-4 h-4" />
        </div>
      )}
      {children || (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-3 rounded-xl border text-gray-900 placeholder-gray-400 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:bg-white'
            }`}
        />
      )}
    </div>
    {error && (
      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
        <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
        {error}
      </p>
    )}
  </div>
);

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    role: 'EMPLOYEE',
    phone_number: '',
    department: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
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
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.password2) newErrors.password2 = 'Passwords do not match';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsLoading(true);
    const result = await register(formData);
    setIsLoading(false);
    if (result.success) {
      navigate('/login', { state: { message: 'Registration successful! Please login.' } });
    } else {
      setErrors(result.error);
    }
  };

  // Password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };
  const strength = getPasswordStrength(formData.password);
  const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-[42%] relative bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 flex-col justify-between p-12 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-5 rounded-full" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 bg-blue-400 opacity-10 rounded-full" />
          <div className="absolute -bottom-20 right-1/4 w-64 h-64 bg-indigo-400 opacity-10 rounded-full" />
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
            <ShieldCheck className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-black text-sm font-medium">Free to get started</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Join thousands of
            <br />
            <span className="text-blue-200">asset managers</span>
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed max-w-sm mb-10">
            Set up your organization's asset tracking in minutes. No credit card required.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {[
              'Track unlimited assets with QR codes',
              'Role-based access for your whole team',
              'Real-time dashboard and analytics',
              'Audit trail and compliance reports',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white bg-opacity-20 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3 h-3 text-blue-200" />
                </div>
                <span className="text-blue-100 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-blue-200 text-sm">
          © {new Date().getFullYear()} AssetManager. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 bg-gray-50 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="ml-2 text-xl font-bold text-gray-900">
            Asset<span className="text-blue-600">Manager</span>
          </span>
        </div>

        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-7">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                Sign in
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
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="First Name"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  icon={User}
                />
                <InputField
                  label="Last Name"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                />
              </div>

              {/* Username */}
              <InputField
                label="Username"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
                placeholder="johndoe"
                required
                icon={User}
              />

              {/* Email */}
              <InputField
                label="Email Address"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="john@company.com"
                required
                icon={Mail}
              />

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className={`w-full pl-10 pr-11 py-3 rounded-xl border text-gray-900 placeholder-gray-400 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:bg-white'
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
                {/* Strength meter */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength >= i ? strengthColor[strength - 1] : 'bg-gray-200'
                            }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Strength: <span className="font-medium">{strengthLabel[strength - 1]}</span>
                    </p>
                  </div>
                )}
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password2"
                    name="password2"
                    type={showPassword2 ? 'text' : 'password'}
                    value={formData.password2}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className={`w-full pl-10 pr-11 py-3 rounded-xl border text-gray-900 placeholder-gray-400 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.password2 ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:bg-white'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword2(!showPassword2)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password2 && formData.password === formData.password2 && (
                  <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Passwords match
                  </p>
                )}
                {errors.password2 && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                    {errors.password2}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wider">Optional Details</span>
                </div>
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Role
                </label>
                <div className="relative">
                  <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white hover:border-gray-300 appearance-none cursor-pointer"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Phone & Department */}
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Phone Number"
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+1 234 567 890"
                  icon={Phone}
                />
                <InputField
                  label="Department"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Engineering"
                  icon={Building2}
                />
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-snug">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:underline font-medium">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-blue-600 hover:underline font-medium">Privacy Policy</a>
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
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              <span>SSL Encrypted</span>
            </div>
            <div className="w-px h-3 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>No credit card needed</span>
            </div>
            <div className="w-px h-3 bg-gray-200" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;