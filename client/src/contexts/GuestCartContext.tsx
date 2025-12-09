import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Product } from "@shared/schema";

export interface GuestCartItem {
  id: string;
  product: Product;
  quantity: number;
}

interface GuestCartContextType {
  items: GuestCartItem[];
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  itemCount: number;
}

const GuestCartContext = createContext<GuestCartContextType | undefined>(undefined);

const GUEST_CART_KEY = "cara_guest_cart";

interface GuestCartProviderProps {
  children: ReactNode;
}

export function GuestCartProvider({ children }: GuestCartProviderProps) {
  const [items, setItems] = useState<GuestCartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem(GUEST_CART_KEY);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setItems(parsed);
      } catch {
        localStorage.removeItem(GUEST_CART_KEY);
      }
    }
  }, []);

  const saveToStorage = useCallback((newItems: GuestCartItem[]) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(newItems));
  }, []);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      let newItems: GuestCartItem[];
      
      if (existingItem) {
        newItems = prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [...prev, { id: product.id, product, quantity }];
      }
      
      saveToStorage(newItems);
      return newItems;
    });
  }, [saveToStorage]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems(prev => {
      const newItems = quantity <= 0
        ? prev.filter(item => item.product.id !== productId)
        : prev.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
          );
      
      saveToStorage(newItems);
      return newItems;
    });
  }, [saveToStorage]);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.product.id !== productId);
      saveToStorage(newItems);
      return newItems;
    });
  }, [saveToStorage]);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(GUEST_CART_KEY);
  }, []);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <GuestCartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
      }}
    >
      {children}
    </GuestCartContext.Provider>
  );
}

export function useGuestCart() {
  const context = useContext(GuestCartContext);
  if (context === undefined) {
    throw new Error("useGuestCart must be used within a GuestCartProvider");
  }
  return context;
}
