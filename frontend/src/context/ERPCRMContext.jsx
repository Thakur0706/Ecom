import { createContext, useContext, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAppContext } from './AppContext';

const ERPCRMContext = createContext(null);

function average(numbers) {
  if (!numbers.length) {
    return 0;
  }

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function buildCustomerRecord(customer, noteEntries = []) {
  const status = customer.isActive === false ? 'Inactive' : 'Active';
  const roleLabel = customer.role === 'supplier' ? 'Supplier' : 'Buyer';

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    college: customer.college || 'Campus Network',
    department: customer.department || 'Student',
    role: roleLabel,
    joinedDate: customer.createdAt,
    totalOrders: customer.totalOrders || 0,
    totalSpent: customer.totalSpent || 0,
    totalSales: customer.totalSales || 0,
    activeListings: customer.activeListings || 0,
    lastActivity: customer.lastPurchaseAt || customer.createdAt,
    status,
    lifetimeValue: (customer.totalSpent || 0) + (customer.totalSales || 0),
    preferredCategory: customer.preferredCategory || 'General',
    satisfactionScore: customer.satisfactionScore || 4,
    notes: noteEntries[0]?.text || 'No notes added yet.',
    noteEntries,
    interactions: customer.interactions || [],
  };
}

function buildMonthlySales(series = []) {
  return series.map((entry) => ({
    id: entry.label || entry.month,
    month: entry.label || entry.month,
    revenue: entry.revenue || 0,
    orders: entry.orders || 0,
    newUsers: entry.signups || 0,
  }));
}

function buildCategorySales(categories = []) {
  const totalRevenue = categories.reduce((sum, category) => sum + (category.revenue || 0), 0) || 1;

  return categories.map((category) => ({
    category: category.category,
    revenue: category.revenue || 0,
    count: category.unitsSold || category.count || 0,
    percentage: Math.round(((category.revenue || 0) / totalRevenue) * 100),
  }));
}

function buildActivityItems(activities = []) {
  return activities.map((activity) => ({
    id: activity.id,
    timestamp: activity.createdAt || new Date().toISOString(),
    type:
      activity.type === 'registration'
        ? 'New User'
        : activity.type === 'order'
          ? 'Order Placed'
          : activity.type === 'review'
            ? 'Review'
            : 'Support Ticket',
    description: activity.text || '',
    user: activity.user || 'CampusConnect',
    icon:
      activity.type === 'registration'
        ? 'U'
        : activity.type === 'order'
          ? 'O'
          : activity.type === 'review'
            ? 'R'
            : 'S',
  }));
}

export function ERPCRMProvider({ children }) {
  const { currentUser } = useAppContext();
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeModule, setActiveModule] = useState('erp');
  const [localNotes, setLocalNotes] = useState({});

  const supplierCustomersQuery = useQuery({
    queryKey: ['supplier', 'crm', 'customers'],
    queryFn: api.supplier.customers,
    enabled: Boolean(currentUser?.role === 'supplier' && currentUser?.supplierStatus === 'approved'),
    retry: false,
  });

  const supplierOverviewQuery = useQuery({
    queryKey: ['supplier', 'overview'],
    queryFn: api.supplier.overview,
    enabled: Boolean(currentUser?.role === 'supplier' && currentUser?.supplierStatus === 'approved'),
    retry: false,
  });

  const supplierRevenueChartQuery = useQuery({
    queryKey: ['supplier', 'revenue-chart'],
    queryFn: api.supplier.revenueChart,
    enabled: Boolean(currentUser?.role === 'supplier' && currentUser?.supplierStatus === 'approved'),
    retry: false,
  });

  const supplierOrderMetricsQuery = useQuery({
    queryKey: ['supplier', 'order-metrics'],
    queryFn: api.supplier.orderMetrics,
    enabled: Boolean(currentUser?.role === 'supplier' && currentUser?.supplierStatus === 'approved'),
    retry: false,
  });

  const supplierCategorySalesQuery = useQuery({
    queryKey: ['supplier', 'category-sales'],
    queryFn: api.supplier.categorySales,
    enabled: Boolean(currentUser?.role === 'supplier' && currentUser?.supplierStatus === 'approved'),
    retry: false,
  });

  const supplierTopProductsQuery = useQuery({
    queryKey: ['supplier', 'top-products'],
    queryFn: api.supplier.topProducts,
    enabled: Boolean(currentUser?.role === 'supplier' && currentUser?.supplierStatus === 'approved'),
    retry: false,
  });

  const adminOverviewQuery = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: api.admin.dashboardOverview,
    enabled: Boolean(currentUser?.role === 'admin'),
  });

  const adminPendingSellersQuery = useQuery({
    queryKey: ['admin', 'pending-sellers'],
    queryFn: () => api.admin.supplierApplications({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'admin'),
  });

  const adminUsersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.admin.users({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'admin'),
  });

  const adminProductsQuery = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => api.admin.products({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'admin'),
  });

  const adminServicesQuery = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () => api.admin.services({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'admin'),
  });

  const adminErpOverviewQuery = useQuery({
    queryKey: ['admin', 'erp-overview'],
    queryFn: api.admin.analytics,
    enabled: Boolean(currentUser?.role === 'admin'),
  });

  const adminTicketsQuery = useQuery({
    queryKey: ['admin', 'tickets'],
    queryFn: () => api.admin.supportTickets({ limit: 100 }),
    enabled: Boolean(currentUser?.role === 'admin'),
  });

  const adminCrmCustomersQuery = useQuery({
    queryKey: ['admin', 'crm-customers'],
    queryFn: api.admin.users,
    enabled: Boolean(currentUser?.role === 'admin'),
  });

  const adminActivityQuery = useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: api.admin.dashboardOverview, // Activity is usually in overview
    enabled: Boolean(currentUser?.role === 'admin'),
  });

  const adminRevenueTrendQuery = useQuery({
    queryKey: ['admin', 'revenue-trend'],
    queryFn: api.admin.revenueChart,
    enabled: Boolean(currentUser?.role === 'admin'),
  });

  const adminTopSellersQuery = useQuery({
    queryKey: ['admin', 'top-sellers'],
    queryFn: api.admin.analytics, // Top sellers are in analytics
    enabled: Boolean(currentUser?.role === 'admin'),
  });

  const adminTopProductsQuery = useQuery({
    queryKey: ['admin', 'top-products'],
    queryFn: api.admin.topProducts,
    enabled: Boolean(currentUser?.role === 'admin'),
  });

  const adminUserGrowthQuery = useQuery({
    queryKey: ['admin', 'user-growth'],
    queryFn: api.admin.revenueChart, // userGrowth usually in chart data
    enabled: Boolean(currentUser?.role === 'admin'),
  });

  const myTicketsQuery = useQuery({
    queryKey: ['tickets', 'mine'],
    queryFn: () => api.support.listTickets({ limit: 100 }),
    enabled: Boolean(currentUser && currentUser.role !== 'admin'),
  });

  const moderationMutation = useMutation({
    mutationFn: ({ action, item }) => {
      if (item.kind === 'product') {
        return action === 'approve'
          ? api.admin.approveProduct(item.id)
          : api.admin.removeProduct(item.id);
      }

      return action === 'approve'
        ? api.admin.approveService(item.id)
        : api.admin.removeService(item.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
    },
  });

  const ticketMutation = useMutation({
    mutationFn: ({ ticketId, status }) =>
      api.admin.updateSupportTicket(ticketId, {
        status: status.toLowerCase(),
        adminNote: '',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] });
    },
  });

  const userMutation = useMutation({
    mutationFn: ({ userId, isActive }) => api.admin.toggleUser(userId, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'crm-customers'] });
    },
  });

  const rawCustomers =
    currentUser?.role === 'admin'
      ? adminCrmCustomersQuery.data?.data?.customers || []
      : supplierCustomersQuery.data?.data?.customers || [];

  const customers = useMemo(
    () =>
      rawCustomers.map((customer) =>
        buildCustomerRecord(customer, localNotes[customer.id] || []),
      ),
    [rawCustomers, localNotes],
  );

  const pendingProducts = adminProductsQuery.data?.data?.products?.filter((item) => item.status === 'pending') || [];
  const pendingServices =
    adminServicesQuery.data?.data?.services?.filter((item) => item.status === 'pending') || [];

  const salesData = useMemo(() => {
    if (currentUser?.role === 'admin') {
      const monthlySales = buildMonthlySales(adminRevenueTrendQuery.data?.data?.trend || []);
      return {
        monthlySales,
        categorySales: buildCategorySales(
          adminTopProductsQuery.data?.data?.products?.reduce((accumulator, product) => {
            const existing = accumulator.find((entry) => entry.category === product.category);
            if (existing) {
              existing.revenue += product.revenue;
              existing.unitsSold += product.unitsSold;
            } else {
              accumulator.push({
                category: product.category,
                revenue: product.revenue,
                unitsSold: product.unitsSold,
              });
            }
            return accumulator;
          }, []) || [],
        ),
        weeklyRevenue: monthlySales.slice(-7).map((item) => item.revenue || 0),
        topProducts:
          adminTopProductsQuery.data?.data?.products?.map((product) => ({
            title: product.title,
            category: product.category,
            soldCount: product.unitsSold,
            revenue: product.revenue,
            trend: 'up',
          })) || [],
        topSellers:
          adminTopSellersQuery.data?.data?.supplierPayables?.map((seller) => ({
            name: seller.name,
            totalSales: seller.earned,
            listingsCount: 0,
            rating: 0,
            revenue: seller.earned,
          })) || [],
      };
    }

    const monthlySales = buildMonthlySales(
      supplierRevenueChartQuery.data?.data?.chart ||
        supplierOverviewQuery.data?.data?.overview?.revenueChart ||
        [],
    );
    return {
      monthlySales,
      categorySales: buildCategorySales(supplierCategorySalesQuery.data?.data?.categories || []),
      weeklyRevenue: monthlySales.slice(-7).map((item) => item.revenue || 0),
      topProducts:
        supplierTopProductsQuery.data?.data?.products?.map((product) => ({
          title: product.title,
          category: product.category,
          soldCount: product.unitsSold,
          revenue: product.revenue,
          trend: 'up',
        })) || [],
      topSellers: currentUser
        ? [
            {
              name: currentUser.name,
              totalSales: supplierOrderMetricsQuery.data?.data?.metrics?.delivered || 0,
              listingsCount: supplierOverviewQuery.data?.data?.overview?.activeListings || 0,
              rating: supplierOverviewQuery.data?.data?.overview?.averageRating || 0,
              revenue: supplierOverviewQuery.data?.data?.overview?.totalRevenue || 0,
            },
          ]
        : [],
    };
  }, [
    currentUser,
    adminRevenueTrendQuery.data,
    adminTopProductsQuery.data,
    adminTopSellersQuery.data,
    supplierRevenueChartQuery.data,
    supplierCategorySalesQuery.data,
    supplierTopProductsQuery.data,
    supplierOrderMetricsQuery.data,
    supplierOverviewQuery.data,
  ]);

  const erpResources = useMemo(() => {
    if (currentUser?.role === 'admin') {
      const overview = adminErpOverviewQuery.data?.data?.platformHealth || {};
      return {
        platformUsage: {
          totalUsers: adminOverviewQuery.data?.data?.overview?.totalUsers || 0,
          activeToday: overview.activeUsers || 0,
          newThisWeek: adminUserGrowthQuery.data?.data?.growth?.slice(-1)?.[0]?.signups || 0,
          serverLoad: Math.min(Math.round((overview.activeUsers || 0) / 2), 100),
        },
        listingMetrics: {
          totalActive: overview.listingActivity?.approved || 0,
          pendingApproval: overview.listingActivity?.pending || 0,
          removedThisMonth: overview.listingActivity?.removed || 0,
          averageListingAge: 'Live data',
        },
        transactionMetrics: {
          totalProcessed: adminOverviewQuery.data?.data?.overview?.totalOrders || 0,
          successRate:
            adminOverviewQuery.data?.data?.overview?.totalOrders > 0
              ? Math.round(
                  ((overview.orderStatusDistribution?.delivered || 0) /
                    adminOverviewQuery.data?.data?.overview?.totalOrders) *
                    100,
                )
              : 0,
          averageValue:
            adminOverviewQuery.data?.data?.overview?.totalOrders > 0
              ? Math.round(
                  (adminOverviewQuery.data?.data?.overview?.totalPlatformRevenue || 0) /
                    adminOverviewQuery.data?.data?.overview?.totalOrders,
                )
              : 0,
          peakHour: 'Dynamic',
        },
        supportTickets:
          adminTicketsQuery.data?.data?.tickets?.map((ticket) => ({
            id: ticket._id,
            issue: ticket.subject,
            raisedBy: ticket.raisedBy?.name || 'Student',
            status:
              ticket.status === 'open'
                ? 'Open'
                : ticket.status === 'in-progress'
                  ? 'Pending'
                  : ticket.status === 'resolved'
                    ? 'Resolved'
                    : 'Resolved',
            date: new Date(ticket.createdAt).toLocaleDateString('en-IN'),
          })) || [],
        approvalQueue: [
          ...pendingProducts.map((item) => ({
            id: item._id,
            title: item.title,
            seller: item.supplier?.name || 'Supplier',
            category: item.category,
            submitted: item.createdAt,
            kind: 'product',
          })),
          ...pendingServices.map((item) => ({
            id: item._id,
            title: item.title,
            seller: item.supplier?.name || 'Supplier',
            category: item.category,
            submitted: item.createdAt,
            kind: 'service',
          })),
        ],
      };
    }

    const overview = supplierOverviewQuery.data?.data?.overview || {};
    const metrics = supplierOrderMetricsQuery.data?.data?.metrics || {};
    const myTickets = myTicketsQuery.data?.data?.tickets || [];

    return {
      platformUsage: {
        totalUsers: customers.length,
        activeToday: customers.length,
        newThisWeek: customers.filter((customer) => customer.status === 'Active').length,
        serverLoad: Math.min(customers.length * 5, 100),
      },
      listingMetrics: {
        totalActive: overview.activeListings || 0,
        pendingApproval: 0,
        removedThisMonth: 0,
        averageListingAge: 'Seller view',
      },
      transactionMetrics: {
        totalProcessed: metrics.total || 0,
        successRate: metrics.total ? Math.round(((metrics.delivered || 0) / metrics.total) * 100) : 0,
        averageValue: metrics.delivered ? Math.round((overview.totalRevenue || 0) / metrics.delivered) : 0,
        peakHour: 'Dynamic',
      },
      supportTickets: myTickets.map((ticket) => ({
        id: ticket._id,
        issue: ticket.subject,
        raisedBy: currentUser?.name || 'You',
        status:
          ticket.status === 'open'
            ? 'Open'
            : ticket.status === 'in-progress'
              ? 'Pending'
              : ticket.status === 'resolved'
                ? 'Resolved'
                : 'Resolved',
        date: new Date(ticket.createdAt).toLocaleDateString('en-IN'),
      })),
      approvalQueue: [],
    };
  }, [
    currentUser,
    customers,
    adminErpOverviewQuery.data,
    adminOverviewQuery.data,
    adminUserGrowthQuery.data,
    adminTicketsQuery.data,
    pendingProducts,
    pendingServices,
    supplierOverviewQuery.data,
    supplierOrderMetricsQuery.data,
    myTicketsQuery.data,
  ]);

  const activities = useMemo(() => {
    if (currentUser?.role === 'admin') {
      return buildActivityItems(adminActivityQuery.data?.data?.activities || []);
    }

    return customers.slice(0, 6).map((customer, index) => ({
      id: `customer-activity-${customer.id}`,
      timestamp: customer.lastActivity,
      type: index % 2 === 0 ? 'Order Placed' : 'Review',
      description:
        index % 2 === 0
          ? `placed ${customer.totalOrders} orders with your store.`
          : `has a lifetime spend of Rs ${customer.totalSpent}.`,
      user: customer.name,
      icon: index % 2 === 0 ? 'O' : 'R',
    }));
  }, [currentUser, adminActivityQuery.data, customers]);

  const crmKPIs = useMemo(() => {
    const ratings = customers.map((customer) => customer.satisfactionScore).filter(Boolean);
    const satisfaction = average(ratings);

    return {
      customerSatisfaction: Number((satisfaction || 0).toFixed(1)),
      netPromoterScore: Math.round((satisfaction || 0) * 15),
      customerRetentionRate: customers.length ? Math.min(100, Math.round((customers.length / (customers.length + 2)) * 100)) : 0,
      averageResponseTime: 'Within 24 hours',
      totalSupportTickets: erpResources.supportTickets.length,
      resolvedTickets: erpResources.supportTickets.filter((ticket) => ticket.status === 'Resolved').length,
      churnRate: Math.max(0, 100 - Math.round((customers.filter((customer) => customer.status === 'Active').length / (customers.length || 1)) * 100)),
      newCustomersThisMonth: customers.filter((customer) => {
        const now = new Date();
        const joined = new Date(customer.joinedDate || customer.createdAt || now);
        return joined.getMonth() === now.getMonth() && joined.getFullYear() === now.getFullYear();
      }).length,
    };
  }, [customers, erpResources.supportTickets]);

  const leads = useMemo(
    () =>
      (currentUser?.role === 'admin' ? adminPendingSellersQuery.data?.data?.sellers || [] : []).map((seller, index) => ({
        id: seller._id,
        name: seller.userId?.name || seller.fullName,
        college: seller.collegeName,
        source: 'Seller Application',
        status: index % 2 === 0 ? 'Interested' : 'Contacted',
        conversionProbability: seller.status === 'pending' ? 70 : 100,
      })),
    [currentUser, adminPendingSellersQuery.data],
  );

  const updateSupportTicket = (ticketId, status) => {
    if (currentUser?.role !== 'admin') {
      return Promise.resolve();
    }

    return ticketMutation.mutateAsync({ ticketId, status });
  };

  const addCustomerNote = (customerId, note) => {
    if (!note.trim()) {
      return;
    }

    setLocalNotes((previous) => ({
      ...previous,
      [customerId]: [
        ...(previous[customerId] || []),
        {
          id: `${customerId}-${Date.now()}`,
          createdAt: new Date().toISOString(),
          text: note.trim(),
        },
      ],
    }));
  };

  const updateCustomerStatus = (customerId, status) => {
    if (currentUser?.role !== 'admin') {
      return Promise.resolve();
    }

    return userMutation.mutateAsync({
      userId: customerId,
      isActive: status === 'Active',
    });
  };

  const approvePendingListing = (listingId) => {
    const item = erpResources.approvalQueue.find((entry) => entry.id === listingId);
    if (!item) {
      return Promise.resolve();
    }
    return moderationMutation.mutateAsync({ action: 'approve', item });
  };

  const rejectPendingListing = (listingId) => {
    const item = erpResources.approvalQueue.find((entry) => entry.id === listingId);
    if (!item) {
      return Promise.resolve();
    }
    return moderationMutation.mutateAsync({ action: 'remove', item });
  };

  const getCustomerById = (id) => customers.find((customer) => customer.id === id) || null;

  const getCustomerSegments = () => ({
    highValue: customers.filter((customer) => customer.lifetimeValue > 1000),
    active: customers.filter((customer) => customer.status === 'Active'),
    new: customers.filter((customer) => customer.totalOrders <= 1),
    atRisk: customers.filter((customer) => {
      const lastActivity = new Date(customer.lastActivity);
      const diffInDays = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      return diffInDays > 30;
    }),
  });

  const getSalesGrowth = () => {
    const growthSeries = salesData.monthlySales.map((entry, index, array) => {
      if (index === 0) {
        return { month: entry.month, growth: 0 };
      }

      const previousRevenue = array[index - 1].revenue;
      const growth = previousRevenue === 0 ? 0 : ((entry.revenue - previousRevenue) / previousRevenue) * 100;

      return {
        month: entry.month,
        growth,
      };
    });

    return {
      latestGrowth: growthSeries[growthSeries.length - 1]?.growth || 0,
      series: growthSeries,
    };
  };

  const getTopPerformingCategory = () =>
    salesData.categorySales.reduce(
      (topCategory, category) => (category.revenue > topCategory.revenue ? category : topCategory),
      salesData.categorySales[0] || { category: 'General', revenue: 0 },
    );

  const filterCustomers = (searchTerm, statusFilter, collegeFilter) =>
    customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || customer.status === statusFilter;
      const matchesCollege = collegeFilter === 'All' || customer.college === collegeFilter;

      return matchesSearch && matchesStatus && matchesCollege;
    });

  const updateLeadStatus = () => Promise.resolve();

  const value = useMemo(
    () => ({
      customers,
      leads,
      salesData,
      erpResources,
      activities,
      crmKPIs,
      selectedCustomer,
      setSelectedCustomer,
      activeModule,
      setActiveModule,
      updateLeadStatus,
      addCustomerNote,
      updateSupportTicket,
      updateCustomerStatus,
      approvePendingListing,
      rejectPendingListing,
      getCustomerById,
      getCustomerSegments,
      getSalesGrowth,
      getTopPerformingCategory,
      filterCustomers,
    }),
    [
      customers,
      leads,
      salesData,
      erpResources,
      activities,
      crmKPIs,
      selectedCustomer,
      activeModule,
    ],
  );

  return <ERPCRMContext.Provider value={value}>{children}</ERPCRMContext.Provider>;
}

export const useERPCRMContext = () => useContext(ERPCRMContext);
