import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
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
import ReportsCenter from './pages/ReportsCenter';
import Bookings from './pages/Bookings';
import { useAppContext } from './context/AppContext';

function ProtectedRoute({ allowRoles, redirectTo = '/login', children }) {
  const { currentUser, authLoading } = useAppContext();

  if (authLoading) {
    return <div className="px-6 py-10 text-sm text-slate-500">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!allowRoles.includes(currentUser.role)) {
    if (currentUser.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (currentUser.role === 'seller') {
      return <Navigate to="/seller/dashboard" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  return (
    <ProtectedRoute allowRoles={['admin']} redirectTo="/admin/login">
      {children}
    </ProtectedRoute>
  );
}

function StudentRoute({ children }) {
  return <ProtectedRoute allowRoles={['buyer', 'seller']}>{children}</ProtectedRoute>;
}

function SellerRoute({ children }) {
  return <ProtectedRoute allowRoles={['seller']}>{children}</ProtectedRoute>;
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className={`flex min-h-screen flex-col ${isAdminRoute ? 'bg-slate-950/95' : 'bg-gray-100'}`}>
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/products" element={<ProductMarketplace />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/services" element={<ServiceMarketplace />} />
          <Route path="/services/:id" element={<ServiceDetail />} />

          <Route
            path="/cart"
            element={
              <StudentRoute>
                <Cart />
              </StudentRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <StudentRoute>
                <Dashboard />
              </StudentRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <StudentRoute>
                <OrderManagement />
              </StudentRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <StudentRoute>
                <OrderDetail />
              </StudentRoute>
            }
          />
          <Route
            path="/orders/:id/track"
            element={
              <StudentRoute>
                <OrderTracking />
              </StudentRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <StudentRoute>
                <Bookings />
              </StudentRoute>
            }
          />

          <Route
            path="/seller/dashboard"
            element={
              <SellerRoute>
                <Dashboard />
              </SellerRoute>
            }
          />
          <Route
            path="/list-product"
            element={
              <SellerRoute>
                <ListProduct />
              </SellerRoute>
            }
          />
          <Route
            path="/list-service"
            element={
              <SellerRoute>
                <ListService />
              </SellerRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <SellerRoute>
                <InventoryManagement />
              </SellerRoute>
            }
          />
          <Route
            path="/seller/erp"
            element={
              <SellerRoute>
                <ERPDashboard />
              </SellerRoute>
            }
          />
          <Route
            path="/seller/crm"
            element={
              <SellerRoute>
                <CRMDashboard />
              </SellerRoute>
            }
          />
          <Route
            path="/seller/analytics"
            element={
              <SellerRoute>
                <SalesAnalytics />
              </SellerRoute>
            }
          />
          <Route
            path="/seller/reports"
            element={
              <SellerRoute>
                <ReportsCenter />
              </SellerRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <SellerRoute>
                <CustomerManagement />
              </SellerRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <SellerRoute>
                <CustomerManagement />
              </SellerRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/sellers"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/erp"
            element={
              <AdminRoute>
                <ERPDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/crm"
            element={
              <AdminRoute>
                <CRMDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <AdminRoute>
                <SalesAnalytics />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <ReportsCenter />
              </AdminRoute>
            }
          />

          <Route path="/erp" element={<Navigate to="/seller/erp" replace />} />
          <Route path="/crm" element={<Navigate to="/seller/crm" replace />} />
          <Route path="/analytics" element={<Navigate to="/seller/analytics" replace />} />
          <Route path="/reports" element={<Navigate to="/seller/reports" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
