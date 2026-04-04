import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

function Login() {
  const { currentUser, login, authPending } = useAppContext();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

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
      const response = await login(formData);
      const nextRole = response?.data?.user?.role;
      navigate(nextRole === 'seller' ? '/seller/dashboard' : '/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed.');
    }
  };

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-500 text-2xl font-bold text-white shadow-soft">
            CC
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">CampusConnect</h1>
          <p className="mt-2 text-sm text-slate-500">Log in to manage your campus marketplace journey.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="you@college.edu"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={authPending}
            className="w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            {authPending ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/register" className="font-semibold text-blue-600 transition hover:text-indigo-600">
            Create an account
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-slate-500">
          Admin?{' '}
          <Link to="/admin/login" className="font-semibold text-slate-700 transition hover:text-blue-600">
            Go to admin login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
