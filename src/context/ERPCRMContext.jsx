import { createContext, useContext, useEffect, useState } from 'react';
import {
  activities as defaultActivities,
  crmKPIs as defaultCrmKPIs,
  customers as defaultCustomers,
  erpResources as defaultErpResources,
  leads as defaultLeads,
  salesData as defaultSalesData,
} from '../data/erpCrmData';

const CUSTOMER_STORAGE_KEY = 'cc_customers';
const LEAD_STORAGE_KEY = 'cc_leads';
const ACTIVITY_STORAGE_KEY = 'cc_activities';
const TICKET_STORAGE_KEY = 'cc_erp_tickets';
const RESOURCE_STORAGE_KEY = 'cc_erp_resources';

const ERPCRMContext = createContext(null);

const readStorage = (key, fallback) => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallback;
  } catch (error) {
    return fallback;
  }
};

const referenceNow = new Date('2026-03-21T23:59:59+05:30');

const pushActivity = (previousActivities, type, user, description, icon) => [
  {
    id: `ACT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type,
    description,
    user,
    icon,
  },
  ...previousActivities,
];

export function ERPCRMProvider({ children }) {
  const [customers, setCustomers] = useState(() => readStorage(CUSTOMER_STORAGE_KEY, defaultCustomers));
  const [leads, setLeads] = useState(() => readStorage(LEAD_STORAGE_KEY, defaultLeads));
  const [salesData] = useState(defaultSalesData);
  const [erpResources, setErpResources] = useState(() => {
    const storedResources = readStorage(RESOURCE_STORAGE_KEY, defaultErpResources);
    const storedTickets = readStorage(TICKET_STORAGE_KEY, defaultErpResources.supportTickets);

    return {
      ...storedResources,
      supportTickets: storedTickets,
      listingMetrics: {
        ...storedResources.listingMetrics,
        pendingApproval: storedResources.approvalQueue.length,
      },
    };
  });
  const [activities, setActivities] = useState(() => readStorage(ACTIVITY_STORAGE_KEY, defaultActivities));
  const [crmKPIs] = useState(defaultCrmKPIs);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeModule, setActiveModule] = useState('erp');

  useEffect(() => {
    window.localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    window.localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    window.localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(erpResources.supportTickets));
    window.localStorage.setItem(RESOURCE_STORAGE_KEY, JSON.stringify(erpResources));
  }, [erpResources]);

  useEffect(() => {
    if (!selectedCustomer) {
      return;
    }

    const nextCustomer = customers.find((customer) => customer.id === selectedCustomer.id) || null;
    setSelectedCustomer(nextCustomer);
  }, [customers, selectedCustomer]);

  const updateLeadStatus = (leadId, newStatus) => {
    let leadName = '';
    setLeads((previousLeads) =>
      previousLeads.map((lead) => {
        if (lead.id !== leadId) {
          return lead;
        }

        leadName = lead.name;

        return {
          ...lead,
          status: newStatus,
          lastContactDate: new Date().toISOString(),
        };
      }),
    );

    if (leadName) {
      setActivities((previousActivities) =>
        pushActivity(previousActivities, 'New User', leadName, `lead status moved to ${newStatus.toLowerCase()}.`, '👤'),
      );
    }
  };

  const addCustomerNote = (customerId, note) => {
    if (!note.trim()) {
      return;
    }

    let customerName = '';
    const noteEntry = {
      id: `NOTE-${Date.now()}`,
      createdAt: new Date().toISOString(),
      text: note.trim(),
    };

    setCustomers((previousCustomers) =>
      previousCustomers.map((customer) => {
        if (customer.id !== customerId) {
          return customer;
        }

        customerName = customer.name;

        return {
          ...customer,
          noteEntries: [...(customer.noteEntries || []), noteEntry],
          lastActivity: new Date().toISOString(),
        };
      }),
    );

    if (customerName) {
      setActivities((previousActivities) =>
        pushActivity(previousActivities, 'Support Ticket', customerName, 'received a new CRM note from the team.', '🛟'),
      );
    }
  };

  const updateSupportTicket = (ticketId, status) => {
    let ticketUser = '';
    let ticketIssue = '';

    setErpResources((previousResources) => ({
      ...previousResources,
      supportTickets: previousResources.supportTickets.map((ticket) => {
        if (ticket.id !== ticketId) {
          return ticket;
        }

        ticketUser = ticket.raisedBy;
        ticketIssue = ticket.issue;

        return {
          ...ticket,
          status,
        };
      }),
    }));

    if (ticketUser) {
      setActivities((previousActivities) =>
        pushActivity(previousActivities, 'Support Ticket', ticketUser, `${ticketIssue} marked as ${status.toLowerCase()}.`, '🛟'),
      );
    }
  };

  const updateCustomerStatus = (customerId, status) => {
    setCustomers((previousCustomers) =>
      previousCustomers.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              status,
              lastActivity: new Date().toISOString(),
            }
          : customer,
      ),
    );
  };

  const approvePendingListing = (listingId) => {
    let listingTitle = '';
    setErpResources((previousResources) => {
      const nextQueue = previousResources.approvalQueue.filter((listing) => {
        if (listing.id === listingId) {
          listingTitle = listing.title;
          return false;
        }

        return true;
      });

      return {
        ...previousResources,
        approvalQueue: nextQueue,
        listingMetrics: {
          ...previousResources.listingMetrics,
          totalActive: previousResources.listingMetrics.totalActive + 1,
          pendingApproval: nextQueue.length,
        },
      };
    });

    if (listingTitle) {
      setActivities((previousActivities) =>
        pushActivity(previousActivities, 'New Listing', 'Admin', `approved listing "${listingTitle}".`, '📦'),
      );
    }
  };

  const rejectPendingListing = (listingId) => {
    let listingTitle = '';
    setErpResources((previousResources) => {
      const nextQueue = previousResources.approvalQueue.filter((listing) => {
        if (listing.id === listingId) {
          listingTitle = listing.title;
          return false;
        }

        return true;
      });

      return {
        ...previousResources,
        approvalQueue: nextQueue,
        listingMetrics: {
          ...previousResources.listingMetrics,
          removedThisMonth: previousResources.listingMetrics.removedThisMonth + 1,
          pendingApproval: nextQueue.length,
        },
      };
    });

    if (listingTitle) {
      setActivities((previousActivities) =>
        pushActivity(previousActivities, 'New Listing', 'Admin', `rejected listing "${listingTitle}".`, '📦'),
      );
    }
  };

  const getCustomerById = (id) => customers.find((customer) => customer.id === id) || null;

  const getCustomerSegments = () => ({
    highValue: customers.filter((customer) => customer.lifetimeValue > 1000),
    active: customers.filter((customer) => customer.status === 'Active'),
    new: customers.filter((customer) => customer.status === 'New'),
    atRisk: customers.filter((customer) => {
      const lastActivity = new Date(customer.lastActivity);
      const diffInDays = Math.floor((referenceNow.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
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
    salesData.categorySales.reduce((topCategory, category) =>
      category.revenue > topCategory.revenue ? category : topCategory,
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

  const currentCrmKPIs = {
    ...crmKPIs,
    totalSupportTickets: erpResources.supportTickets.length,
    resolvedTickets: erpResources.supportTickets.filter((ticket) => ticket.status === 'Resolved').length,
  };

  return (
    <ERPCRMContext.Provider
      value={{
        customers,
        leads,
        salesData,
        erpResources,
        activities,
        crmKPIs: currentCrmKPIs,
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
      }}
    >
      {children}
    </ERPCRMContext.Provider>
  );
}

export const useERPCRMContext = () => useContext(ERPCRMContext);
