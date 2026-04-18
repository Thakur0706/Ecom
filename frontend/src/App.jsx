import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";
import ProductMarketplace from "./pages/ProductMarketplace";
import ServiceMarketplace from "./pages/ServiceMarketplace";
import ProductDetail from "./pages/ProductDetail";
import ServiceDetail from "./pages/ServiceDetail";
import Cart from "./pages/Cart";
import OrderManagement from "./pages/OrderManagement";
import OrderDetail from "./pages/OrderDetail";
import Bookings from "./pages/Bookings";
import Dashboard from "./pages/Dashboard";
import SupplierDashboard from "./pages/SupplierDashboard";
import SupplierProducts from "./pages/SupplierProducts";
import SupplierProductForm from "./pages/SupplierProductForm";
import SupplierLedger from "./pages/SupplierLedger";
import SupplierProfile from "./pages/SupplierProfile";
import AdminPanel from "./pages/AdminPanel";
import ReportsCenter from "./pages/ReportsCenter";
import CRMDashboard from "./pages/CRMDashboard";
import MarketingDashboard from "./pages/MarketingDashboard";
import AdvertisementManager from "./pages/AdvertisementManager";
import { useAppContext } from "./context/AppContext";
import { OrderProvider } from "./context/OrderContext";

function ProtectedRoute({ allowRoles, redirectTo = "/login", children }) {
  const { currentUser, authLoading } = useAppContext();

  if (authLoading) {
    return <div className="px-6 py-10 text-sm text-slate-500">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!allowRoles.includes(currentUser.role)) {
    if (currentUser.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (currentUser.role === "supplier") {
      return <Navigate to="/supplier/dashboard" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  return (
    <ProtectedRoute allowRoles={["admin"]} redirectTo="/admin/login">
      {children}
    </ProtectedRoute>
  );
}

function BuyerRoute({ children }) {
  return <ProtectedRoute allowRoles={["buyer"]}>{children}</ProtectedRoute>;
}

function SupplierRoute({ children }) {
  return <ProtectedRoute allowRoles={["supplier"]}>{children}</ProtectedRoute>;
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div
      className={`flex min-h-screen flex-col ${isAdminRoute ? "bg-slate-50" : "bg-gray-100"}`}
    >
      <Navbar />
      <main className="flex-1">
        <OrderProvider>
          <Routes>
            {/* Public / Buyer Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductMarketplace />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/services" element={<ServiceMarketplace />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route
              path="/cart"
              element={
                <BuyerRoute>
                  <Cart />
                </BuyerRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <BuyerRoute>
                  <Cart />
                </BuyerRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <BuyerRoute>
                  <OrderManagement />
                </BuyerRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <BuyerRoute>
                  <OrderDetail />
                </BuyerRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <BuyerRoute>
                  <Bookings />
                </BuyerRoute>
              }
            />
            <Route
              path="/bookings/:id"
              element={
                <BuyerRoute>
                  <Bookings />
                </BuyerRoute>
              }
            />{" "}
            {/* Logic handles ID in Bookings.jsx ideally */}
            <Route
              path="/dashboard"
              element={
                <BuyerRoute>
                  <Dashboard />
                </BuyerRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/supplier/apply" element={<Register />} />{" "}
            {/* Render apply mode via props or context in Register later */}
            {/* Supplier Routes */}
            <Route
              path="/supplier/dashboard"
              element={
                <SupplierRoute>
                  <SupplierDashboard />
                </SupplierRoute>
              }
            />
            <Route
              path="/supplier/products"
              element={
                <SupplierRoute>
                  <SupplierProducts />
                </SupplierRoute>
              }
            />
            <Route
              path="/supplier/products/new"
              element={
                <SupplierRoute>
                  <SupplierProductForm />
                </SupplierRoute>
              }
            />
            <Route
              path="/supplier/products/:id/edit"
              element={
                <SupplierRoute>
                  <SupplierProductForm isEdit />
                </SupplierRoute>
              }
            />
            <Route
              path="/supplier/ledger"
              element={
                <SupplierRoute>
                  <SupplierLedger />
                </SupplierRoute>
              }
            />
            <Route
              path="/supplier/profile"
              element={
                <SupplierRoute>
                  <SupplierProfile />
                </SupplierRoute>
              }
            />
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminPanel view="dashboard" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products/pending"
              element={
                <AdminRoute>
                  <AdminPanel view="products-pending" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AdminPanel view="products" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products/new"
              element={
                <AdminRoute>
                  <AdminPanel view="products-new" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products/:id/edit"
              element={
                <AdminRoute>
                  <AdminPanel view="products-edit" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/services"
              element={
                <AdminRoute>
                  <AdminPanel view="services" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/services/new"
              element={
                <AdminRoute>
                  <AdminPanel view="services-new" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/services/:id/edit"
              element={
                <AdminRoute>
                  <AdminPanel view="services-edit" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <AdminPanel view="orders" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders/:id"
              element={
                <AdminRoute>
                  <AdminPanel view="order-detail" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <AdminRoute>
                  <AdminPanel view="bookings" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/bookings/:id"
              element={
                <AdminRoute>
                  <AdminPanel view="booking-detail" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/suppliers"
              element={
                <AdminRoute>
                  <AdminPanel view="suppliers" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/suppliers/:id"
              element={
                <AdminRoute>
                  <AdminPanel view="supplier-detail" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/supplier-applications"
              element={
                <AdminRoute>
                  <AdminPanel view="supplier-applications" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/coupons"
              element={
                <AdminRoute>
                  <AdminPanel view="coupons" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/marketing"
              element={
                <AdminRoute>
                  <MarketingDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/advertisements"
              element={
                <AdminRoute>
                  <AdvertisementManager />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminPanel view="users" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AdminPanel view="analytics" />
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
              path="/admin/reports"
              element={
                <AdminRoute>
                  <ReportsCenter />
                </AdminRoute>
              }
            />
            {/* Catch-all */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </OrderProvider>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
