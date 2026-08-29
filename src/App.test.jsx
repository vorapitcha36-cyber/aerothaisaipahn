import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
vi.mock("./components/ThailandMap", async () => {
  const { useApp } = await import("./context/AppContext");
  return {
    default: function MockThailandMap() {
      const { dispatch } = useApp();
      return <div aria-label="แผนที่ประเทศไทยจำลอง"><button onClick={() => dispatch({ type: "SELECT_AREA", areaId: "phs" })}>เลือกพิษณุโลกจากแผนที่</button></div>;
    },
  };
});
import App from "./App";
import { STORAGE_KEY } from "./lib/dashboard";

async function renderApp() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => { root.render(<App />); });
  return { host, root };
}

const findButton = (host, label) => [...host.querySelectorAll("button")].find((button) => button.textContent.includes(label));
const setNativeValue = (element, value) => {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value").set.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
};

describe("dashboard interactions", () => {
  it("selects an area from the area list and updates the detail panel", async () => {
    const { host, root } = await renderApp();
    const target = [...host.querySelectorAll(".area-item-main")].find((button) => button.querySelector("strong")?.textContent === "พิษณุโลก");
    await act(async () => { target.click(); });
    expect(host.querySelector(".compliance-section h3").textContent).toContain("พิษณุโลก");
    await act(async () => { root.unmount(); });
  });

  it("selects an area from the map and synchronizes the detail panel", async () => {
    const { host, root } = await renderApp();
    await act(async () => { findButton(host, "เลือกพิษณุโลกจากแผนที่").click(); });
    expect(host.querySelector(".compliance-section h3").textContent).toContain("พิษณุโลก");
    await act(async () => { root.unmount(); });
  });

  it("changes mock role and hides editing controls for Viewer", async () => {
    const { host, root } = await renderApp();
    const role = host.querySelector(".role-switcher select");
    await act(async () => {
      role.value = "viewer";
      role.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(findButton(host, "เพิ่มข้อมูล")).toBeUndefined();
    expect(findButton(host, "บันทึกข้อมูล")).toBeUndefined();
    await act(async () => { root.unmount(); });
  });

  it("saves a compliance date and persists dates without note text", async () => {
    const { host, root } = await renderApp();
    await act(async () => { findButton(host, "บันทึกข้อมูล").click(); });
    const form = host.querySelector(".dialog-body form");
    const dateInput = form.querySelector('input[type="date"]:not([readonly])');
    const note = form.querySelector("textarea");
    await act(async () => {
      setNativeValue(dateInput, "2026-08-20");
      setNativeValue(note, "ข้อความเฉพาะ session");
    });
    await act(async () => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    expect(host.querySelector(".compliance-card .ui-badge").textContent).toContain("ครบถ้วน");
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(stored.records.find((record) => record.lastReviewDate === "2026-08-20")).toBeTruthy();
    expect(JSON.stringify(stored)).not.toContain("ข้อความเฉพาะ session");
    await act(async () => { root.unmount(); });
  });
});
