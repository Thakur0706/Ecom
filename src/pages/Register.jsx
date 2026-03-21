import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

function Register() {
  const { currentUser, login } = useAppContext();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    collegeId: '',
    password: '',
    confirmPassword: '',
    role: 'Buyer',
  });

  if (currentUser) {
    return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    login({
      id: `user_${Date.now()}`,
      name: formData.fullName,
      email: formData.email,
      collegeId: formData.collegeId,
      role: formData.role.toLowerCase(),
    });
    navigate('/dashboard');
  };

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 shadow-lg">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Create your CampusConnect account</h1>
          <p className="mt-2 text-sm text-slate-500">
            Join the student marketplace and start buying, selling, and offering skills.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-slate-700">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
          </div>

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
            />
          </div>

          <div>
            <label htmlFor="collegeId" className="mb-2 block text-sm font-semibold text-slate-700">
              College ID
            </label>
            <input
              id="collegeId"
              name="collegeId"
              type="text"
              value={formData.collegeId}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
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
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="role" className="mb-2 block text-sm font-semibold text-slate-700">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            >
              <option>Buyer</option>
              <option>Seller</option>
              <option>Both</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500"
            >
              Register
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 transition hover:text-indigo-600">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
