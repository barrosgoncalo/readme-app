// src/components/ui/TabBarContext.tsx
import { createContext, useContext } from 'react';

type TabBarContextType = {
  showTabBar: () => void;
  hideTabBar: () => void;
};

export const TabBarVisibilityContext = createContext<TabBarContextType>({
  showTabBar: () => {},
  hideTabBar: () => {},
});

export const useTabBarVisibility = () => useContext(TabBarVisibilityContext);
