import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { WardenAuthProvider } from "./contexts/WardenAuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import WardenProtectedRoute from "./components/WardenProtectedRoute.jsx";

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
import AdminHome from "./pages/AdminHome";
import NotFound from "./pages/NotFound";
import HostelBooking from "./pages/HostelBooking";
import RequireStudentHostel from "./routes/RequireStudentHostel";
import WardenHome from "./pages/WardenHome.jsx";
import WardenLogin from "./pages/WardenLogin.jsx";
import WardenDashboard from "./pages/WardenDashboard";
import WardenComplaints from "./pages/WardenComplaints";
import WardenAnnouncements from "./pages/WardenAnnouncements";
import WardenProfile from "./pages/WardenProfile";
import WardenStudents from "./pages/WardenStudents";
import WardenRooms from "./pages/WardenRooms";
import WardenRequests from "./pages/WardenRequests";
import WardenAttendance from "./pages/WardenAttendance";
import WardenSettings from "./pages/WardenSettings";
import WardenRoomDetails from "./pages/WardenRoomDetails";
import WardenStudentDetails from "./pages/WardenStudentDetails";
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

              {/* Student login (student auth provider is top-level AuthProvider) */}
              <Route path="/login" element={<Login />} />

               Warden login needs to be inside WardenAuthProvider so it can use useWardenAuth()
              <Route
                  path="/login-warden"
                  element={
                    <WardenAuthProvider>
                      <WardenLogin />
                    </WardenAuthProvider>
                  }
              />

              {/* Student booking route */}
              <Route
                  path="/student/booking"
                  element={
                    <ProtectedRoute allowedRole="STUDENT">
                      <HostelBooking />
                    </ProtectedRoute>
                  }
              />

              {/* Student area (protected by student AuthProvider & ProtectedRoute) */}
              <Route
                  path="/student/*"
                  element={
                    <ProtectedRoute allowedRole="STUDENT">
                      <RequireStudentHostel>
                        <StudentHome />
                      </RequireStudentHostel>
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

              {/* Admin route (still uses top-level AuthProvider) */}
              <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRole="ADMIN">
                      <AdminHome />
                    </ProtectedRoute>
                  }
              />

              {/* Warden protected subtree: wrap with WardenAuthProvider so all nested pages can use useWardenAuth */}
              <Route
                  path="/warden/*"
                  element={
                    <WardenAuthProvider>
                      <WardenProtectedRoute allowedRole="WARDEN">
                        <WardenHome />
                      </WardenProtectedRoute>
                    </WardenAuthProvider>
                  }>
                  <Route index element={<WardenDashboard />} />
                  <Route path="students" element={<WardenStudents />} />
                  <Route path="students/:studentId" element={<WardenStudentDetails />} />
                  <Route path="rooms" element={<WardenRooms />} />
                  <Route path="rooms/:roomId" element={<WardenRoomDetails />} />
                  <Route path="requests" element={<WardenRequests />} />
                  <Route path="complaints" element={<WardenComplaints />} />
                  <Route path="announcements" element={<WardenAnnouncements />} />
                  <Route path="attendance" element={<WardenAttendance />} />
                  <Route path="profile" element={<WardenProfile />} />
                  <Route path="settings" element={<WardenSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
);

export default App;
