import { useState, useCallback } from 'react';

export interface DrawerState {
  isOpen: boolean;
  mode: 'view' | 'edit' | 'create';
  data?: any;
  parent?: DrawerState; // Per drawer annidati
}

export interface UseDrawerReturn {
  isOpen: boolean;
  mode: 'view' | 'edit' | 'create';
  data: any;
  parent?: DrawerState;
  open: (data?: any, mode?: 'view' | 'edit' | 'create') => void;
  close: () => void;
  setMode: (mode: 'view' | 'edit' | 'create') => void;
  updateData: (data: any) => void;
  openNested: (data?: any, mode?: 'view' | 'edit' | 'create') => void;
  closeToParent: () => void;
}

export function useDrawer(initialState?: Partial<DrawerState>): UseDrawerReturn {
  const [state, setState] = useState<DrawerState>({
    isOpen: false,
    mode: 'view',
    data: undefined,
    parent: undefined,
    ...initialState
  });

  const open = useCallback((data?: any, mode: 'view' | 'edit' | 'create' = 'view') => {
    setState({
      isOpen: true,
      mode,
      data,
      parent: undefined
    });
  }, []);

  const close = useCallback(() => {
    setState({
      isOpen: false,
      mode: 'view',
      data: undefined,
      parent: undefined
    });
  }, []);

  const setMode = useCallback((mode: 'view' | 'edit' | 'create') => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  const updateData = useCallback((data: any) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  // Apre un drawer annidato salvando lo stato corrente come parent
  const openNested = useCallback((data?: any, mode: 'view' | 'edit' | 'create' = 'view') => {
    setState(prev => ({
      isOpen: true,
      mode,
      data,
      parent: { ...prev }
    }));
  }, []);

  // Chiude il drawer corrente e ripristina il parent
  const closeToParent = useCallback(() => {
    setState(prev => {
      if (prev.parent) {
        return { ...prev.parent };
      }
      return {
        isOpen: false,
        mode: 'view',
        data: undefined,
        parent: undefined
      };
    });
  }, []);

  return {
    isOpen: state.isOpen,
    mode: state.mode,
    data: state.data,
    parent: state.parent,
    open,
    close,
    setMode,
    updateData,
    openNested,
    closeToParent
  };
}
