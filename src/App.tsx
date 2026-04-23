import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/store/useStore";
import AppLayout from "@/components/AppLayout";
import OrdersScreen from "./pages/OrdersScreen";
import ProductsScreen from "./pages/ProductsScreen";
import ProductFormScreen from "./pages/ProductFormScreen";
import EarningsScreen from "./pages/EarningsScreen";
import WithdrawScreen from "./pages/WithdrawScreen";
import StoreSettingsScreen from "./pages/StoreSettingsScreen";
import AccountDetailScreen from "./pages/AccountDetailScreen";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<OrdersScreen />} />
              <Route path="/products" element={<ProductsScreen />} />
              <Route path="/products/new" element={<ProductFormScreen />} />
              <Route path="/products/:id/edit" element={<ProductFormScreen />} />
              <Route path="/earnings" element={<EarningsScreen />} />
              <Route path="/earnings/withdraw" element={<WithdrawScreen />} />
              <Route path="/store" element={<StoreSettingsScreen />} />
              <Route path="/store/:section" element={<AccountDetailScreen />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
