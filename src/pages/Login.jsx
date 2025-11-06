import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import studentApi from '@/api/studentClient';

const Login = () => {
  const navigate = useNavigate();
  const { login, user, refreshStudentComposite: refreshUserComposite, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

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
  // graduation year options: current year .. current year + 6
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
        toast.success('Welcome!');
        // fetch composite to decide routing
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

  const LoginForm = () => (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="Enter your email" required disabled={isLoading} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="Enter your password" required disabled={isLoading} />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
  );

  const openRegister = () => setShowRegister(true);
  const closeRegister = () => setShowRegister(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    // Reset previous field errors
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
        dateOfBirth: regDateOfBirth, // yyyy-MM-dd
        gender: regGender,
        phone: regPhone,
      };

      await studentApi.post('/students', payload);
      toast.success('Registered successfully — signing you in...');

      // Auto-login (A)
      try {
        const result = await login(regEmail, regPassword);
        if (result.success) {
          // fetch composite and navigate same as login flow
          let composite = null;
          try { composite = await refreshUserComposite(); } catch (e) { /* ignore */ }
          const hasHostel = Boolean(
            composite?.hostel || composite?.student?.hostelId || composite?.room?.hostelId || result.user?.hostelId
          );
          // reset register form and close
          setRegName(''); setRegEmail(''); setRegPassword(''); setRegGraduationYear(''); setRegUid(''); setRegAddress(''); setRegDateOfBirth(''); setRegGender(''); setRegPhone('');
          closeRegister();
          navigate(hasHostel ? '/student' : '/student/booking');
        } else {
          toast.error('Registered but automatic login failed: ' + (result.message ?? 'Please sign in manually'));
          // Clear form and close modal
          setRegName(''); setRegEmail(''); setRegPassword(''); setRegGraduationYear(''); setRegUid(''); setRegAddress(''); setRegDateOfBirth(''); setRegGender(''); setRegPhone('');
          closeRegister();
        }
      } catch (authErr) {
        // If auto-login fails, still notify and close modal
        toast.error('Registered but automatic login failed — please sign in');
        setRegName(''); setRegEmail(''); setRegPassword(''); setRegGraduationYear(''); setRegUid(''); setRegAddress(''); setRegDateOfBirth(''); setRegGender(''); setRegPhone('');
        closeRegister();
      }
    } catch (err) {
      // Parse server-side validation errors and display per-field when possible (B)
      const resp = err?.response?.data;
      const fieldErrors = {};
      // Helper to set a generic message if no field-specific message found
      const setFallbackToast = (message) => {
        if (message) toast.error(String(message));
        else toast.error('Registration failed');
      };

      if (resp) {
        // If server returned structured field errors (Spring / other formats)
        // Handle several known shapes.
        // 1) Spring Boot BindingResult style: { fieldErrors: [{field:'email', defaultMessage:'...'}, ...] }
        if (Array.isArray(resp.fieldErrors)) {
          resp.fieldErrors.forEach(fe => { if (fe?.field) fieldErrors[fe.field] = fe.defaultMessage || fe.message || JSON.stringify(fe); });
        }

        // 2) Some APIs return { errors: { field: 'msg' } }
        if (resp.errors && typeof resp.errors === 'object' && !Array.isArray(resp.errors)) {
          Object.entries(resp.errors).forEach(([k, v]) => { fieldErrors[k] = Array.isArray(v) ? v.join('; ') : String(v); });
        }

        // 3) Some APIs return { violations: [{propertyPath:'email', message:'...'}] }
        if (Array.isArray(resp.violations)) {
          resp.violations.forEach(v => { if (v?.propertyPath) fieldErrors[v.propertyPath] = v.message || v.msg || JSON.stringify(v); });
        }

        // 4) Some APIs return an object mapping like { email: 'already exists' }
        if (Object.keys(fieldErrors).length === 0 && typeof resp === 'object') {
          // look for direct keys that match our form fields
          ['email','password','name','uid','phone','dateOfBirth','graduationYear','address','gender'].forEach(k => {
            if (resp[k]) fieldErrors[k] = Array.isArray(resp[k]) ? resp[k].join('; ') : String(resp[k]);
          });
        }

        // 5) If response is a string or has message, map to email if contains 'email' or 'exists'
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

      // If we found any field errors, set them for inline display; otherwise show a toast (already done)
      if (Object.keys(fieldErrors).length > 0) {
        setRegErrors(fieldErrors);
        // also show a short toast so user notices the modal errors
        toast.error('Please fix the highlighted fields');
      }
      console.error('Register error', err, resp);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
        <Card className="w-full max-w-md shadow-[var(--shadow-elevated)]">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold">Hostel Help - CU</CardTitle>
            <CardDescription>Sign in to continue (Students only)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full mt-6">
              <LoginForm />
              <div className="mt-3 text-center flex flex-col gap-2">
                <button type="button" onClick={openRegister} className="text-sm text-sky-600 hover:underline">New here? Register</button>
                <a href="./login-warden" className="text-sm text-gray-700 hover:underline">Login as warden</a>
              </div>
            </div>
          </CardContent>
        </Card>
        {showRegister && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <form onSubmit={handleRegister} className="bg-white rounded-md w-full max-w-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Register</h3>
                <button type="button" onClick={closeRegister} className="text-gray-500">Close</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="reg-name">Full name</Label>
                  <Input id="reg-name" value={regName} onChange={e => setRegName(e.target.value)} required />
                  {regErrors.name && <p className="text-xs text-rose-600 mt-1">{regErrors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                  {regErrors.email && <p className="text-xs text-rose-600 mt-1">{regErrors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="reg-password">Password</Label>
                  <Input id="reg-password" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} minLength={6} required />
                  {regErrors.password && <p className="text-xs text-rose-600 mt-1">{regErrors.password}</p>}
                </div>
                <div>
                  <Label htmlFor="reg-grad">Graduation Year</Label>
                  <select id="reg-grad" value={regGraduationYear} onChange={e => setRegGraduationYear(e.target.value)} className="w-full border rounded px-2 py-2" required>
                    <option value="">Select year</option>
                    {gradYearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  {regErrors.graduationYear && <p className="text-xs text-rose-600 mt-1">{regErrors.graduationYear}</p>}
                </div>
                <div>
                  <Label htmlFor="reg-uid">UID</Label>
                  <Input id="reg-uid" value={regUid} onChange={e => setRegUid(String(e.target.value || '').toUpperCase().trim())} required />
                  {regErrors.uid && <p className="text-xs text-rose-600 mt-1">{regErrors.uid}</p>}
                </div>
                <div>
                  <Label htmlFor="reg-phone">Phone</Label>
                  <Input id="reg-phone" value={regPhone} onChange={e => setRegPhone(e.target.value)} required />
                  {regErrors.phone && <p className="text-xs text-rose-600 mt-1">{regErrors.phone}</p>}
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="reg-address">Address</Label>
                  <Input id="reg-address" value={regAddress} onChange={e => setRegAddress(e.target.value)} required />
                  {regErrors.address && <p className="text-xs text-rose-600 mt-1">{regErrors.address}</p>}
                </div>
                <div>
                  <Label htmlFor="reg-dob">Date of Birth</Label>
                  <Input id="reg-dob" type="date" value={regDateOfBirth} onChange={e => setRegDateOfBirth(e.target.value)} required />
                  {regErrors.dateOfBirth && <p className="text-xs text-rose-600 mt-1">{regErrors.dateOfBirth}</p>}
                </div>
                <div>
                  <Label htmlFor="reg-gender">Gender</Label>
                  <select id="reg-gender" value={regGender} onChange={e => setRegGender(e.target.value)} className="w-full border rounded px-2 py-2">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {regErrors.gender && <p className="text-xs text-rose-600 mt-1">{regErrors.gender}</p>}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                <button type="button" onClick={closeRegister} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" disabled={isRegistering} className="px-4 py-2 bg-emerald-600 text-white rounded">{isRegistering ? 'Registering…' : 'Register'}</button>
              </div>
            </form>
          </div>
        )}
      </div>
  );
};

export default Login;
