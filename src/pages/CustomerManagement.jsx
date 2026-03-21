import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CustomerProfileCard from '../components/CustomerProfileCard';
import { useERPCRMContext } from '../context/ERPCRMContext';
import { useAppContext } from '../context/AppContext';
import { useOrderContext } from '../context/OrderContext';

const bookingDataByCustomer = {
  'CUST-001': [
    { title: 'Math Tutoring Session', provider: 'Riya Singh', date: '2026-03-24', status: 'Confirmed' },
    { title: 'React Debugging Help', provider: 'Dev Malhotra', date: '2026-03-26', status: 'Upcoming' },
  ],
  'CUST-004': [
    { title: 'Resume Review Session', provider: 'Meera Thomas', date: '2026-02-04', status: 'Completed' },
  ],
  'CUST-009': [
    { title: 'Portfolio Strategy Call', provider: 'Sarthak Jain', date: '2026-03-18', status: 'Completed' },
  ],
};

const exportCsv = (filename, rows) => {
  const csvContent = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const daysAgo = (timestamp) => {
  const diffMs = new Date('2026-03-21T23:59:59+05:30').getTime() - new Date(timestamp).getTime();
  return Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)), 0);
};

function CustomerManagement() {
  const { currentUser } = useAppContext();
  const {
    customers,
    filterCustomers,
    getCustomerById,
    addCustomerNote,
    updateCustomerStatus,
    setSelectedCustomer,
    setActiveModule,
  } = useERPCRMContext();
  const { orders } = useOrderContext();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [collegeFilter, setCollegeFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Lifetime Value');
  const [detailNote, setDetailNote] = useState('');

  useEffect(() => {
    setActiveModule('crm');
  }, [setActiveModule]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'buyer') {
    return <Navigate to="/dashboard" replace />;
  }

  const segment = searchParams.get('segment');
  const colleges = ['All', ...new Set(customers.map((customer) => customer.college))];

  const filteredCustomers = filterCustomers(searchTerm, statusFilter, collegeFilter)
    .filter((customer) => roleFilter === 'All' || customer.role === roleFilter)
    .filter((customer) => {
      if (!segment) {
        return true;
      }

      if (segment === 'highValue') {
        return customer.lifetimeValue > 1000;
      }

      if (segment === 'active') {
        return customer.status === 'Active';
      }

      if (segment === 'new') {
        return customer.status === 'New';
      }

      if (segment === 'atRisk') {
        return daysAgo(customer.lastActivity) > 30;
      }

      return true;
    })
    .sort((left, right) => {
      if (sortBy === 'Lifetime Value') {
        return right.lifetimeValue - left.lifetimeValue;
      }

      if (sortBy === 'Recent Activity') {
        return new Date(right.lastActivity).getTime() - new Date(left.lastActivity).getTime();
      }

      if (sortBy === 'Total Orders') {
        return right.totalOrders - left.totalOrders;
      }

      return left.name.localeCompare(right.name);
    });

  const selectedCustomer = id ? getCustomerById(id) : null;
  const relatedOrders = selectedCustomer
    ? orders.filter(
        (order) => order.buyerName === selectedCustomer.name || order.sellerName === selectedCustomer.name,
      )
    : [];
  const relatedBookings = selectedCustomer ? bookingDataByCustomer[selectedCustomer.id] || [] : [];

  const handleExport = () => {
    const rows = [
      ['ID', 'Name', 'Email', 'College', 'Department', 'Role', 'Status', 'Total Orders', 'Total Spent', 'Total Sales', 'Lifetime Value'],
      ...filteredCustomers.map((customer) => [
        customer.id,
        customer.name,
        customer.email,
        customer.college,
        customer.department,
        customer.role,
        customer.status,
        customer.totalOrders,
        customer.totalSpent,
        customer.totalSales,
        customer.lifetimeValue,
      ]),
    ];

    exportCsv('campusconnect-customers.csv', rows);
  };

  const handleSaveDetailNote = () => {
    if (!selectedCustomer || !detailNote.trim()) {
      return;
    }

    addCustomerNote(selectedCustomer.id, detailNote);
    setDetailNote('');
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
              <p className="mt-2 text-sm text-slate-500">Total: {filteredCustomers.length} customers</p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-green-700"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-md">
          <div className="grid gap-4 xl:grid-cols-5">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500"
            >
              {['All', 'Active', 'Inactive', 'New'].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
            <select
              value={collegeFilter}
              onChange={(event) => setCollegeFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500"
            >
              {colleges.map((college) => (
                <option key={college}>{college}</option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500"
            >
              {['All', 'Buyer', 'Seller', 'Both'].map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500"
            >
              {['Lifetime Value', 'Recent Activity', 'Total Orders', 'Name A-Z'].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredCustomers.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredCustomers.map((customer) => (
              <CustomerProfileCard key={customer.id} customer={customer} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl bg-white px-6 py-16 text-center shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">No customers found</h2>
            <p className="mt-3 text-sm text-slate-500">
              Try adjusting your filters or search term to find the right customer segment.
            </p>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-8">
          <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Customer Profile</p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedCustomer.college} · {selectedCustomer.department} · {selectedCustomer.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {selectedCustomer.status === 'Active' && (
                  <button
                    type="button"
                    onClick={() => updateCustomerStatus(selectedCustomer.id, 'Inactive')}
                    className="rounded-lg bg-rose-500 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-rose-600"
                  >
                    Mark Inactive
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/customers')}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition-all duration-200 hover:border-indigo-400 hover:text-indigo-600"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-2xl bg-slate-50 p-6">
                <h3 className="text-2xl font-bold text-gray-900">Overview</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-sm text-slate-500">Lifetime Value</p>
                    <p className="mt-2 text-3xl font-bold text-indigo-600">₹{selectedCustomer.lifetimeValue}</p>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-sm text-slate-500">Preferred Category</p>
                    <p className="mt-2 text-lg font-bold text-gray-900">{selectedCustomer.preferredCategory}</p>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-sm text-slate-500">Total Orders</p>
                    <p className="mt-2 text-lg font-bold text-gray-900">{selectedCustomer.totalOrders}</p>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-sm text-slate-500">Active Listings</p>
                    <p className="mt-2 text-lg font-bold text-gray-900">{selectedCustomer.activeListings}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-700">Notes Summary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{selectedCustomer.notes}</p>
                </div>
              </section>

              <section className="rounded-2xl bg-slate-50 p-6">
                <h3 className="text-2xl font-bold text-gray-900">Interaction Timeline</h3>
                <div className="mt-6 space-y-4">
                  {selectedCustomer.interactions.map((interaction, index) => (
                    <div key={`${interaction.date}-${interaction.type}`} className="relative pl-8">
                      {index !== selectedCustomer.interactions.length - 1 && (
                        <span className="absolute left-[0.45rem] top-6 h-full w-0.5 bg-indigo-200" />
                      )}
                      <span className="absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-indigo-500 bg-indigo-500" />
                      <div className="rounded-xl bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-semibold text-gray-900">{interaction.type}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(interaction.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{interaction.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              <section className="rounded-2xl bg-slate-50 p-6">
                <h3 className="text-2xl font-bold text-gray-900">Notes</h3>
                <div className="mt-5 space-y-3">
                  {(selectedCustomer.noteEntries || []).map((entry) => (
                    <div key={entry.id} className="rounded-xl bg-white p-4">
                      <p className="text-sm text-slate-600">{entry.text}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(entry.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <textarea
                    rows="3"
                    value={detailNote}
                    onChange={(event) => setDetailNote(event.target.value)}
                    placeholder="Add another note"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveDetailNote}
                    className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-purple-600"
                  >
                    Save Note
                  </button>
                </div>
              </section>

              <section className="rounded-2xl bg-slate-50 p-6">
                <h3 className="text-2xl font-bold text-gray-900">Orders and Bookings</h3>
                <div className="mt-5 space-y-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Orders</p>
                    <div className="mt-3 space-y-3">
                      {relatedOrders.length > 0 ? (
                        relatedOrders.map((order) => (
                          <div key={order.id} className="rounded-xl bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="font-semibold text-gray-900">{order.id}</p>
                              <Link to={`/orders/${order.id}`} className="text-sm font-semibold text-blue-600">
                                View Order
                              </Link>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">
                              {order.product.title} · {order.orderStatus} · ₹{order.totalAmount}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-xl bg-white p-4 text-sm text-slate-500">No linked orders found.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Bookings</p>
                    <div className="mt-3 space-y-3">
                      {relatedBookings.length > 0 ? (
                        relatedBookings.map((booking) => (
                          <div key={`${booking.title}-${booking.date}`} className="rounded-xl bg-white p-4">
                            <p className="font-semibold text-gray-900">{booking.title}</p>
                            <p className="mt-2 text-sm text-slate-600">
                              {booking.provider} · {booking.status} ·{' '}
                              {new Date(booking.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-xl bg-white p-4 text-sm text-slate-500">No related bookings found.</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CustomerManagement;
