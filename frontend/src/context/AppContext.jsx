import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, clearTokens, getAccessToken, setTokens, subscribeToTokenChanges } from '../lib/api';

const AppContext = createContext(null);

function buildCurrentUser(meResponse) {
  const user = meResponse?.data?.user;
  const supplierProfile = meResponse?.data?.supplierProfile || null;

  if (!user) {
    return null;
  }

  return {
    ...user,
    id: user._id || user.id,
    supplierProfile,
    supplierStatus: supplierProfile?.status || 'not-applied',
  };
}

export function AppProvider({ children }) {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState(() => getAccessToken());

  useEffect(
    () =>
      subscribeToTokenChanges(({ accessToken: nextAccessToken }) => {
        setAccessToken(nextAccessToken);
      }),
    [],
  );

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: api.auth.me,
    enabled: Boolean(accessToken),
    retry: false,
  });

  useEffect(() => {
    if (meQuery.isError) {
      clearTokens();
      queryClient.clear();
    }
  }, [meQuery.isError, queryClient]);

  const currentUser = buildCurrentUser(meQuery.data);

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: api.cart.get,
    enabled: Boolean(currentUser && currentUser.role !== 'admin'),
  });

  const authMutation = useMutation({
    mutationFn: (payload) => api.auth.login(payload),
    onSuccess: (response) => {
      setTokens(response.data.tokens);
      queryClient.setQueryData(['auth', 'me'], {
        data: {
          user: response.data.user,
          supplierProfile: response.data.supplierProfile,
        },
      });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: api.auth.register,
    onSuccess: (response) => {
      setTokens(response.data.tokens);
      queryClient.setQueryData(['auth', 'me'], {
        data: {
          user: response.data.user,
          supplierProfile: response.data.supplierProfile,
        },
      });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const cartMutation = useMutation({
    mutationFn: ({ action, itemId, payload }) => {
      if (action === 'add') {
        return api.cart.add(payload);
      }

      if (action === 'update') {
        return api.cart.update(itemId, payload);
      }

      if (action === 'remove') {
        return api.cart.remove(itemId);
      }

      if (action === 'applyCoupon') {
        return api.cart.applyCoupon(payload);
      }

      if (action === 'removeCoupon') {
        return api.cart.removeCoupon();
      }

      return api.cart.clear();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const login = (payload) => authMutation.mutateAsync(payload);
  const loginAdmin = (payload) => authMutation.mutateAsync(payload);
  const register = (payload) => registerMutation.mutateAsync(payload);

  const logout = async () => {
    // Clear tokens and state immediately to ensure UI responsiveness.
    const hasToken = Boolean(getAccessToken());
    clearTokens();
    queryClient.clear();

    if (hasToken) {
      try {
        await api.auth.logout();
      } catch {
        // Ignore logout failure.
      }
    }
  };

  const value = useMemo(
    () => ({
      currentUser,
      cart: cartQuery.data?.data?.cart || null,
      login,
      loginAdmin,
      register,
      logout,
      authLoading: meQuery.isLoading,
      authPending: authMutation.isPending || registerMutation.isPending,
      cartLoading: cartQuery.isLoading,
      cartPending: cartMutation.isPending,
      addToCart: (payload) => cartMutation.mutateAsync({ action: 'add', payload }),
      updateCartItem: (itemId, payload) =>
        cartMutation.mutateAsync({ action: 'update', itemId, payload }),
      removeCartItem: (itemId) => cartMutation.mutateAsync({ action: 'remove', itemId }),
      clearCart: () => cartMutation.mutateAsync({ action: 'clear' }),
      applyCartCoupon: (payload) =>
        cartMutation.mutateAsync({ action: 'applyCoupon', payload }),
      removeCartCoupon: () => cartMutation.mutateAsync({ action: 'removeCoupon' }),
    }),
    [
      authMutation.isPending,
      cartMutation.isPending,
      cartQuery.data,
      cartQuery.isLoading,
      currentUser,
      meQuery.isLoading,
      registerMutation.isPending,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => useContext(AppContext);
