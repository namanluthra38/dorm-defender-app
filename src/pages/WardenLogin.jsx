// src/pages/WardenLogin.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWardenAuth } from '@/contexts/WardenAuthContext';
import { 
  Home, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function WardenLogin() {
  const navigate = useNavigate();
  const { login, user, refreshWardenComposite: refreshUserComposite, logout } = useWardenAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      try { logout(); } catch (e) { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'WARDEN') {
      (async () => {
        try {
          await refreshUserComposite();
        } catch (e) { /* ignore */ }
      })();
      navigate('/warden');
    }
  }, [user, navigate, refreshUserComposite]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const result = await login(email, password);

      if (result.success) {
        toast.success('Warden verified! Welcome back.');
        try { await refreshUserComposite(); } catch (err) { /* ignore */ }
        navigate('/warden');
      } else {
        toast.error(result.message ?? 'Invalid warden credentials. Please try again.');
      }
    } catch (err) {
      toast.error('Unexpected error while logging in.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast.error('Service not available. Please contact admin.');
  };

  return (
    <div className="bg-background mesh-background min-h-screen flex items-center justify-center p-4 font-body-md text-on-surface animate-in fade-in duration-300">
      {/* Main Authentication Container */}
      <main className="w-full max-w-[440px]">
        {/* Login Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-10 security-shadow border border-outline-variant/30 relative overflow-hidden">
          {/* Atmospheric Brand Header */}
          <div className="mb-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-portal-primary rounded-2xl flex items-center justify-center mb-4 security-shadow text-white">
              <Home className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-on-background font-headline-lg">hostelhelp</h1>
            <p className="text-sm font-semibold text-portal-primary mt-2 uppercase tracking-wider font-label-md">Warden Portal Login</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface font-label-md" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 shrink-0" />
                <input 
                  type="email" 
                  name="email"
                  id="email" 
                  placeholder="Enter your email" 
                  required 
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-portal-primary/20 focus:border-portal-primary focus:outline-none transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-on-surface font-label-md" htmlFor="password">Password</label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-portal-primary hover:underline focus:outline-none transition-all font-label-sm"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 shrink-0" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  id="password" 
                  placeholder="Enter your password" 
                  required 
                  disabled={isLoading}
                  className="w-full pl-10 pr-12 py-3 bg-surface border border-outline-variant rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-portal-primary/20 focus:border-portal-primary focus:outline-none transition-all duration-200 shadow-sm"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-portal-primary text-white py-3.5 rounded-xl font-bold hover:shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Secondary Actions */}
          <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center">
            <a 
              href="/login" 
              className="font-semibold text-sm text-on-surface-variant hover:text-portal-primary transition-colors inline-flex items-center justify-center gap-1 group font-label-md"
            >
              Login as student
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Technical Assistance Support Link */}
        <p className="mt-8 text-center text-sm text-on-surface-variant/80 font-body-md">
          Need technical assistance? <button onClick={() => toast.info('Please visit the campus administration help desk or email support@university.edu')} className="text-portal-primary font-semibold hover:underline font-label-md">Contact Support</button>
        </p>
      </main>
    </div>
  );
}
