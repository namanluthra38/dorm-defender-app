import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const { login, user, refreshStudentComposite: refreshUserComposite, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // On mount: if user already present, clear auth state so login page is fresh
  useEffect(() => {
    if (user) {
      try { logout(); } catch (e) { /* ignore */ }
    }
    // run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Utility: normalize whatever refreshUserComposite returns into { success, composite }
  async function loadCompositeSafely() {
    try {
      const res = await refreshUserComposite();
      // Two possible shapes:
      // 1) { success: true, composite: { student, room, hostel } }
      // 2) composite object directly
      if (!res) return { success: false, composite: null };
      if (typeof res === 'object' && 'success' in res) {
        return { success: Boolean(res.success), composite: res.composite ?? null };
      }
      // otherwise assume it's the composite itself
      return { success: true, composite: res };
    } catch (e) {
      console.debug('loadCompositeSafely error', e);
      return { success: false, composite: null };
    }
  }

  // Redirect if already logged in -> prefer forwarding students to /student only when they already have a hostel
  useEffect(() => {
    const doRedirect = async () => {
      if (!user?.role) return;
      try {
        const r = typeof user.role === 'string' ? user.role.trim().toLowerCase() : null;
        if (!r || r === 'undefined') {
          navigate('/student');
          return;
        }

        if (r === 'student') {
          // ensure composite is available (but avoid heavy work if it's already cached)
          let composite = null;
          try {
            const { success, composite: comp } = await loadCompositeSafely();
            if (success) composite = comp;
          } catch (e) {
            // ignore, allow user to stay on login if composite cannot be fetched
          }

          const hasHostel = Boolean(
              composite?.hostel ||
              composite?.student?.hostelId ||
              composite?.room?.hostelId ||
              user?.hostelId
          );

          if (hasHostel) {
            navigate('/student');
          } else {
            // no redirect — allow user to decide (perhaps they want to login to another account)
          }
        } else {
          navigate(`/${r}`);
        }
      } catch (e) {
        // ignore
        console.debug('Login redirect error', e);
      }
    };

    doRedirect();
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const result = await login(email, password);

      if (result.success) {
        // load composite; prefer fresh composite to make routing decision
        let composite = null;
        try {
          const { success, composite: comp } = await loadCompositeSafely();
          if (success) composite = comp;
        } catch (err) {
          // ignore and continue
        }

        const routedRole = result.user?.role ?? user?.role;
        const r = typeof routedRole === 'string' ? routedRole.trim().toLowerCase() : null;

        if (r && r !== 'undefined') {
          if (r === 'student') {
            const hasHostel = Boolean(
                composite?.hostel ||
                composite?.student?.hostelId ||
                composite?.room?.hostelId ||
                result.user?.hostelId ||
                user?.hostelId
            );
            toast.success('Welcome!');
            navigate(hasHostel ? '/student' : '/student/booking');
          } else {
            toast.success(`Welcome! Logged in as ${r}`);
            navigate(`/${r}`);
          }
        } else {
          toast.warning('Login succeeded but server did not return a valid role; routing to student by default.');
          navigate('/student');
        }
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

  return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
        <Card className="w-full max-w-md shadow-[var(--shadow-elevated)]">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold">Hostel Help - CU</CardTitle>
            <CardDescription>Sign in to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full mt-6">
              <LoginForm />
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default Login;
