import { Toaster } from "@/components/ui/toaster";
import EmergencySOS from "@/components/EmergencySOS";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import PermissionPrompt from "@/components/PermissionPrompt";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import LabResults from "./pages/LabResults";
import AITriage from "./pages/AITriage";
import Pharmacies from "./pages/Pharmacies";
import DoctorDashboard from "./pages/DoctorDashboard";
import BookAppointment from "./pages/BookAppointment";
import MedicalRecord from "./pages/MedicalRecord";
import SendToDoctor from "./pages/SendToDoctor";
import DoctorProfile from "./pages/DoctorProfile";
import LabDashboard from "./pages/LabDashboard";
import PatientProfile from "./pages/PatientProfile";
import Prescriptions from "./pages/Prescriptions";
import PaymentPage from "./pages/PaymentPage";
import AdminDashboard from "./pages/AdminDashboard";
import FamilyMembers from "./pages/FamilyMembers";
import Telemedicine from "./pages/Telemedicine";
import PharmacyProfile from "./pages/PharmacyProfile";
import ClinicProfile from "./pages/ClinicProfile";
import PharmacyDashboard from "./pages/PharmacyDashboard";
import ClinicDashboard from "./pages/ClinicDashboard";
import SmartAssistant from "./components/SmartAssistant";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PermissionPrompt />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Patient Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Doctor Routes */}
            <Route path="/doctor-dashboard" element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/doctor-profile" element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorProfile />
              </ProtectedRoute>
            } />
            
            {/* Pharmacist Routes */}
            <Route path="/pharmacy-dashboard" element={
              <ProtectedRoute allowedRoles={['pharmacist']}>
                <PharmacyDashboard />
              </ProtectedRoute>
            } />
            <Route path="/pharmacy-profile" element={
              <ProtectedRoute allowedRoles={['pharmacist']}>
                <PharmacyProfile />
              </ProtectedRoute>
            } />
            
            {/* Clinic Routes */}
            <Route path="/clinic-dashboard" element={
              <ProtectedRoute allowedRoles={['clinic']}>
                <ClinicDashboard />
              </ProtectedRoute>
            } />
            <Route path="/clinic-profile" element={
              <ProtectedRoute allowedRoles={['clinic']}>
                <ClinicProfile />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            {/* Lab Admin Routes */}
            <Route path="/lab-dashboard" element={
              <ProtectedRoute allowedRoles={['lab_admin']}>
                <LabDashboard />
              </ProtectedRoute>
            } />
            
            {/* Shared Authenticated Routes */}
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/lab-results" element={<LabResults />} />
            <Route path="/ai-triage" element={<AITriage />} />
            <Route path="/pharmacies" element={<Pharmacies />} />
            <Route path="/book-appointment" element={<BookAppointment />} />
            <Route path="/medical-record" element={<MedicalRecord />} />
            <Route path="/send-to-doctor" element={<SendToDoctor />} />
            <Route path="/patient-profile" element={<PatientProfile />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/family" element={<FamilyMembers />} />
            <Route path="/telemedicine" element={<Telemedicine />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SmartAssistant />
          <EmergencySOS />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;