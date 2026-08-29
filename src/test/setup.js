import { afterEach, beforeEach, vi } from "vitest";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  window.localStorage.clear();
  window.confirm = vi.fn(() => true);
  URL.createObjectURL = vi.fn(() => "blob:mock-document");
  URL.revokeObjectURL = vi.fn();
  globalThis.fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({
      type: "Topology",
      objects: { provinces: { type: "GeometryCollection", geometries: [] } },
      arcs: [],
    }),
  }));
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});
