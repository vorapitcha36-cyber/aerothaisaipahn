// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

afterEach(cleanup);

describe("AEROTHAI Security Hub", () => {
  it("renders the dashboard and opens the document modal", () => {
    render(<App />);
    expect(screen.getByText("ภาพรวมมาตรฐานการรักษาความปลอดภัย")).toBeInTheDocument();
    expect(screen.getByText("224")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /เพิ่มข้อมูล/ }));
    expect(screen.getByRole("dialog", { name: "เพิ่มข้อมูลใหม่" })).toBeInTheDocument();
  });

  it("navigates to the shared document registry view", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "แผนและการฝึกซ้อม" }));
    expect(screen.getByText("ทะเบียนเอกสารมาตรฐาน")).toBeInTheDocument();
    expect(screen.getByText("CNS-PLN-001")).toBeInTheDocument();
  });
});
