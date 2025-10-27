import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import StudentHome from "./pages/StudentHome";
import StudentDashboard from "./pages/StudentDashboard";
import Room from "./pages/Room";
import Fees from "./pages/Fees";
import Complaints from "./pages/Complaints";
import Announcements from "./pages/Announcements";
import Support from "./pages/Support";
import StudentProfile from "./pages/StudentProfile";
import StudentSettings from "./pages/StudentSettings";
import WardenHome from "./pages/WardenHome";
import AdminHome from "./pages/AdminHome";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/student/*"
              element={
                <ProtectedRoute allowedRole="STUDENT">
                  <StudentHome />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="room" element={<Room />} />
              <Route path="fees" element={<Fees />} />
              <Route path="complaints" element={<Complaints />} />
              <Route path="announcements" element={<Announcements />} />
                <Route path="profile" element={<StudentProfile />} />
                <Route path="settings" element={<StudentSettings />} />
              <Route path="support" element={<Support />} />
            </Route>
            <Route
              path="/warden"
              element={
                <ProtectedRoute allowedRole="WARDEN">
                  <WardenHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminHome />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
