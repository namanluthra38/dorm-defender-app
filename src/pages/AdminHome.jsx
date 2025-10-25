import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCog, LogOut, Settings, Database, BarChart } from 'lucide-react';

const AdminHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCog className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">System Administration</h2>
          <p className="text-muted-foreground">Manage platform settings and monitor system health</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure platform parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">Open Settings</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage students, wardens, and admins</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">Manage Users</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View system usage and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">View Analytics</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminHome;
