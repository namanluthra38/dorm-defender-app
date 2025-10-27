import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { GraduationCap, Shield, UserCog } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate(`/${user.role}`);
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    const result = await login(email, password);

    if (result.success) {
      const routedRole = result.user.role;
      if (routedRole) {
        toast.success(`Welcome! Logged in as ${routedRole}`);
        navigate(`/${routedRole.toLowerCase()}`);
      } else {
        // If backend didn't return a role, navigate to a safe default or show a message
        toast.error('Login succeeded but no role returned by server.');
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
