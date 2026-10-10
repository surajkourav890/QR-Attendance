import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AttendanceProvider } from "./context/AttendanceContext";
import { RegisterProvider } from "./context/RegisterContext";
import Index from "./pages/Index";
import Scanner from "./pages/Scanner";
import Records from "./pages/Records";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AttendanceProvider>
        <RegisterProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/calendar" replace />} />
              <Route path="/calendar" element={<Index />} />
              <Route path="/scanner" element={<Scanner />} />
              <Route path="/records" element={<Records />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </RegisterProvider>
      </AttendanceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

