import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductMarketplace from './pages/ProductMarketplace';
import ServiceMarketplace from './pages/ServiceMarketplace';
import ProductDetail from './pages/ProductDetail';
import ServiceDetail from './pages/ServiceDetail';
import Cart from './pages/Cart';
import Dashboard from './pages/Dashboard';
import ListProduct from './pages/ListProduct';
import ListService from './pages/ListService';
import AdminPanel from './pages/AdminPanel';
import OrderManagement from './pages/OrderManagement';
import OrderDetail from './pages/OrderDetail';
import OrderTracking from './pages/OrderTracking';
import InventoryManagement from './pages/InventoryManagement';
import ERPDashboard from './pages/ERPDashboard';
import CRMDashboard from './pages/CRMDashboard';
import CustomerManagement from './pages/CustomerManagement';
import SalesAnalytics from './pages/SalesAnalytics';
import ResourcePlanning from './pages/ResourcePlanning';
import ReportsCenter from './pages/ReportsCenter';

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<ProductMarketplace />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/services" element={<ServiceMarketplace />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/list-product" element={<ListProduct />} />
          <Route path="/list-service" element={<ListService />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/orders/:id/track" element={<OrderTracking />} />
          <Route path="/inventory" element={<InventoryManagement />} />
          <Route path="/erp" element={<ERPDashboard />} />
          <Route path="/crm" element={<CRMDashboard />} />
          <Route path="/customers" element={<CustomerManagement />} />
          <Route path="/customers/:id" element={<CustomerManagement />} />
          <Route path="/analytics" element={<SalesAnalytics />} />
          <Route path="/resources" element={<ResourcePlanning />} />
          <Route path="/reports" element={<ReportsCenter />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
