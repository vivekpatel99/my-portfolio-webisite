/**
 * @vitest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen, waitFor, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/ui/use-toast";
import { captureException } from "@/lib/sentryTelemetry";
import Contact from "./Contact";
import { CONTACT_LEAD_VALIDATION_ERROR } from "../../convex/lib/leadValidation";

const mockSubmitLead = vi.fn();

const GLOBAL_RATE_LIMIT_ERROR =
  "The site is receiving too many requests. Please wait a few minutes and try again.";
const EMAIL_RATE_LIMIT_ERROR =
  "This email already sent several messages recently. Please wait before submitting again.";
const SAFE_SUBMIT_FAILURE =
  "We couldn't send your request. Please try again, or use the email address on this page.";
const DIAGNOSTIC_MESSAGE =
  "[CONVEX M(leads:submitLead)] [Request ID: synthetic-audit] Server Error\n    at syntheticStack (fixture.js:1:1)\n  Called by client";

function errorWithMessage(message, data) {
  const error = new Error(message);
  if (data !== undefined) error.data = data;
  return error;
}

function fillValidLead(container, { budget } = {}) {
  fireEvent.change(container.querySelector('input[name="name"]'), {
    target: { name: "name", value: "Jane Doe" },
  });
  fireEvent.change(container.querySelector('input[name="email"]'), {
    target: { name: "email", value: "jane@example.com" },
  });
  if (budget) {
    fireEvent.change(container.querySelector("#budget"), { target: { value: budget } });
  }
  fireEvent.change(container.querySelector('textarea[name="description"]'), {
    target: { name: "description", value: "Need help." },
  });
}

function expectNoDiagnostics() {
  const rendered = JSON.stringify(toast.mock.calls);
  for (const fragment of ["Request ID", "CONVEX", "Server Error", "syntheticStack", "fixture.js", "Called by client", "internal-detail"]) {
    expect(rendered).not.toContain(fragment);
  }
}

vi.mock("convex/react", () => ({
  useMutation: () => mockSubmitLead,
}));

vi.mock("@/components/ui/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/lib/sentryTelemetry", () => ({
  captureException: vi.fn(),
}));

vi.mock("react-helmet", () => ({
  Helmet: ({ children }) => <>{children}</>,
}));

vi.mock("framer-motion", () => {
  // Cache per tag so re-renders keep the same component type (no remount, focus survives).
  const cache = new Map();
  const motion = new Proxy(
    {},
    {
      get: (_, tag) => {
        if (!cache.has(tag)) {
          cache.set(tag, function MotionComponent({ children, ...props }) {
            return React.createElement(String(tag), props, children);
          });
        }
        return cache.get(tag);
      },
    },
  );
  return { motion };
});

describe("Contact form", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockSubmitLead.mockResolvedValue({ success: true });
  });

  it("FE-001: empty submit click shows missing fields toast, mutation not called", async () => {
    const user = userEvent.setup();
    const { container } = render(<Contact />);
    const form = container.querySelector("form");
    expect(form.noValidate).toBe(true);
    expect(form.hasAttribute("action")).toBe(false);
    expect(container.querySelector('input[name="name"]').required).toBe(true);

    await user.click(screen.getByRole("button", { name: /send project request/i }));

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Uh oh! Missing fields.",
        variant: "destructive",
      }),
    );
    expect(mockSubmitLead).not.toHaveBeenCalled();
    expect(container.querySelector('input[name="name"]').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
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

  it("FE-003: invalid email is rejected before mutation", () => {
    const { container } = render(<Contact />);
    fireEvent.change(container.querySelector('input[name="name"]'), {
      target: { name: "name", value: "Jane Doe" },
    });
    fireEvent.change(container.querySelector('input[name="email"]'), {
      target: { name: "email", value: "not-an-email" },
    });
    fireEvent.change(container.querySelector('textarea[name="description"]'), {
      target: { name: "description", value: "Need help with a CV pipeline." },
    });

    fireEvent.submit(container.querySelector("form"));

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Invalid email address.",
        variant: "destructive",
      }),
    );
    expect(mockSubmitLead).not.toHaveBeenCalled();
  });

  it("FE-004: valid submit calls mutation", async () => {
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

  it("FE-005: mutation failure shows the backend rate-limit message in toast", async () => {
    mockSubmitLead.mockRejectedValue({ data: EMAIL_RATE_LIMIT_ERROR });
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
          description: EMAIL_RATE_LIMIT_ERROR,
          variant: "destructive",
        }),
      );
    });
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException.mock.calls[0][1].telemetrySource.matches('[data-sensitive-telemetry]'))
      .toBe(true);
  });

  it("shows server validation failures without diagnostics or submitted text", async () => {
    mockSubmitLead.mockRejectedValue({ data: CONTACT_LEAD_VALIDATION_ERROR });
    const { container } = render(<Contact />);
    fireEvent.change(container.querySelector('input[name="name"]'), { target: { value: "Private Name" } });
    fireEvent.change(container.querySelector('input[name="email"]'), { target: { value: "private@example.com" } });
    fireEvent.change(container.querySelector('textarea[name="description"]'), { target: { value: "Private oversized text ".repeat(250) } });
    fireEvent.submit(container.querySelector("form"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith({
      title: "Submission Failed",
      description: CONTACT_LEAD_VALIDATION_ERROR,
      variant: "destructive",
    }));
    expect(mockSubmitLead).toHaveBeenCalledTimes(1);
    expect(captureException).not.toHaveBeenCalled();
    expect(JSON.stringify(toast.mock.calls)).not.toContain("Private");
  });

  it('marks the contact form as a generic sensitive telemetry region', () => {
    const { container } = render(<Contact />);
    expect(container.querySelectorAll('[data-sensitive-telemetry]')).toHaveLength(1);
    expect(container.querySelector('form[data-sensitive-telemetry]')).toBeTruthy();
  });

  it('shows a field-specific inline error for each missing required field', () => {
    const { container } = render(<Contact />);
    fireEvent.submit(container.querySelector('form'));

    expect(screen.getByText('Name is required.')).toBeTruthy();
    expect(screen.getByText('Email is required.')).toBeTruthy();
    expect(screen.getByText('Project description is required.')).toBeTruthy();
    expect(container.querySelector('input[name="name"]').getAttribute('aria-invalid')).toBe('true');
    expect(container.querySelector('input[name="email"]').getAttribute('aria-invalid')).toBe('true');
    expect(container.querySelector('textarea[name="description"]').getAttribute('aria-invalid')).toBe('true');
    expect(container.querySelector('input[name="name"]').getAttribute('aria-describedby')).toBe('name-error');
    expect(container.querySelector('input[name="email"]').getAttribute('aria-describedby')).toBe('email-error');
    expect(container.querySelector('textarea[name="description"]').getAttribute('aria-describedby')).toBe('description-error');
  });

  it.each([
    ['name', 'Name is required.', { email: 'jane@example.com', description: 'Need help with a pipeline.' }],
    ['email', 'Email is required.', { name: 'Jane Doe', description: 'Need help with a pipeline.' }],
    ['description', 'Project description is required.', { name: 'Jane Doe', email: 'jane@example.com' }],
  ])('rejects when only %s is missing', (missing, message, filled) => {
    const { container } = render(<Contact />);
    if (filled.name) {
      fireEvent.change(container.querySelector('input[name="name"]'), {
        target: { name: 'name', value: filled.name },
      });
    }
    if (filled.email) {
      fireEvent.change(container.querySelector('input[name="email"]'), {
        target: { name: 'email', value: filled.email },
      });
    }
    if (filled.description) {
      fireEvent.change(container.querySelector('textarea[name="description"]'), {
        target: { name: 'description', value: filled.description },
      });
    }
    fireEvent.submit(container.querySelector('form'));
    expect(screen.getByText(message)).toBeTruthy();
    expect(mockSubmitLead).not.toHaveBeenCalled();
  });

  it('clears a field error when that field is corrected', () => {
    const { container } = render(<Contact />);
    fireEvent.submit(container.querySelector('form'));
    expect(container.querySelector('input[name="name"]').getAttribute('aria-invalid')).toBe('true');

    fireEvent.change(container.querySelector('input[name="name"]'), {
      target: { name: 'name', value: 'Jane Doe' },
    });

    expect(container.querySelector('input[name="name"]').getAttribute('aria-invalid')).toBe('false');
    expect(screen.queryByText('Name is required.')).toBeNull();
    expect(screen.getByText('Email is required.')).toBeTruthy();
  });

  it('marks an invalid email with aria-invalid and does not call the mutation', () => {
    const { container } = render(<Contact />);
    fireEvent.change(container.querySelector('input[name="name"]'), {
      target: { name: 'name', value: 'Jane Doe' },
    });
    fireEvent.change(container.querySelector('input[name="email"]'), {
      target: { name: 'email', value: 'not-an-email' },
    });
    fireEvent.change(container.querySelector('textarea[name="description"]'), {
      target: { name: 'description', value: 'Need help with a CV pipeline.' },
    });
    fireEvent.submit(container.querySelector('form'));

    expect(container.querySelector('input[name="email"]').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
    expect(mockSubmitLead).not.toHaveBeenCalled();
  });

  it('lowercases a trimmed email and omits an empty budget', async () => {
    const { container } = render(<Contact />);
    fireEvent.change(container.querySelector('input[name="name"]'), {
      target: { name: 'name', value: ' Jane Doe ' },
    });
    fireEvent.change(container.querySelector('input[name="email"]'), {
      target: { name: 'email', value: '  Jane@Example.COM  ' },
    });
    fireEvent.change(container.querySelector('textarea[name="description"]'), {
      target: { name: 'description', value: ' Need help. ' },
    });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(mockSubmitLead).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        budget: undefined,
        description: 'Need help.',
      });
    });
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Request received',
      }),
    );
    expect(String(toast.mock.calls[0][0].title).toLowerCase()).not.toMatch(/sent|delivered/);
  });

  it('keeps entered values after a mutation failure', async () => {
    mockSubmitLead.mockRejectedValue({ data: EMAIL_RATE_LIMIT_ERROR });
    const { container } = render(<Contact />);
    fireEvent.change(container.querySelector('input[name="name"]'), {
      target: { name: 'name', value: 'Jane Doe' },
    });
    fireEvent.change(container.querySelector('input[name="email"]'), {
      target: { name: 'email', value: 'jane@example.com' },
    });
    fireEvent.change(container.querySelector('textarea[name="description"]'), {
      target: { name: 'description', value: 'Need help.' },
    });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Submission Failed' }),
      );
    });
    expect(container.querySelector('input[name="name"]').value).toBe('Jane Doe');
    expect(container.querySelector('input[name="email"]').value).toBe('jane@example.com');
    expect(container.querySelector('textarea[name="description"]').value).toBe('Need help.');
    expect(toast.mock.calls.some((call) => call[0].title === 'Request received')).toBe(false);
  });

  it('does not submit twice while the first request is in flight', async () => {
    let resolveSubmit;
    mockSubmitLead.mockImplementation(
      () => new Promise((resolve) => {
        resolveSubmit = resolve;
      }),
    );
    const { container } = render(<Contact />);
    fireEvent.change(container.querySelector('input[name="name"]'), {
      target: { name: 'name', value: 'Jane Doe' },
    });
    fireEvent.change(container.querySelector('input[name="email"]'), {
      target: { name: 'email', value: 'jane@example.com' },
    });
    fireEvent.change(container.querySelector('textarea[name="description"]'), {
      target: { name: 'description', value: 'Need help.' },
    });
    const form = container.querySelector('form');
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(mockSubmitLead).toHaveBeenCalledTimes(1);
    resolveSubmit({ success: true });
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Request received' }),
      );
    });
  });

  it('leaves the optional budget unselected until the visitor picks one', () => {
    const { container } = render(<Contact />);
    const budget = container.querySelector('#budget');
    expect(budget.tagName).toBe('SELECT');
    expect(budget.value).toBe('');
    expect(container.querySelector('select')?.value).toBe('');
  });

  it('shows job success and rating without a 21+ count', () => {
    render(<Contact />);
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByText('5★')).toBeTruthy();
    expect(screen.getByText(/Job Success/i)).toBeTruthy();
    expect(screen.getByText(/Average/i)).toBeTruthy();
    expect(screen.queryByText('21+')).toBeNull();
    expect(screen.queryByText(/Projects/)).toBeNull();
  });

  it('sends a chosen budget with the lead', async () => {
    const { container } = render(<Contact />);
    fireEvent.change(container.querySelector('input[name="name"]'), {
      target: { name: 'name', value: 'Jane Doe' },
    });
    fireEvent.change(container.querySelector('input[name="email"]'), {
      target: { name: 'email', value: 'jane@example.com' },
    });
    fireEvent.change(container.querySelector('#budget'), {
      target: { value: '< €5k' },
    });
    fireEvent.change(container.querySelector('textarea[name="description"]'), {
      target: { name: 'description', value: 'Need help.' },
    });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(mockSubmitLead).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        budget: '< €5k',
        description: 'Need help.',
      });
    });
  });

  it('names the submit button and hides the route instruction', () => {
    render(<Contact />);
    expect(screen.getByText(/CONTACT ·/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /send project request/i })).toBeTruthy();
    expect(screen.queryByText(/SUBMIT · FIELD/i)).toBeNull();
    expect(screen.queryByText(/FORM REMAINS PRIMARY/i)).toBeNull();
  });

  it('#188: submit accessible name matches its visible text', () => {
    render(<Contact />);
    const button = screen.getByRole('button', { name: 'Send project request' });
    expect(button.hasAttribute('aria-label')).toBe(false);
    expect(button.textContent.trim()).toBe('Send project request');
  });

  it('#188: each field has a readable label without decorative field text', () => {
    render(<Contact />);
    expect(screen.getByLabelText('Full Name *')).toBeTruthy();
    expect(screen.getByLabelText('Email Address *')).toBeTruthy();
    expect(screen.getByLabelText('Budget Range')).toBeTruthy();
    expect(screen.getByLabelText('Project Description *')).toBeTruthy();
    expect(screen.queryByText(/· FIELD/i)).toBeNull();
  });

  it('#188: name and email declare autocomplete tokens', () => {
    const { container } = render(<Contact />);
    expect(container.querySelector('input[name="name"]').getAttribute('autocomplete')).toBe('name');
    expect(container.querySelector('input[name="email"]').getAttribute('autocomplete')).toBe('email');
  });

  it('#188: empty submit moves focus to the first invalid field', async () => {
    const user = userEvent.setup();
    const { container } = render(<Contact />);
    await user.click(screen.getByRole('button', { name: 'Send project request' }));
    expect(document.activeElement).toBe(container.querySelector('input[name="name"]'));
  });

  it('#188: focus skips valid fields and entered values persist after failed validation', async () => {
    const user = userEvent.setup();
    const { container } = render(<Contact />);
    await user.type(container.querySelector('input[name="name"]'), 'Jane Doe');
    await user.type(container.querySelector('input[name="email"]'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send project request' }));

    const email = container.querySelector('input[name="email"]');
    expect(document.activeElement).toBe(email);
    expect(email.getAttribute('aria-describedby')).toBe('email-error');
    expect(container.querySelector('input[name="name"]').value).toBe('Jane Doe');
    expect(email.value).toBe('not-an-email');
    expect(mockSubmitLead).not.toHaveBeenCalled();
  });
});

describe("Contact form submission failures (#231)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockSubmitLead.mockResolvedValue({ success: true });
  });

  it.each([
    ["Error.message with request ID, Server Error and stack", errorWithMessage(DIAGNOSTIC_MESSAGE)],
    ["unknown string data", { data: "[Request ID: synthetic-audit] Server Error internal-detail" }],
    ["unknown string data on an Error", errorWithMessage(DIAGNOSTIC_MESSAGE, "internal-detail")],
    ["object data.message", { data: { message: "[Request ID: synthetic-audit] Server Error" } }],
    ["object data without message", { data: { code: "internal-detail" } }],
    ["empty string data", errorWithMessage(DIAGNOSTIC_MESSAGE, "")],
    ["non-string data", errorWithMessage(DIAGNOSTIC_MESSAGE, 500)],
    ["non-string data.message", { data: { message: 42 } }],
    ["null rejection", null],
    ["undefined rejection", undefined],
  ])("shows fixed safe guidance for %s", async (_label, rejection) => {
    mockSubmitLead.mockRejectedValue(rejection);
    const { container } = render(<Contact />);
    fillValidLead(container);
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => expect(toast).toHaveBeenCalledWith({
      title: "Submission Failed",
      description: SAFE_SUBMIT_FAILURE,
      variant: "destructive",
    }));
    expectNoDiagnostics();
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException.mock.calls[0][0]).toBe(rejection);
    expect(captureException.mock.calls[0][1].telemetrySource.matches("[data-sensitive-telemetry]")).toBe(true);
  });

  it.each([
    ["validation string data", { data: CONTACT_LEAD_VALIDATION_ERROR }, CONTACT_LEAD_VALIDATION_ERROR, false],
    ["validation data.message", { data: { message: CONTACT_LEAD_VALIDATION_ERROR } }, CONTACT_LEAD_VALIDATION_ERROR, false],
    ["global rate limit", errorWithMessage(DIAGNOSTIC_MESSAGE, GLOBAL_RATE_LIMIT_ERROR), GLOBAL_RATE_LIMIT_ERROR, true],
    ["email rate limit", { data: EMAIL_RATE_LIMIT_ERROR }, EMAIL_RATE_LIMIT_ERROR, true],
    ["email rate limit data.message", { data: { message: EMAIL_RATE_LIMIT_ERROR } }, EMAIL_RATE_LIMIT_ERROR, true],
  ])("keeps allowlisted %s actionable", async (_label, rejection, expected, captured) => {
    mockSubmitLead.mockRejectedValue(rejection);
    const { container } = render(<Contact />);
    fillValidLead(container);
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => expect(toast).toHaveBeenCalledWith({
      title: "Submission Failed",
      description: expected,
      variant: "destructive",
    }));
    expectNoDiagnostics();
    expect(captureException).toHaveBeenCalledTimes(captured ? 1 : 0);
  });

  it("preserves inputs and budget after an unknown failure, then retries once", async () => {
    mockSubmitLead
      .mockRejectedValueOnce(errorWithMessage(DIAGNOSTIC_MESSAGE))
      .mockResolvedValueOnce({ success: true });
    const { container } = render(<Contact />);
    fillValidLead(container, { budget: "€5k-€10k" });
    const form = container.querySelector("form");
    fireEvent.submit(form);

    await waitFor(() => expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ description: SAFE_SUBMIT_FAILURE }),
    ));
    const submit = screen.getByRole("button", { name: "Send project request" });
    await waitFor(() => expect(submit.disabled).toBe(false));
    expect(container.querySelector('input[name="name"]').value).toBe("Jane Doe");
    expect(container.querySelector('input[name="email"]').value).toBe("jane@example.com");
    expect(container.querySelector("#budget").value).toBe("€5k-€10k");
    expect(container.querySelector('textarea[name="description"]').value).toBe("Need help.");
    expectNoDiagnostics();

    fireEvent.submit(form);
    await waitFor(() => expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Request received" }),
    ));
    expect(mockSubmitLead).toHaveBeenCalledTimes(2);
    expect(mockSubmitLead.mock.calls[1][0]).toEqual({
      name: "Jane Doe",
      email: "jane@example.com",
      budget: "€5k-€10k",
      description: "Need help.",
    });
  });

  it("blocks duplicate submits while an unknown failure is pending", async () => {
    let rejectSubmit;
    mockSubmitLead.mockImplementation(() => new Promise((_resolve, reject) => {
      rejectSubmit = reject;
    }));
    const { container } = render(<Contact />);
    fillValidLead(container);
    const form = container.querySelector("form");
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(mockSubmitLead).toHaveBeenCalledTimes(1);

    rejectSubmit(errorWithMessage(DIAGNOSTIC_MESSAGE));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ description: SAFE_SUBMIT_FAILURE }),
    ));
    expect(mockSubmitLead).toHaveBeenCalledTimes(1);
    expectNoDiagnostics();
  });
});
