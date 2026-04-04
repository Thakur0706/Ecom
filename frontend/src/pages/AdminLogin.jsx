import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

function AdminLogin() {
  const { currentUser, loginAdmin, authPending } = useAppContext();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  if (currentUser) {
    return (
      <Navigate
        to={
          currentUser.role === 'admin'
            ? '/admin/dashboard'
            : currentUser.role === 'seller'
              ? '/seller/dashboard'
              : '/dashboard'
        }
        replace
      />
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await loginAdmin(formData);
      navigate('/admin/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Admin login failed.');
    }
  };

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-md rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-2xl font-bold text-white">
            AC
          </div>
          <h1 className="mt-4 text-3xl font-bold">Admin Portal</h1>
          <p className="mt-2 text-sm text-slate-300">Sign in to manage CampusConnect operations.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-200">
              Admin Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-blue-400"
              placeholder="admin@campusconnect.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-200">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-blue-400"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={authPending}
            className="w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {authPending ? 'Signing in...' : 'Admin Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Student account?{' '}
          <Link to="/login" className="font-semibold text-blue-300 transition hover:text-blue-200">
            Go to student login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;
