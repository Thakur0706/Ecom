import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const linkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-blue-50 text-blue-700"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

const adminLinkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-indigo-100 text-indigo-700"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

function Navbar() {
  const { currentUser, cart, logout } = useAppContext();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const buyerLinks = [
    { to: "/products", label: "Products" },
    { to: "/services", label: "Services" },
    {
      to: "/cart",
      label: `Cart${cart?.items?.length ? ` (${cart.items.length})` : ""}`,
    },
    { to: "/orders", label: "Orders" },
    { to: "/bookings", label: "Bookings" },
    { to: "/dashboard", label: "Dashboard" },
  ];

  const supplierLinks = [
    { to: "/supplier/dashboard", label: "Dashboard" },
    { to: "/supplier/products", label: "Products" },
    { to: "/supplier/ledger", label: "Ledger" },
    { to: "/supplier/profile", label: "Profile" },
  ];

  const adminLinks = [
    { to: "/admin/dashboard", label: "Overview" },
    { to: "/admin/products/pending", label: "Approvals" },
    { to: "/admin/products", label: "Products" },
    { to: "/admin/services", label: "Services" },
    { to: "/admin/orders", label: "Orders" },
    { to: "/admin/bookings", label: "Bookings" },
    { to: "/admin/suppliers", label: "Suppliers" },
    { to: "/admin/marketing", label: "Marketing" },
    { to: "/admin/analytics", label: "Analytics" },
  ];

  const links =
    currentUser?.role === "admin"
      ? adminLinks
      : currentUser?.role === "supplier"
        ? supplierLinks
        : buyerLinks;

  const handleLogout = async () => {
    await logout();
    navigate(isAdminRoute ? "/admin/login" : "/login", { replace: true });
  };

  const navRenderer =
    currentUser?.role === "admin" ? adminLinkClass : linkClass;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link
          to={currentUser?.role === "admin" ? "/admin/dashboard" : "/"}
          className="flex items-center gap-3"
        >
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-bold text-white ${
              currentUser?.role === "admin"
                ? "bg-indigo-600"
                : currentUser?.role === "supplier"
                  ? "bg-amber-500"
                  : "bg-blue-600"
            }`}
          >
            CC
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">CampusConnect</p>
            <p className="text-xs text-slate-500">
              {currentUser?.role === "admin"
                ? "Admin operations"
                : currentUser?.role === "supplier"
                  ? "Supplier workspace"
                  : "Marketplace"}
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 xl:flex">
          {!currentUser && (
            <>
              <NavLink to="/" className={linkClass}>
                Home
              </NavLink>
              <NavLink to="/products" className={linkClass}>
                Products
              </NavLink>
              <NavLink to="/services" className={linkClass}>
                Services
              </NavLink>
            </>
          )}
          {currentUser &&
            links.map((link) => (
              <NavLink key={link.to} to={link.to} className={navRenderer}>
                {link.label}
              </NavLink>
            ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          {currentUser ? (
            <>
              <div className="rounded-2xl bg-slate-50 px-4 py-2 text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {currentUser.name}
                </p>
                <p className="text-xs capitalize text-slate-500">
                  {currentUser.role}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${
                  currentUser.role === "admin"
                    ? "bg-indigo-600"
                    : currentUser.role === "supplier"
                      ? "bg-amber-500"
                      : "bg-blue-600"
                }`}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          className="inline-flex rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 xl:hidden"
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-6 py-4 xl:hidden">
          <div className="flex flex-col gap-2">
            {!currentUser && (
              <>
                <NavLink
                  to="/"
                  className={linkClass}
                  onClick={() => setOpen(false)}
                >
                  Home
                </NavLink>
                <NavLink
                  to="/products"
                  className={linkClass}
                  onClick={() => setOpen(false)}
                >
                  Products
                </NavLink>
                <NavLink
                  to="/services"
                  className={linkClass}
                  onClick={() => setOpen(false)}
                >
                  Services
                </NavLink>
              </>
            )}
            {currentUser &&
              links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={navRenderer}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}

            {currentUser ? (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Logout
              </button>
            ) : (
              <div className="mt-2 flex gap-3">
                <Link
                  to="/login"
                  className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex-1 rounded-full bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white"
                  onClick={() => setOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
