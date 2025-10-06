import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/Layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Article from "./pages/Article";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
		  <Routes>
			<Route path="/" element={<Layout><Index /></Layout>} />
			<Route path="/article/:slug" element={<Layout><Article /></Layout>} />
			<Route path="*" element={<Layout><NotFound /></Layout>} />
		  </Routes>
		</BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
