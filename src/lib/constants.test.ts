import { describe, it, expect } from "vitest";
import { RUOLI, NAV_ITEMS, BOTTOM_NAV_ITEMS } from "./constants";

// ---------------------------------------------------------------------------
// 1. RUOLI — regression guard (must stay green)
// ---------------------------------------------------------------------------

describe("RUOLI — regression", () => {
  it("RUOLI.MANAGER equals 'manager'", () => {
    expect(RUOLI.MANAGER).toBe("manager");
  });

  it("RUOLI.DIPENDENTE equals 'dipendente'", () => {
    expect(RUOLI.DIPENDENTE).toBe("dipendente");
  });
});

// ---------------------------------------------------------------------------
// 2. NAV_ITEMS — count
// ---------------------------------------------------------------------------

describe("NAV_ITEMS — count", () => {
  it("has exactly 7 items", () => {
    expect(NAV_ITEMS).toHaveLength(7);
  });
});

// ---------------------------------------------------------------------------
// 3. NAV_ITEMS — labels
// ---------------------------------------------------------------------------

describe("NAV_ITEMS — labels", () => {
  const expectedLabels = [
    "Home",
    "Turni",
    "Profilo",
    "Calendario",
    "Assenze",
    "Persone",
    "Impostazioni",
  ];

  it("contains all expected labels in order", () => {
    const actualLabels = NAV_ITEMS.map((item) => item.label);
    expect(actualLabels).toEqual(expectedLabels);
  });

  it("does not contain 'Export PDF'", () => {
    const labels = NAV_ITEMS.map((item) => item.label);
    expect(labels).not.toContain("Export PDF");
  });
});

// ---------------------------------------------------------------------------
// 4. NAV_ITEMS — hrefs
// ---------------------------------------------------------------------------

describe("NAV_ITEMS — hrefs", () => {
  const expectedHrefs = [
    "/",
    "/turni",
    "/profilo",
    "/calendario",
    "/assenze",
    "/persone",
    "/impostazioni",
  ];

  it("contains all expected hrefs in order", () => {
    const actualHrefs = NAV_ITEMS.map((item) => item.href);
    expect(actualHrefs).toEqual(expectedHrefs);
  });

  it("does not contain '/export'", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    expect(hrefs).not.toContain("/export");
  });
});

// ---------------------------------------------------------------------------
// 5. NAV_ITEMS — managerOnly
// ---------------------------------------------------------------------------

describe("NAV_ITEMS — managerOnly", () => {
  it("only 'Impostazioni' has managerOnly: true", () => {
    const managerOnlyItems = NAV_ITEMS.filter(
      (item) => "managerOnly" in item && item.managerOnly === true
    );
    expect(managerOnlyItems).toHaveLength(1);
    expect(managerOnlyItems[0].label).toBe("Impostazioni");
  });

  it("'Persone' does NOT have managerOnly: true", () => {
    const persone = NAV_ITEMS.find((item) => item.label === "Persone");
    expect(persone).toBeDefined();
    const managerOnly = "managerOnly" in persone! ? persone!.managerOnly : undefined;
    expect(managerOnly).not.toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. NAV_ITEMS — icons are React component functions (not strings)
// ---------------------------------------------------------------------------

describe("NAV_ITEMS — icons are React components", () => {
  it("every item's icon is a React component (function or forwardRef object)", () => {
    for (const item of NAV_ITEMS) {
      const t = typeof item.icon;
      expect(t === "function" || t === "object").toBe(true);
    }
  });

  it("no item's icon is a string", () => {
    for (const item of NAV_ITEMS) {
      expect(typeof item.icon).not.toBe("string");
    }
  });
});

// ---------------------------------------------------------------------------
// 7. BOTTOM_NAV_ITEMS — existence and count
// ---------------------------------------------------------------------------

describe("BOTTOM_NAV_ITEMS — existence and count", () => {
  it("BOTTOM_NAV_ITEMS is exported and defined", () => {
    expect(BOTTOM_NAV_ITEMS).toBeDefined();
  });

  it("has exactly 2 items", () => {
    expect(BOTTOM_NAV_ITEMS).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// 8. BOTTOM_NAV_ITEMS — 'Preferenze' item
// ---------------------------------------------------------------------------

describe("BOTTOM_NAV_ITEMS — Preferenze", () => {
  it("contains an item with label 'Preferenze'", () => {
    const item = BOTTOM_NAV_ITEMS.find((i) => i.label === "Preferenze");
    expect(item).toBeDefined();
  });

  it("'Preferenze' has href '/preferenze'", () => {
    const item = BOTTOM_NAV_ITEMS.find((i) => i.label === "Preferenze");
    expect(item?.href).toBe("/preferenze");
  });

  it("'Preferenze' icon is a React component", () => {
    const item = BOTTOM_NAV_ITEMS.find((i) => i.label === "Preferenze");
    const t = typeof item?.icon;
    expect(t === "function" || t === "object").toBe(true);
  });

  it("'Preferenze' does not have isAction: true", () => {
    const item = BOTTOM_NAV_ITEMS.find((i) => i.label === "Preferenze");
    const isAction = item && "isAction" in item ? item.isAction : undefined;
    expect(isAction).not.toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9. BOTTOM_NAV_ITEMS — 'Esci' item
// ---------------------------------------------------------------------------

describe("BOTTOM_NAV_ITEMS — Esci", () => {
  it("contains an item with label 'Esci'", () => {
    const item = BOTTOM_NAV_ITEMS.find((i) => i.label === "Esci");
    expect(item).toBeDefined();
  });

  it("'Esci' has isAction: true", () => {
    const item = BOTTOM_NAV_ITEMS.find((i) => i.label === "Esci");
    expect(item && "isAction" in item ? item.isAction : undefined).toBe(true);
  });

  it("'Esci' has no href", () => {
    const item = BOTTOM_NAV_ITEMS.find((i) => i.label === "Esci");
    expect(item && "href" in item ? item.href : undefined).toBeUndefined();
  });

  it("'Esci' icon is a React component", () => {
    const item = BOTTOM_NAV_ITEMS.find((i) => i.label === "Esci");
    const t = typeof item?.icon;
    expect(t === "function" || t === "object").toBe(true);
  });
});
