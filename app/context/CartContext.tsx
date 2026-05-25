'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  stock: number;
  imageUrl?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
// const CartContext = createContext<any>(null);


export const CartProvider = ({ children }: { children: React.ReactNode }) => {

    //   const [cart, setCart] = useState<CartItem[]>(() => {
    //     const saved = localStorage.getItem('cart');
    //     return saved ? JSON.parse(saved) : [];
    //   });
    const [cart, setCart] = useState<CartItem[]>([]);

    // only run to client
    useEffect(() => {
        const saved = localStorage.getItem('cart');
        if (saved) {
            setCart(JSON.parse(saved));
        }
    }, []);


    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item: CartItem) => {
        setCart(prev => {
        const exists = prev.find(p => p.id === item.id);
        if (exists) {
            return prev.map(p =>
            p.id === item.id ? { ...p, quantity: p.quantity + item.quantity } : p
            );
        }
        return [...prev, item];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(p => p.id !== id));
    };

    const increaseQuantity = (id: string) => {
        setCart(prev =>
            prev.map(item =>
            item.id === id && item.quantity < item.stock
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
        );
        };

    const decreaseQuantity = (id: string) => {
        setCart(prev =>
            prev.map(item =>
            item.id === id && item.quantity > 1
                ? { ...item, quantity: item.quantity - 1 }
                : item
            )
        );
    };

    const clearCart = () => setCart([]);

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartCount, increaseQuantity, decreaseQuantity  }}>
            {children}
        </CartContext.Provider>
    );
};

// export const useCart = () => useContext(CartContext);
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
