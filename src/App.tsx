import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/lab-results" element={<LabResults />} />
            <Route path="/ai-triage" element={<AITriage />} />
            <Route path="/pharmacies" element={<Pharmacies />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/book-appointment" element={<BookAppointment />} />
            <Route path="/medical-record" element={<MedicalRecord />} />
            <Route path="/send-to-doctor" element={<SendToDoctor />} />
            <Route path="/doctor-profile" element={<DoctorProfile />} />
            <Route path="/lab-dashboard" element={<LabDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SmartAssistant />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;