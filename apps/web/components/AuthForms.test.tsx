// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginForm, RegisterForm } from "./AuthForms";
import { UserNav } from "./UserNav";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("auth UI", () => {
  it("submits login credentials to the login API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "user-1" }) });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("location", { assign: vi.fn() });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.edu" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "long-enough-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        email: "ada@example.edu",
        password: "long-enough-password"
      })
    })));
  });

  it("submits registration details to the register API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "user-1" }) });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("location", { assign: vi.fn() });

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.edu" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "long-enough-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/auth/register", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        displayName: "Ada Lovelace",
        email: "ada@example.edu",
        password: "long-enough-password"
      })
    })));
  });

  it("shows login/register links for signed-out users and user email for signed-in users", () => {
    const { rerender } = render(<UserNav user={null} />);

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");

    rerender(<UserNav user={{ id: "user-1", displayName: "Ada Lovelace", email: "ada@example.edu", role: "user" }} />);

    expect(screen.getByText("ada@example.edu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});
