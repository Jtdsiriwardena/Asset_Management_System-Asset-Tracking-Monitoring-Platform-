import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Package, 
  QrCode, 
  BarChart3, 
  Users, 
  Clock,
  ArrowRight,
  CheckCircle,
  Smartphone,
  Printer,
  Download,
  LogIn,
  Menu,
  X
} from 'lucide-react';

const HomePage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const features = [
    {
      icon: <Package className="w-6 h-6 text-blue-600" />,
      title: "Asset Tracking",
      description: "Track all your assets in one place with detailed information and history."
    },
    {
      icon: <QrCode className="w-6 h-6 text-green-600" />,
      title: "QR Code Integration",
      description: "Generate and scan QR codes for easy asset identification and management."
    },
    {
      icon: <Users className="w-6 h-6 text-purple-600" />,
      title: "Role-Based Access",
      description: "Different views and permissions for administrators and employees."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-orange-600" />,
      title: "Analytics Dashboard",
      description: "Real-time insights with interactive charts and statistics."
    },
    {
      icon: <Clock className="w-6 h-6 text-red-600" />,
      title: "Audit Trail",
      description: "Complete history of all actions for compliance and tracking."
    },
    {
      icon: <Smartphone className="w-6 h-6 text-indigo-600" />,
      title: "Mobile Ready",
      description: "Fully responsive design that works on desktop, tablet, and mobile."
    }
  ];

  const benefits = [
    "Reduce asset loss by up to 80%",
    "Save time with automated workflows",
    "Real-time visibility into asset status",
    "Easy compliance and audit preparation",
    "Improve employee accountability",
    "Data-driven decision making"
  ];

  const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "10x", label: "Faster Tracking" },
    { value: "500+", label: "Assets Managed" },
    { value: "24/7", label: "Support" }
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Asset<span className="text-blue-600">Manager</span>
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#benefits" className="text-gray-700 hover:text-blue-600 transition-colors">
                Benefits
              </a>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors">
                How It Works
              </a>
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-blue-600"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-4">
            <div className="max-w-7xl mx-auto px-4 space-y-3">
              <a
                href="#features"
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#benefits"
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Benefits
              </a>
              <a
                href="#how-it-works"
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <Link
                to="/login"
                className="block px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-blue-50 to-indigo-50 opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Streamline Your
              <span className="text-blue-600"> Asset Management</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              Track, manage, and optimize your organizational assets with our comprehensive 
              QR code-based system. Perfect for IT equipment, office furniture, vehicles, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white text-lg font-medium rounded-md hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 text-lg font-medium rounded-md hover:border-blue-600 hover:text-blue-600 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for
              <span className="text-blue-600"> Complete Control</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your assets efficiently in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose
                <span className="text-blue-600"> AssetManager?</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join hundreds of organizations that have transformed their asset management process.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link
                  to="/login"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <QrCode className="w-8 h-8 text-blue-600 mb-3" />
                <h4 className="font-semibold text-gray-900">QR Generation</h4>
                <p className="text-sm text-gray-600">Automatic QR codes for every asset</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
                <Printer className="w-8 h-8 text-green-600 mb-3" />
                <h4 className="font-semibold text-gray-900">Print Ready</h4>
                <p className="text-sm text-gray-600">Printable QR sheets</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg -mt-4">
                <Download className="w-8 h-8 text-purple-600 mb-3" />
                <h4 className="font-semibold text-gray-900">Export Data</h4>
                <p className="text-sm text-gray-600">CSV and PDF exports</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg mt-4">
                <BarChart3 className="w-8 h-8 text-orange-600 mb-3" />
                <h4 className="font-semibold text-gray-900">Analytics</h4>
                <p className="text-sm text-gray-600">Real-time insights</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It
              <span className="text-blue-600"> Works</span>
            </h2>
            <p className="text-xl text-gray-600">Simple 3-step process to get started</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Account</h3>
              <p className="text-gray-600">Sign up as an admin or employee with your email</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Add Assets</h3>
              <p className="text-gray-600">Upload asset details, images, and invoices</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Tracking</h3>
              <p className="text-gray-600">Generate QR codes and manage assignments</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Streamline Your Asset Management?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of organizations already using AssetManager
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 text-lg font-medium rounded-md hover:bg-gray-100 transition-colors shadow-lg"
          >
            Get Started Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Package className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">AssetManager</span>
              </div>
              <p className="text-gray-400 text-sm">
                Complete asset management solution for modern organizations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#benefits" className="hover:text-white transition-colors">Benefits</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} AssetManager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;