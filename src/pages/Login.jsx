import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const handleSubmit = async (e, role) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    const success = await login(email, password, role);

    if (success) {
      toast.success(`Welcome! Logged in as ${role}`);
      navigate(`/${role}`);
    } else {
      toast.error('Invalid credentials. Please try again.');
    }

    setIsLoading(false);
  };

  const LoginForm = ({ role }) => (
    <form onSubmit={(e) => handleSubmit(e, role)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${role}-email`}>Email</Label>
        <Input
          id={`${role}-email`}
          name="email"
          type="email"
          placeholder="Enter your email"
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${role}-password`}>Password</Label>
        <Input
          id={`${role}-password`}
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
          <CardTitle className="text-3xl font-bold">Campus Portal</CardTitle>
          <CardDescription>Select your role and sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="student" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Student
              </TabsTrigger>
              <TabsTrigger value="warden" className="gap-2">
                <Shield className="h-4 w-4" />
                Warden
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2">
                <UserCog className="h-4 w-4" />
                Admin
              </TabsTrigger>
            </TabsList>
            <TabsContent value="student" className="mt-6">
              <LoginForm role="student" />
            </TabsContent>
            <TabsContent value="warden" className="mt-6">
              <LoginForm role="warden" />
            </TabsContent>
            <TabsContent value="admin" className="mt-6">
              <LoginForm role="admin" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
