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
  const { login, user, studentComposite, refreshUserComposite } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in - useEffect to avoid setState during render
  useEffect(() => {
    const doRedirect = async () => {
      if (!user?.role) return;
      try {
        const r = typeof user.role === 'string' ? user.role.trim().toLowerCase() : null;
        if (!r || r === 'undefined') {
          console.warn('Login redirect: invalid role on user, falling back to /student', user.role);
          navigate('/student');
          return;
        }

        if (r === 'student') {
          // ensure we have composite data; refresh if missing
          let composite = studentComposite;
          if (!composite) {
            try {
              const res = await refreshUserComposite();
              if (res?.success) composite = res.composite;
            } catch (e) {
              // ignore
            }
          }

          const hasHostel = !!(composite?.student?.hostelId);
          navigate(hasHostel ? '/student' : '/student/booking');
        } else {
          navigate(`/${r}`);
        }
      } catch (e) {
        // ignore navigation errors
      }
    };

    doRedirect();
  }, [user, studentComposite, refreshUserComposite, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    const result = await login(email, password);

    if (result.success) {
      // ensure composite is loaded so we can route student to booking if needed
      let composite = studentComposite;
      try {
        const refreshed = await refreshUserComposite();
        if (refreshed?.success) composite = refreshed.composite;
      } catch (e) {
        // ignore
      }

      const routedRole = result.user?.role;
      const r = typeof routedRole === 'string' ? routedRole.trim().toLowerCase() : null;

      if (r && r !== 'undefined') {
        if (r === 'student') {
          const hasHostel = !!(composite?.student?.hostelId);
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

    setIsLoading(false);
  };

  const LoginForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`email`}>Email</Label>
        <Input
          id={`email`}
          name="email"
          type="email"
          placeholder="Enter your email"
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`password`}>Password</Label>
        <Input
          id={`password`}
          name="password"
          type="password"
          placeholder="Enter your password"
          required
          disabled={isLoading}
        />
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
