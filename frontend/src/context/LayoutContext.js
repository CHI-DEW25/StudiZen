import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LayoutContext = createContext(null);

const STORAGE_KEY = 'studizen.layout.navPosition';

/**
 * navPosition:
 *  - left: vertical liquid-glass sidebar (default)
 *  - right: same as left, mirrored
 *  - top: liquid-glass dock (icons) with hover labels
 *  - bottom: liquid-glass dock (icons) with hover labels
 */
export const LayoutProvider = ({ children }) => {
  const [navPosition, setNavPosition] = useState('left');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'left' || saved === 'right' || saved === 'top' || saved === 'bottom') {
      setNavPosition(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, navPosition);
  }, [navPosition]);

  const value = useMemo(() => ({ navPosition, setNavPosition }), [navPosition]);

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

export const useLayout = () => {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout must be used within a LayoutProvider');
  return ctx;
};

export default LayoutContext;