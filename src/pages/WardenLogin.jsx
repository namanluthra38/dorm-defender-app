import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWardenAuth } from '@/contexts/WardenAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const Login = () => {
    const navigate = useNavigate();
    const { login, user, refreshWardenComposite: refreshUserComposite, logout } = useWardenAuth();
    const [isLoading, setIsLoading] = useState(false);

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
                toast.success('Welcome!');
                // fetch composite to decide routing
                try { await refreshUserComposite(); } catch (err) { /* ignore */ }
                navigate('/warden');

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
                    <CardDescription>Sign in to continue (Wardens only)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full mt-6">
                        <LoginForm />
                        <div className="mt-3 text-center">
                            <a href="./login" className="text-sm text-gray-700 hover:underline">Login as student</a>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
