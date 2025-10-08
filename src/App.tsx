import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { useSessionValidation } from "@/hooks/useSessionValidation";
import { NotificationDialog } from "@/components/NotificationDialog";
import Index from "./pages/Index";
import { PresensiForm } from "./pages/PresensiForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component untuk session validation
const AppContent = () => {
  const { notification, closeSessionNotification } = useSessionValidation();

  return (
    <>
      <NotificationDialog
        isOpen={notification.isOpen}
        onClose={closeSessionNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/presensi" element={<PresensiForm />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
