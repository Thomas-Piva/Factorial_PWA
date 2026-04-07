import { create } from "zustand";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  message: string;
  type: ToastType;
  visible: boolean;
}

export interface Sidebar {
  isOpen: boolean;
}

export interface UiState {
  sidebar: Sidebar;
  isLoading: boolean;
  toast: Toast | null;
  activeModal: string | null;
}

export interface UiActions {
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setLoading: (value: boolean) => void;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
  openModal: (name: string) => void;
  closeModal: () => void;
}

export type UiStore = UiState & UiActions;

// ---------------------------------------------------------------------------
// Initial state factory
// Returning a fresh object each time prevents shared-reference mutations
// between the live store and test resets.
// ---------------------------------------------------------------------------

function buildInitialState(): UiState {
  return {
    sidebar: { isOpen: false },
    isLoading: false,
    toast: null,
    activeModal: null,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUiStore = create<UiStore>()((set) => ({
  ...buildInitialState(),

  // --- Sidebar ---

  openSidebar: () =>
    set((s) => ({ sidebar: { ...s.sidebar, isOpen: true } })),

  closeSidebar: () =>
    set((s) => ({ sidebar: { ...s.sidebar, isOpen: false } })),

  toggleSidebar: () =>
    set((s) => ({ sidebar: { ...s.sidebar, isOpen: !s.sidebar.isOpen } })),

  // --- Loading ---

  setLoading: (value) => set({ isLoading: value }),

  // --- Toast ---

  showToast: (message, type) =>
    set({ toast: { message, type, visible: true } }),

  hideToast: () => set({ toast: null }),

  // --- Modal ---

  openModal: (name) => set({ activeModal: name }),

  closeModal: () => set({ activeModal: null }),
}));

