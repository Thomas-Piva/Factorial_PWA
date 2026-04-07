import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "./ui-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reset store to its initial state before every test to guarantee
 * test independence (no shared state between cases).
 */
function resetStore(): void {
  useUiStore.setState(useUiStore.getInitialState());
}

// ---------------------------------------------------------------------------
// 1. Initial state
// ---------------------------------------------------------------------------

describe("ui-store — initial state", () => {
  beforeEach(resetStore);

  it("should have sidebar closed by default", () => {
    const { sidebar } = useUiStore.getState();
    expect(sidebar.isOpen).toBe(false);
  });

  it("should have loading false by default", () => {
    const { isLoading } = useUiStore.getState();
    expect(isLoading).toBe(false);
  });

  it("should have toast null by default", () => {
    const { toast } = useUiStore.getState();
    expect(toast).toBeNull();
  });

  it("should have activeModal null by default", () => {
    const { activeModal } = useUiStore.getState();
    expect(activeModal).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. Sidebar actions
// ---------------------------------------------------------------------------

describe("ui-store — sidebar", () => {
  beforeEach(resetStore);

  it("openSidebar sets isOpen to true", () => {
    useUiStore.getState().openSidebar();
    expect(useUiStore.getState().sidebar.isOpen).toBe(true);
  });

  it("closeSidebar sets isOpen to false when it was open", () => {
    useUiStore.getState().openSidebar();
    useUiStore.getState().closeSidebar();
    expect(useUiStore.getState().sidebar.isOpen).toBe(false);
  });

  it("closeSidebar is idempotent when sidebar is already closed", () => {
    useUiStore.getState().closeSidebar();
    expect(useUiStore.getState().sidebar.isOpen).toBe(false);
  });

  it("toggleSidebar opens a closed sidebar", () => {
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebar.isOpen).toBe(true);
  });

  it("toggleSidebar closes an open sidebar", () => {
    useUiStore.getState().openSidebar();
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebar.isOpen).toBe(false);
  });

  it("two consecutive toggleSidebar calls return to initial state", () => {
    useUiStore.getState().toggleSidebar();
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebar.isOpen).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Loading actions
// ---------------------------------------------------------------------------

describe("ui-store — loading", () => {
  beforeEach(resetStore);

  it("setLoading(true) sets isLoading to true", () => {
    useUiStore.getState().setLoading(true);
    expect(useUiStore.getState().isLoading).toBe(true);
  });

  it("setLoading(false) sets isLoading to false", () => {
    useUiStore.getState().setLoading(true);
    useUiStore.getState().setLoading(false);
    expect(useUiStore.getState().isLoading).toBe(false);
  });

  it("setLoading(false) is idempotent when already false", () => {
    useUiStore.getState().setLoading(false);
    expect(useUiStore.getState().isLoading).toBe(false);
  });

  it("setLoading(true) twice keeps isLoading true", () => {
    useUiStore.getState().setLoading(true);
    useUiStore.getState().setLoading(true);
    expect(useUiStore.getState().isLoading).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. showToast — all toast types
// ---------------------------------------------------------------------------

describe("ui-store — showToast", () => {
  beforeEach(resetStore);

  it("showToast with type success sets correct toast state", () => {
    useUiStore.getState().showToast("Operazione riuscita", "success");
    const { toast } = useUiStore.getState();
    expect(toast).not.toBeNull();
    expect(toast?.message).toBe("Operazione riuscita");
    expect(toast?.type).toBe("success");
    expect(toast?.visible).toBe(true);
  });

  it("showToast with type error sets correct toast state", () => {
    useUiStore.getState().showToast("Errore di rete", "error");
    const { toast } = useUiStore.getState();
    expect(toast?.message).toBe("Errore di rete");
    expect(toast?.type).toBe("error");
    expect(toast?.visible).toBe(true);
  });

  it("showToast with type info sets correct toast state", () => {
    useUiStore.getState().showToast("Informazione", "info");
    const { toast } = useUiStore.getState();
    expect(toast?.message).toBe("Informazione");
    expect(toast?.type).toBe("info");
    expect(toast?.visible).toBe(true);
  });

  it("showToast with type warning sets correct toast state", () => {
    useUiStore.getState().showToast("Attenzione", "warning");
    const { toast } = useUiStore.getState();
    expect(toast?.message).toBe("Attenzione");
    expect(toast?.type).toBe("warning");
    expect(toast?.visible).toBe(true);
  });

  it("showToast overwrites a previous toast", () => {
    useUiStore.getState().showToast("Primo", "info");
    useUiStore.getState().showToast("Secondo", "error");
    const { toast } = useUiStore.getState();
    expect(toast?.message).toBe("Secondo");
    expect(toast?.type).toBe("error");
  });

  it("showToast with empty message still sets visible true", () => {
    useUiStore.getState().showToast("", "info");
    expect(useUiStore.getState().toast?.visible).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. hideToast
// ---------------------------------------------------------------------------

describe("ui-store — hideToast", () => {
  beforeEach(resetStore);

  it("hideToast sets toast to null", () => {
    useUiStore.getState().showToast("Ciao", "success");
    useUiStore.getState().hideToast();
    expect(useUiStore.getState().toast).toBeNull();
  });

  it("hideToast is idempotent when toast is already null", () => {
    useUiStore.getState().hideToast();
    expect(useUiStore.getState().toast).toBeNull();
  });

  it("hideToast does not affect other store slices", () => {
    useUiStore.getState().openSidebar();
    useUiStore.getState().showToast("Ciao", "success");
    useUiStore.getState().hideToast();
    expect(useUiStore.getState().sidebar.isOpen).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. Modal actions
// ---------------------------------------------------------------------------

describe("ui-store — modal", () => {
  beforeEach(resetStore);

  it("openModal sets activeModal to the given name", () => {
    useUiStore.getState().openModal("confirm-delete");
    expect(useUiStore.getState().activeModal).toBe("confirm-delete");
  });

  it("openModal replaces a previously open modal", () => {
    useUiStore.getState().openModal("modal-a");
    useUiStore.getState().openModal("modal-b");
    expect(useUiStore.getState().activeModal).toBe("modal-b");
  });

  it("closeModal sets activeModal to null", () => {
    useUiStore.getState().openModal("some-modal");
    useUiStore.getState().closeModal();
    expect(useUiStore.getState().activeModal).toBeNull();
  });

  it("closeModal is idempotent when no modal is open", () => {
    useUiStore.getState().closeModal();
    expect(useUiStore.getState().activeModal).toBeNull();
  });

  it("openModal with empty string is accepted", () => {
    useUiStore.getState().openModal("");
    expect(useUiStore.getState().activeModal).toBe("");
  });
});

// ---------------------------------------------------------------------------
// 7. Cross-slice independence
// ---------------------------------------------------------------------------

describe("ui-store — cross-slice independence", () => {
  beforeEach(resetStore);

  it("sidebar actions do not affect loading state", () => {
    useUiStore.getState().openSidebar();
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().isLoading).toBe(false);
  });

  it("setLoading does not affect sidebar or modal", () => {
    useUiStore.getState().openSidebar();
    useUiStore.getState().openModal("x");
    useUiStore.getState().setLoading(true);
    expect(useUiStore.getState().sidebar.isOpen).toBe(true);
    expect(useUiStore.getState().activeModal).toBe("x");
  });

  it("closeModal does not affect loading or toast", () => {
    useUiStore.getState().setLoading(true);
    useUiStore.getState().showToast("Hi", "info");
    useUiStore.getState().openModal("m");
    useUiStore.getState().closeModal();
    expect(useUiStore.getState().isLoading).toBe(true);
    expect(useUiStore.getState().toast?.message).toBe("Hi");
  });

  it("full reset via getInitialState restores every slice", () => {
    useUiStore.getState().openSidebar();
    useUiStore.getState().setLoading(true);
    useUiStore.getState().showToast("test", "warning");
    useUiStore.getState().openModal("delete");

    resetStore();

    const state = useUiStore.getState();
    expect(state.sidebar.isOpen).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.toast).toBeNull();
    expect(state.activeModal).toBeNull();
  });
});
