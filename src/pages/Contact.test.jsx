/**
 * @vitest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/ui/use-toast";
import Contact from "./Contact";

const mockSubmitLead = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: () => mockSubmitLead,
}));

vi.mock("@/components/ui/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@sentry/react", () => ({
  captureException: vi.fn(),
}));

vi.mock("react-helmet", () => ({
  Helmet: ({ children }) => <>{children}</>,
}));

vi.mock("framer-motion", () => {
  const motion = new Proxy(
    {},
    {
      get: (_, tag) =>
        function MotionComponent({ children, ...props }) {
          return React.createElement(String(tag), props, children);
        },
    },
  );
  return { motion };
});

describe("Contact form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitLead.mockResolvedValue({ success: true });
  });

  it("FE-001: empty submit click shows missing fields toast, mutation not called", async () => {
    const user = userEvent.setup();
    const { container } = render(<Contact />);
    const form = container.querySelector("form");
    expect(form.noValidate).toBe(true);
    expect(container.querySelector('input[name="name"]').required).toBe(true);

    await user.click(screen.getByRole("button", { name: /send my project details/i }));

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Uh oh! Missing fields.",
        variant: "destructive",
      }),
    );
    expect(mockSubmitLead).not.toHaveBeenCalled();
  });

  it("FE-002: whitespace-only required fields are treated as missing", () => {
    const { container } = render(<Contact />);
    fireEvent.change(container.querySelector('input[name="name"]'), {
      target: { name: "name", value: "   " },
    });
    fireEvent.change(container.querySelector('input[name="email"]'), {
      target: { name: "email", value: "   " },
    });
    fireEvent.change(container.querySelector('textarea[name="description"]'), {
      target: { name: "description", value: "   " },
    });

    fireEvent.submit(container.querySelector("form"));

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Uh oh! Missing fields.",
        variant: "destructive",
      }),
    );
    expect(mockSubmitLead).not.toHaveBeenCalled();
  });

  it("FE-003: valid submit calls mutation", async () => {
    const { container } = render(<Contact />);
    const nameEl = container.querySelector('input[name="name"]');
    fireEvent.change(nameEl, {
      target: { name: "name", value: "Jane Doe" },
    });
    fireEvent.change(container.querySelector('input[name="email"]'), {
      target: { name: "email", value: "jane@example.com" },
    });
    fireEvent.change(container.querySelector('textarea[name="description"]'), {
      target: { name: "description", value: "Need help with a CV pipeline." },
    });
    fireEvent.submit(container.querySelector("form"));
    await waitFor(() => {
      expect(mockSubmitLead).toHaveBeenCalledWith({
        name: "Jane Doe",
        email: "jane@example.com",
        budget: undefined,
        description: "Need help with a CV pipeline.",
      });
    });
  });

  it("FE-004: mutation failure shows Convex error message in toast", async () => {
    mockSubmitLead.mockRejectedValue({ data: "Please wait before submitting again." });
    const { container } = render(<Contact />);
    fireEvent.change(container.querySelector('input[name="name"]'), {
      target: { name: "name", value: "Jane Doe" },
    });
    fireEvent.change(container.querySelector('input[name="email"]'), {
      target: { name: "email", value: "jane@example.com" },
    });
    fireEvent.change(container.querySelector('textarea[name="description"]'), {
      target: { name: "description", value: "Need help." },
    });
    fireEvent.submit(container.querySelector("form"));
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Submission Failed",
          description: "Please wait before submitting again.",
          variant: "destructive",
        }),
      );
    });
  });
});
