import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface AppState {
  darkMode: boolean;
  favorites: string[];
  selectedCategory: string | null;
  sidebarOpen: boolean;
  searchQuery: string;
  calculatorHistory: string[];
}

type AppAction =
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'ADD_FAVORITE'; calculatorId: string }
  | { type: 'REMOVE_FAVORITE'; calculatorId: string }
  | { type: 'TOGGLE_FAVORITE'; calculatorId: string }
  | { type: 'SET_SELECTED_CATEGORY'; category: string | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; open: boolean }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'ADD_TO_HISTORY'; calculatorId: string }
  | { type: 'LOAD_STATE'; state: Partial<AppState> };

const initialState: AppState = {
  darkMode: false,
  favorites: [],
  selectedCategory: null,
  sidebarOpen: false,
  searchQuery: '',
  calculatorHistory: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    
    case 'ADD_FAVORITE':
      if (state.favorites.includes(action.calculatorId)) return state;
      return {
        ...state,
        favorites: [...state.favorites, action.calculatorId],
      };
    
    case 'REMOVE_FAVORITE':
      return {
        ...state,
        favorites: state.favorites.filter(id => id !== action.calculatorId),
      };
    
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        favorites: state.favorites.includes(action.calculatorId)
          ? state.favorites.filter(id => id !== action.calculatorId)
          : [...state.favorites, action.calculatorId],
      };
    
    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.category };
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.open };
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };
    
    case 'ADD_TO_HISTORY':
      if (state.calculatorHistory.includes(action.calculatorId)) return state;
      return {
        ...state,
        calculatorHistory: [action.calculatorId, ...state.calculatorHistory.slice(0, 9)],
      };
    
    case 'LOAD_STATE':
      return { ...state, ...action.state };
    
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenient action creators
  toggleDarkMode: () => void;
  toggleFavorite: (calculatorId: string) => void;
  setSelectedCategory: (category: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  addToHistory: (calculatorId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [storedState, setStoredState] = useLocalStorage('numera-app-state', initialState);
  
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    ...storedState,
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    setStoredState(state);
  }, [state, setStoredState]);

  // Apply dark mode to document
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  const value: AppContextType = {
    state,
    dispatch,
    toggleDarkMode: () => dispatch({ type: 'TOGGLE_DARK_MODE' }),
    toggleFavorite: (calculatorId: string) => dispatch({ type: 'TOGGLE_FAVORITE', calculatorId }),
    setSelectedCategory: (category: string | null) => dispatch({ type: 'SET_SELECTED_CATEGORY', category }),
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    setSidebarOpen: (open: boolean) => dispatch({ type: 'SET_SIDEBAR_OPEN', open }),
    setSearchQuery: (query: string) => dispatch({ type: 'SET_SEARCH_QUERY', query }),
    addToHistory: (calculatorId: string) => dispatch({ type: 'ADD_TO_HISTORY', calculatorId }),
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}