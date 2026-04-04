import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const studentLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

const adminLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
  }`;

const adminLinks = [
  { to: '/admin/dashboard', label: 'Overview' },
  { to: '/admin/sellers', label: 'Sellers' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/services', label: 'Services' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/erp', label: 'ERP' },
  { to: '/admin/crm', label: 'CRM' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/reports', label: 'Reports' },
];

const sellerLinks = [
  { to: '/seller/dashboard', label: 'Dashboard' },
  { to: '/list-product', label: 'My Products' },
  { to: '/list-service', label: 'My Services' },
  { to: '/orders', label: 'Orders' },
  { to: '/seller/erp', label: 'ERP' },
  { to: '/seller/crm', label: 'CRM' },
  { to: '/seller/analytics', label: 'Analytics' },
  { to: '/seller/reports', label: 'Reports' },
];

const buyerLinks = [
  { to: '/products', label: 'Browse Products' },
  { to: '/services', label: 'Browse Services' },
  { to: '/cart', label: 'Cart' },
  { to: '/dashboard', label: 'Dashboard' },
];

function Navbar() {
  const { currentUser, cart, logout } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAdminUser = currentUser?.role === 'admin';

  const handleLogout = async () => {
    const redirectPath = isAdminUser || isAdminRoute ? '/admin/login' : '/login';
    await logout();
    setMenuOpen(false);
    navigate(redirectPath, { replace: true });
  };

  if (isAdminUser) {
    return (
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 text-lg font-bold text-white">
              AC
            </div>
            <div>
              <p className="text-lg font-bold">CampusConnect Admin</p>
              <p className="text-xs text-slate-400">Platform operations console</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 xl:flex">
            {adminLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={adminLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Logout
          </button>
        </div>
      </header>
    );
  }

  if (isAdminRoute) {
    return (
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/admin/login" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 text-lg font-bold text-white">
              AC
            </div>
            <div>
              <p className="text-lg font-bold">CampusConnect Admin</p>
              <p className="text-xs text-slate-400">Secure platform access</p>
            </div>
          </Link>

          <Link
            to="/login"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Student Login
          </Link>
        </div>
      </header>
    );
  }

  const navLinks = currentUser?.role === 'seller' ? sellerLinks : buyerLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-lg font-bold text-white shadow-soft">
            CC
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">CampusConnect</p>
            <p className="text-xs text-slate-500">Student marketplace and skill exchange</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {!currentUser && (
            <>
              <NavLink to="/" className={studentLinkClass}>
                Home
              </NavLink>
              <NavLink to="/products" className={studentLinkClass}>
                Browse Products
              </NavLink>
              <NavLink to="/services" className={studentLinkClass}>
                Browse Services
              </NavLink>
            </>
          )}
          {currentUser &&
            navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={studentLinkClass}>
                {link.label}
                {link.to === '/cart' ? ` (${cart.length})` : ''}
              </NavLink>
            ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {currentUser ? (
            <>
              <div className="rounded-xl bg-slate-50 px-4 py-2 text-right">
                <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                <p className="text-xs capitalize text-slate-500">{currentUser.role}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((previous) => !previous)}
          className="inline-flex rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.8]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-2">
            {currentUser
              ? navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={studentLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                    {link.to === '/cart' ? ` (${cart.length})` : ''}
                  </NavLink>
                ))
              : (
                <>
                  <NavLink to="/" className={studentLinkClass} onClick={() => setMenuOpen(false)}>
                    Home
                  </NavLink>
                  <NavLink to="/products" className={studentLinkClass} onClick={() => setMenuOpen(false)}>
                    Browse Products
                  </NavLink>
                  <NavLink to="/services" className={studentLinkClass} onClick={() => setMenuOpen(false)}>
                    Browse Services
                  </NavLink>
                </>
              )}

            {currentUser ? (
              <>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                  <p className="text-xs capitalize text-slate-500">{currentUser.role}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/login"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-blue-500 px-4 py-2 text-center text-sm font-semibold text-white"
                  onClick={() => setMenuOpen(false)}
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
