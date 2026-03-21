import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

const businessLinks = [
  { to: '/erp', label: 'ERP Dashboard' },
  { to: '/crm', label: 'CRM Dashboard' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/reports', label: 'Reports' },
];

function Navbar() {
  const { currentUser, cart, logout } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);
  const [mobileBusinessOpen, setMobileBusinessOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setBusinessMenuOpen(false);
    setMobileBusinessOpen(false);
    navigate('/');
  };

  const dashboardTarget = currentUser?.role === 'admin' ? '/admin' : '/dashboard';
  const showBusinessTools = currentUser && currentUser.role !== 'buyer';

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
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/products" className={navLinkClass}>
            Products
          </NavLink>
          <NavLink to="/services" className={navLinkClass}>
            Services
          </NavLink>
          <NavLink to="/orders" className={navLinkClass}>
            Orders
          </NavLink>
          {currentUser && ['seller', 'both'].includes(currentUser.role) && (
            <NavLink to="/inventory" className={navLinkClass}>
              Inventory
            </NavLink>
          )}
          {showBusinessTools && (
            <div
              className="relative"
              onMouseEnter={() => setBusinessMenuOpen(true)}
              onMouseLeave={() => setBusinessMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setBusinessMenuOpen((previous) => !previous)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  businessMenuOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Business Tools
              </button>
              <div
                className={`absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg transition-all duration-200 ${
                  businessMenuOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'
                }`}
              >
                {businessLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setBusinessMenuOpen(false)}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:text-blue-600"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/cart"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
          >
            Cart ({cart.length})
          </Link>
          {currentUser ? (
            <>
              <div className="rounded-xl bg-slate-50 px-4 py-2 text-right">
                <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                <p className="text-xs capitalize text-slate-500">{currentUser.role}</p>
              </div>
              <Link
                to={dashboardTarget}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
              >
                Dashboard
              </Link>
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
            <NavLink to="/" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/products" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Products
            </NavLink>
            <NavLink to="/services" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Services
            </NavLink>
            <NavLink to="/orders" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Orders
            </NavLink>
            {currentUser && ['seller', 'both'].includes(currentUser.role) && (
              <NavLink to="/inventory" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                Inventory
              </NavLink>
            )}
            {showBusinessTools && (
              <div className="rounded-xl bg-slate-50 p-2">
                <button
                  type="button"
                  onClick={() => setMobileBusinessOpen((previous) => !previous)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  Business Tools
                  <span>{mobileBusinessOpen ? '−' : '+'}</span>
                </button>
                {mobileBusinessOpen && (
                  <div className="mt-2 grid gap-1">
                    {businessLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => {
                          setMenuOpen(false);
                          setMobileBusinessOpen(false);
                        }}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-blue-600"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Link
              to="/cart"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              onClick={() => setMenuOpen(false)}
            >
              Cart ({cart.length})
            </Link>
            {currentUser ? (
              <>
                <Link
                  to={dashboardTarget}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
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
