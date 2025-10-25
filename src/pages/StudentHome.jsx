import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, LogOut, BookOpen, Home, Calendar } from 'lucide-react';

const StudentHome = () => {
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
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Student Dashboard</h1>
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
          <h2 className="text-3xl font-bold mb-2">Welcome Back, Student!</h2>
          <p className="text-muted-foreground">Access your academic resources and campus information</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Courses</CardTitle>
              <CardDescription>View your enrolled courses and materials</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">View Courses</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Home className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Hostel Info</CardTitle>
              <CardDescription>Access hostel details and facilities</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">View Details</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-[var(--shadow-card)] transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>Check your class and exam schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">View Schedule</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StudentHome;
