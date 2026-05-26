// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import studentApi from '@/api/studentClient';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  X, 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  LockKeyhole
} from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { login, user, refreshStudentComposite: refreshUserComposite, logout } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGraduationYear, setRegGraduationYear] = useState('');
  const [regUid, setRegUid] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regDateOfBirth, setRegDateOfBirth] = useState('');
  const [regGender, setRegGender] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regErrors, setRegErrors] = useState({});

  const currentYear = new Date().getFullYear();
  const maxGradYear = currentYear + 6;
  const gradYearOptions = Array.from({ length: (maxGradYear - currentYear + 1) }, (_, i) => String(currentYear + i));

  useEffect(() => {
    if (user) {
      try { logout(); } catch (e) { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'STUDENT') {
      (async () => {
        let composite = null;
        try {
          composite = await refreshUserComposite();
        } catch (e) { /* ignore */ }

        const hasHostel = Boolean(
          composite?.hostel ||
          composite?.student?.hostelId ||
          composite?.room?.hostelId ||
          user?.hostelId
        );

        navigate(hasHostel ? '/student' : '/student/booking');
      })();
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
        toast.success('Welcome back!');
        let composite = null;
        try {
          composite = await refreshUserComposite();
        } catch (err) {
          // ignore and continue
        }

        const hasHostel = Boolean(
          composite?.hostel ||
          composite?.student?.hostelId ||
          composite?.room?.hostelId ||
          result.user?.hostelId
        );

        navigate(hasHostel ? '/student' : '/student/booking');
      } else {
        toast.error(result.message ?? 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      toast.error('Unexpected error while logging in.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegErrors({});

    // Client-side validation
    const errors = {};
    if (!regName) errors.name = 'Name is required';
    if (!regEmail) errors.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(regEmail)) errors.email = 'Invalid email format';
    if (!regPassword) errors.password = 'Password is required';
    else if (regPassword.length < 6) errors.password = 'Password must be at least 6 characters';
    else if (!/[A-Za-z]/.test(regPassword) || !/\d/.test(regPassword)) errors.password = 'Password must include letters and numbers';
    if (!regGraduationYear) errors.graduationYear = 'Graduation year is required';
    else {
      const gy = Number(regGraduationYear);
      if (Number.isNaN(gy) || gy < currentYear || gy > maxGradYear) errors.graduationYear = `Select a year between ${currentYear} and ${maxGradYear}`;
    }
    if (!regUid) errors.uid = 'UID is required';
    if (!regAddress) errors.address = 'Address is required';
    if (!regDateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    else {
      const dob = new Date(regDateOfBirth);
      const today = new Date();
      if (dob > today) errors.dateOfBirth = 'Date of birth cannot be in the future';
    }
    if (!regGender) errors.gender = 'Gender is required';
    if (!regPhone) errors.phone = 'Phone is required';
    else if (!/^[+]?([0-9\s-]){7,15}$/.test(regPhone)) errors.phone = 'Invalid phone number';

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      toast.error('Please fix the highlighted fields');
      return;
    }

    setIsRegistering(true);
    try {
      const payload = {
        name: regName,
        email: regEmail,
        password: regPassword,
        graduationYear: Number(regGraduationYear),
        uid: String(regUid || '').toUpperCase().trim(),
        address: regAddress,
        dateOfBirth: regDateOfBirth,
        gender: regGender,
        phone: regPhone,
      };

      await studentApi.post('/students', payload);
      toast.success('Registered successfully — signing you in...');

      try {
        const result = await login(regEmail, regPassword);
        if (result.success) {
          let composite = null;
          try { composite = await refreshUserComposite(); } catch (e) { /* ignore */ }
          const hasHostel = Boolean(
            composite?.hostel || composite?.student?.hostelId || composite?.room?.hostelId || result.user?.hostelId
          );
          setRegName(''); setRegEmail(''); setRegPassword(''); setRegGraduationYear(''); setRegUid(''); setRegAddress(''); setRegDateOfBirth(''); setRegGender(''); setRegPhone('');
          setShowRegister(false);
          navigate(hasHostel ? '/student' : '/student/booking');
        } else {
          toast.error('Registered but automatic login failed: ' + (result.message ?? 'Please sign in manually'));
          setRegName(''); setRegEmail(''); setRegPassword(''); setRegGraduationYear(''); setRegUid(''); setRegAddress(''); setRegDateOfBirth(''); setRegGender(''); setRegPhone('');
          setShowRegister(false);
        }
      } catch (authErr) {
        toast.error('Registered but automatic login failed — please sign in');
        setRegName(''); setRegEmail(''); setRegPassword(''); setRegGraduationYear(''); setRegUid(''); setRegAddress(''); setRegDateOfBirth(''); setRegGender(''); setRegPhone('');
        setShowRegister(false);
      }
    } catch (err) {
      const resp = err?.response?.data;
      const fieldErrors = {};
      const setFallbackToast = (message) => {
        if (message) toast.error(String(message));
        else toast.error('Registration failed');
      };

      if (resp) {
        if (Array.isArray(resp.fieldErrors)) {
          resp.fieldErrors.forEach(fe => { if (fe?.field) fieldErrors[fe.field] = fe.defaultMessage || fe.message; });
        }
        if (resp.errors && typeof resp.errors === 'object' && !Array.isArray(resp.errors)) {
          Object.entries(resp.errors).forEach(([k, v]) => { fieldErrors[k] = Array.isArray(v) ? v.join('; ') : String(v); });
        }
        if (Array.isArray(resp.violations)) {
          resp.violations.forEach(v => { if (v?.propertyPath) fieldErrors[v.propertyPath] = v.message; });
        }
        if (Object.keys(fieldErrors).length === 0 && typeof resp === 'object') {
          ['email','password','name','uid','phone','dateOfBirth','graduationYear','address','gender'].forEach(k => {
            if (resp[k]) fieldErrors[k] = Array.isArray(resp[k]) ? resp[k].join('; ') : String(resp[k]);
          });
        }
        if (Object.keys(fieldErrors).length === 0) {
          if (typeof resp === 'string') {
            const s = resp.toLowerCase();
            if (s.includes('email') && (s.includes('exist') || s.includes('taken') || s.includes('already'))) {
              fieldErrors.email = resp;
            } else {
              setFallbackToast(resp);
            }
          } else if (resp.message) {
            const s = String(resp.message).toLowerCase();
            if (s.includes('email') && (s.includes('exist') || s.includes('taken') || s.includes('already'))) {
              fieldErrors.email = resp.message;
            } else {
              setFallbackToast(resp.message);
            }
          }
        }
      } else {
        setFallbackToast(err?.message ?? 'Registration failed');
      }

      if (Object.keys(fieldErrors).length > 0) {
        setRegErrors(fieldErrors);
        toast.error('Please fix the highlighted fields');
      }
      console.error('Register error', err, resp);
    } finally {
      setIsRegistering(false);
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
            <p className="text-sm font-semibold text-portal-primary mt-2 uppercase tracking-wider font-label-md">Student Portal Login</p>
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
          <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center flex flex-col gap-3">
            <button 
              onClick={() => setShowRegister(true)} 
              className="text-sm font-semibold text-portal-primary hover:underline focus:outline-none font-label-md"
            >
              New here? Create an Account
            </button>
            <a 
              href="/login-warden" 
              className="font-semibold text-sm text-on-surface-variant hover:text-portal-primary transition-colors inline-flex items-center justify-center gap-1 group font-label-md"
            >
              Login as warden
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Technical Assistance Support Link */}
        <p className="mt-8 text-center text-sm text-on-surface-variant/80 font-body-md">
          Need technical assistance? <button onClick={() => toast.info('Please visit the campus administration help desk or email support@university.edu')} className="text-portal-primary font-semibold hover:underline font-label-md">Contact Support</button>
        </p>
      </main>

      {/* Student Registration slide-over Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <form 
            onSubmit={handleRegister} 
            className="bg-surface-container-lowest rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative border border-outline-variant/30 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-outline-variant/20">
              <div>
                <h3 className="text-xl font-bold text-on-surface font-headline-sm">Create Student Account</h3>
                <p className="text-xs text-on-surface-variant mt-1">Join the campus residency community to book hostels and log maintenance requests.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowRegister(false)} 
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reg-name" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label-md">Full Name</Label>
                <div className="relative mt-2">
                  <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                  <Input 
                    id="reg-name" 
                    value={regName} 
                    onChange={e => setRegName(e.target.value)} 
                    placeholder="e.g. John Doe"
                    required 
                    className="w-full pl-10 focus:ring-2 focus:ring-portal-primary/20 focus:border-portal-primary border-outline-variant rounded-xl bg-surface" 
                  />
                </div>
                {regErrors.name && <p className="text-xs text-portal-error mt-1">{regErrors.name}</p>}
              </div>

              <div>
                <Label htmlFor="reg-email" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label-md">Email Address</Label>
                <div className="relative mt-2">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                  <Input 
                    id="reg-email" 
                    type="email" 
                    value={regEmail} 
                    onChange={e => setRegEmail(e.target.value)} 
                    placeholder="name@university.edu"
                    required 
                    className="w-full pl-10 focus:ring-2 focus:ring-portal-primary/20 focus:border-portal-primary border-outline-variant rounded-xl bg-surface" 
                  />
                </div>
                {regErrors.email && <p className="text-xs text-portal-error mt-1">{regErrors.email}</p>}
              </div>

              <div>
                <Label htmlFor="reg-password" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label-md">Security Password</Label>
                <div className="relative mt-2">
                  <LockKeyhole className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                  <Input 
                    id="reg-password" 
                    type="password" 
                    value={regPassword} 
                    onChange={e => setRegPassword(e.target.value)} 
                    placeholder="Min 6 characters"
                    minLength={6} 
                    required 
                    className="w-full pl-10 focus:ring-2 focus:ring-portal-primary/20 focus:border-portal-primary border-outline-variant rounded-xl bg-surface" 
                  />
                </div>
                {regErrors.password && <p className="text-xs text-portal-error mt-1">{regErrors.password}</p>}
              </div>

              <div>
                <Label htmlFor="reg-grad" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label-md">Expected Graduation Year</Label>
                <select 
                  id="reg-grad" 
                  value={regGraduationYear} 
                  onChange={e => setRegGraduationYear(e.target.value)} 
                  className="w-full border border-outline-variant rounded-xl px-3 py-2 mt-2 bg-surface text-sm focus:ring-2 focus:ring-portal-primary/20 focus:border-portal-primary focus:outline-none" 
                  required
                >
                  <option value="">Select year</option>
                  {gradYearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                {regErrors.graduationYear && <p className="text-xs text-portal-error mt-1">{regErrors.graduationYear}</p>}
              </div>

              <div>
                <Label htmlFor="reg-uid" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label-md">Student Roll UID</Label>
                <div className="relative mt-2">
                  <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                  <Input 
                    id="reg-uid" 
                    value={regUid} 
                    onChange={e => setRegUid(String(e.target.value || '').toUpperCase().trim())} 
                    placeholder="e.g. 21BCS1024"
                    required 
                    className="w-full pl-10 focus:ring-2 focus:ring-portal-primary/20 focus:border-portal-primary border-outline-variant rounded-xl bg-surface" 
                  />
                </div>
                {regErrors.uid && <p className="text-xs text-portal-error mt-1">{regErrors.uid}</p>}
              </div>

              <div>
                <Label htmlFor="reg-phone" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label-md">Contact Phone Number</Label>
                <div className="relative mt-2">
                  <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                  <Input 
                    id="reg-phone" 
                    value={regPhone} 
                    onChange={e => setRegPhone(e.target.value)} 
                    placeholder="e.g. +91 9999999999"
                    required 
                    className="w-full pl-10 focus:ring-2 focus:ring-portal-primary/20 focus:border-portal-primary border-outline-variant rounded-xl bg-surface" 
                  />
                </div>
                {regErrors.phone && <p className="text-xs text-portal-error mt-1">{regErrors.phone}</p>}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="reg-address" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label-md">Permanent Home Address</Label>
                <div className="relative mt-2">
                  <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                  <Input 
                    id="reg-address" 
                    value={regAddress} 
                    onChange={e => setRegAddress(e.target.value)} 
                    placeholder="House number, Street name, City, Zipcode"
                    required 
                    className="w-full pl-10 focus:ring-2 focus:ring-portal-primary/20 focus:border-portal-primary border-outline-variant rounded-xl bg-surface" 
                  />
                </div>
                {regErrors.address && <p className="text-xs text-portal-error mt-1">{regErrors.address}</p>}
              </div>

              <div>
                <Label htmlFor="reg-dob" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label-md">Date of Birth</Label>
                <div className="relative mt-2">
                  <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                  <Input 
                    id="reg-dob" 
                    type="date" 
                    value={regDateOfBirth} 
                    onChange={e => setRegDateOfBirth(e.target.value)} 
                    required 
                    className="w-full pl-10 focus:ring-2 focus:ring-portal-primary/20 focus:border-portal-primary border-outline-variant rounded-xl bg-surface" 
                  />
                </div>
                {regErrors.dateOfBirth && <p className="text-xs text-portal-error mt-1">{regErrors.dateOfBirth}</p>}
              </div>

              <div>
                <Label htmlFor="reg-gender" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label-md">Gender Category</Label>
                <select 
                  id="reg-gender" 
                  value={regGender} 
                  onChange={e => setRegGender(e.target.value)} 
                  className="w-full border border-outline-variant rounded-xl px-3 py-2 mt-2 bg-surface text-sm focus:ring-2 focus:ring-portal-primary/20 focus:border-portal-primary focus:outline-none"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {regErrors.gender && <p className="text-xs text-portal-error mt-1">{regErrors.gender}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-outline-variant/10">
              <button 
                type="button" 
                onClick={() => setShowRegister(false)} 
                className="px-4 py-2 border border-outline-variant rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <Button 
                type="submit" 
                disabled={isRegistering} 
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Registering…
                  </>
                ) : (
                  'Register'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
