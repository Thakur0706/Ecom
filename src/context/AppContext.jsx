import { createContext, useContext, useEffect, useState } from 'react';

const USER_STORAGE_KEY = 'campusconnect_user';
const CART_STORAGE_KEY = 'campusconnect_cart';

const AppContext = createContext(null);

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  const nextRole = user.role === 'student' ? 'both' : user.role || 'buyer';

  return {
    ...user,
    id: user.id || 'user_1',
    role: nextRole,
  };
};

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

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => normalizeUser(readStorage(USER_STORAGE_KEY, null)));
  const [cart, setCart] = useState(() => readStorage(CART_STORAGE_KEY, []));

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((previousCart) => {
      const existingItem = previousCart.find((item) => item.id === product.id);

      if (existingItem) {
        return previousCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [
        ...previousCart,
        {
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          category: product.category,
          seller: product.seller,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCart((previousCart) => previousCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, nextQuantity) => {
    if (nextQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((previousCart) =>
      previousCart.map((item) =>
        item.id === productId ? { ...item, quantity: nextQuantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const login = (user) => {
    setCurrentUser(normalizeUser(user));
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
