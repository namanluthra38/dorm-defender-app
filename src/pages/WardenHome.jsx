import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, LogOut, Users, ClipboardList, AlertCircle } from 'lucide-react';

const WardenHome = () => {
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
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Warden Dashboard</h1>
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
          <h2 className="text-3xl font-bold mb-2">Warden Control Panel</h2>
          <p className="text-muted-foreground">Manage hostel operations and student affairs</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>View and manage student records</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">Manage Students</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>Track and update attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">View Attendance</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Complaints</CardTitle>
              <CardDescription>Review and address student complaints</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">View Complaints</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default WardenHome;
