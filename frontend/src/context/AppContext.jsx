import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, clearTokens, getAccessToken, setTokens, subscribeToTokenChanges } from '../lib/api';
import { imageWithFallback } from '../lib/formatters';

const AppContext = createContext(null);

function buildCurrentUser(meResponse) {
  const user = meResponse?.data?.user;
  const sellerProfile = meResponse?.data?.sellerProfile || null;

  if (!user) {
    return null;
  }

  return {
    ...user,
    id: user.id,
    sellerProfile,
    sellerStatus: sellerProfile?.status || 'not-applied',
  };
}

function buildCartItems(cartResponse) {
  const items = cartResponse?.data?.cart?.items || [];

  return items.map((item) => ({
    id: item.productId,
    title: item.title,
    price: item.price,
    image: imageWithFallback(item.imageUrl),
    category: item.category,
    seller: item.seller?.name || 'Campus Seller',
    quantity: item.quantity,
  }));
}

export function AppProvider({ children }) {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState(() => getAccessToken());

  useEffect(() => subscribeToTokenChanges(({ accessToken: nextAccessToken }) => {
    setAccessToken(nextAccessToken);
  }), []);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: api.auth.me,
    enabled: Boolean(accessToken),
    retry: false,
  });

  useEffect(() => {
    if (meQuery.isError) {
      clearTokens();
      queryClient.setQueryData(['auth', 'me'], {
        data: {
          user: null,
          sellerProfile: null,
        },
      });
      queryClient.removeQueries({ queryKey: ['auth', 'me'] });
      queryClient.removeQueries({ queryKey: ['cart'] });
    }
  }, [meQuery.isError, queryClient]);

  const currentUser = buildCurrentUser(meQuery.data);

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: api.cart.get,
    enabled: Boolean(currentUser && currentUser.role !== 'admin'),
  });

  const authMutation = useMutation({
    mutationFn: async ({ mode, payload }) => {
      if (mode === 'register') {
        return api.auth.register(payload);
      }

      if (mode === 'admin') {
        return api.auth.adminLogin(payload);
      }

      return api.auth.login(payload);
    },
    onSuccess: (response) => {
      setTokens(response.data.tokens);
      queryClient.setQueryData(['auth', 'me'], {
        data: {
          user: response.data.user,
          sellerProfile: response.data.sellerProfile,
        },
      });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const cartMutation = useMutation({
    mutationFn: ({ action, payload }) => {
      if (action === 'add') {
        return api.cart.add(payload);
      }

      if (action === 'update') {
        return api.cart.update(payload);
      }

      if (action === 'remove') {
        return api.cart.remove(payload);
      }

      return api.cart.clear();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const login = (payload) => authMutation.mutateAsync({ mode: 'login', payload });
  const register = (payload) => authMutation.mutateAsync({ mode: 'register', payload });
  const loginAdmin = (payload) => authMutation.mutateAsync({ mode: 'admin', payload });

  const logout = async () => {
    queryClient.setQueryData(['auth', 'me'], {
      data: {
        user: null,
        sellerProfile: null,
      },
    });
    queryClient.setQueryData(['cart'], {
      data: {
        cart: {
          items: [],
        },
      },
    });

    try {
      if (getAccessToken()) {
        await api.auth.logout();
      }
    } catch {
      // Local sign-out still completes even if the session has already expired on the server.
    } finally {
      clearTokens();
      queryClient.clear();
    }
  };

  const addToCart = (product, quantity = 1) =>
    cartMutation.mutateAsync({
      action: 'add',
      payload: {
        productId: product.id,
        quantity,
      },
    });

  const removeFromCart = (productId) =>
    cartMutation.mutateAsync({
      action: 'remove',
      payload: productId,
    });

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    return cartMutation.mutateAsync({
      action: 'update',
      payload: { productId, quantity },
    });
  };

  const clearCart = () =>
    cartMutation.mutateAsync({
      action: 'clear',
    });

  const value = useMemo(
    () => ({
      currentUser,
      sellerProfile: currentUser?.sellerProfile || null,
      cart: buildCartItems(cartQuery.data),
      login,
      register,
      loginAdmin,
      logout,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      authLoading: meQuery.isLoading,
      cartLoading: cartQuery.isLoading,
      authPending: authMutation.isPending,
      cartPending: cartMutation.isPending,
      isAuthenticated: Boolean(currentUser),
    }),
    [
      currentUser,
      cartQuery.data,
      cartQuery.isLoading,
      meQuery.isLoading,
      authMutation.isPending,
      cartMutation.isPending,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => useContext(AppContext);
