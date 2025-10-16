// This simple hook allows Header.tsx to subscribe to the cart count change
// from LandingPage.tsx (or a parent component) without full context setup.
import { useState, useEffect } from "react";

// This is a minimal, temporary event-based solution for demonstration purposes.
// In a real Next.js application, you would use React Context or a state management
// library (like Zustand or Redux) for global state like the cart count.
// For the files provided, we'll use a simple global event to communicate the count.

type CartCountListener = (count: number) => void;
let currentCartCount = 0;
const listeners: Set<CartCountListener> = new Set();

// Function to update the count and notify all listeners
export const updateGlobalCartCount = (count: number) => {
  currentCartCount = count;
  listeners.forEach((listener) => listener(count));
};

// Custom hook to subscribe to the cart count
export const useCartCount = () => {
  const [cartCount, setCartCount] = useState(currentCartCount);

  useEffect(() => {
    const listener: CartCountListener = (newCount) => {
      setCartCount(newCount);
    };

    // Subscribe
    listeners.add(listener);

    // Update initial value immediately
    setCartCount(currentCartCount);

    // Unsubscribe on cleanup
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return cartCount;
};
