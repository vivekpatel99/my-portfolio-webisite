/**
 * @vitest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/ui/use-toast";
import { captureException } from "@/lib/sentryTelemetry";
import Contact from "./Contact";

const mockSubmitLead = vi.fn();

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
  const motion = new Proxy(
    {},
    {
      get: (_, tag) =>
        function MotionComponent({ children, ...props }) {
          return React.createElement(String(tag), props, children);
        },
    },
  );
  return { MotionConfig: ({ children }) => <>{children}</>, motion, useReducedMotion: () => false };
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
    expect(container.querySelector('input[name="name"]').required).toBe(true);

    await user.click(screen.getByRole("button", { name: /request a project estimate/i }));

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

  it("FE-005: mutation failure shows Convex error message in toast", async () => {
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
    mockSubmitLead.mockRejectedValue({ data: 'Please wait before submitting again.' });
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

  it('shows bounded optional context before submitting and sends only the selected IDs', async () => {
    const { container } = render(<Contact />);
    fireEvent.change(container.querySelector('#projectType'), { target: { value: 'workflow-automation' } });
    fireEvent.change(container.querySelector('#timeline'), { target: { value: 'within-one-month' } });
    fireEvent.change(container.querySelector('#currentBlocker'), { target: { value: 'workflow-reliability' } });
    expect(screen.getByText('Context that will be shared')).toBeTruthy();
    expect(screen.getByText('Project type: Workflow automation')).toBeTruthy();
    fireEvent.change(container.querySelector('input[name="name"]'), { target: { name: 'name', value: 'Jane Doe' } });
    fireEvent.change(container.querySelector('input[name="email"]'), { target: { name: 'email', value: 'jane@example.com' } });
    fireEvent.change(container.querySelector('textarea[name="description"]'), { target: { name: 'description', value: 'Need help.' } });
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(mockSubmitLead).toHaveBeenCalledWith(expect.objectContaining({
      inquiryContext: {
        projectType: 'workflow-automation',
        timeline: 'within-one-month',
        currentBlocker: 'workflow-reliability',
      },
    })));
  });

  it('preserves a bounded case-study source when an independent optional field is cleared', async () => {
    const { container } = render(<Contact initialInquiryContext={{
      origin: 'case-study',
      caseStudySlug: 'invoice-ocr-extraction',
      projectType: 'document-web-extraction',
      serviceId: 'document-web-extraction',
    }} />);
    fireEvent.change(container.querySelector('#timeline'), { target: { value: 'exploring' } });
    fireEvent.change(container.querySelector('#timeline'), { target: { value: '' } });
    expect(screen.getByText('Case study viewed: Invoice OCR Client-Field Extraction')).toBeTruthy();
    expect(screen.queryByText('Timing: Exploring the scope')).toBeNull();
    expect(screen.getByText('Context that will be shared')).toBeTruthy();
    fireEvent.change(container.querySelector('input[name="name"]'), { target: { name: 'name', value: 'Jane Doe' } });
    fireEvent.change(container.querySelector('input[name="email"]'), { target: { name: 'email', value: 'jane@example.com' } });
    fireEvent.change(container.querySelector('textarea[name="description"]'), { target: { name: 'description', value: 'Need help.' } });
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(mockSubmitLead).toHaveBeenCalledWith(expect.objectContaining({
      inquiryContext: {
        origin: 'case-study',
        caseStudySlug: 'invoice-ocr-extraction',
        projectType: 'document-web-extraction',
        serviceId: 'document-web-extraction',
      },
    })));
  });

  it('removes a last direct timeline from the preview and omits inquiryContext on submit', async () => {
    const { container } = render(<Contact />);
    fireEvent.change(container.querySelector('#timeline'), { target: { value: 'exploring' } });
    fireEvent.change(container.querySelector('#timeline'), { target: { value: '' } });

    expect(screen.queryByText('Context that will be shared')).toBeNull();
    fireEvent.change(container.querySelector('input[name="name"]'), { target: { name: 'name', value: 'Jane Doe' } });
    fireEvent.change(container.querySelector('input[name="email"]'), { target: { name: 'email', value: 'jane@example.com' } });
    fireEvent.change(container.querySelector('textarea[name="description"]'), { target: { name: 'description', value: 'Need help.' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => expect(mockSubmitLead).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@example.com',
      budget: undefined,
      description: 'Need help.',
    }));
  });

  it('removes a last direct blocker from the preview and omits inquiryContext on submit', async () => {
    const { container } = render(<Contact />);
    fireEvent.change(container.querySelector('#currentBlocker'), { target: { value: 'workflow-reliability' } });
    fireEvent.change(container.querySelector('#currentBlocker'), { target: { value: '' } });

    expect(screen.queryByText('Context that will be shared')).toBeNull();
    fireEvent.change(container.querySelector('input[name="name"]'), { target: { name: 'name', value: 'Jane Doe' } });
    fireEvent.change(container.querySelector('input[name="email"]'), { target: { name: 'email', value: 'jane@example.com' } });
    fireEvent.change(container.querySelector('textarea[name="description"]'), { target: { name: 'description', value: 'Need help.' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => expect(mockSubmitLead).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@example.com',
      budget: undefined,
      description: 'Need help.',
    }));
  });

  it('removes previewed context and restores focus to its legend', async () => {
    const user = userEvent.setup();
    render(<Contact initialInquiryContext={{ projectType: 'workflow-automation' }} />);
    await user.click(screen.getByRole('button', { name: 'Remove estimate context' }));
    await waitFor(() => expect(screen.getByText('Estimate context (optional)')).toBe(document.activeElement));
    expect(screen.queryByText('Context that will be shared')).toBeNull();
  });

  it('does not expose a raw backend error in a toast or telemetry', async () => {
    mockSubmitLead.mockRejectedValue({ data: 'Server says description=private project details' });
    const { container } = render(<Contact />);
    fireEvent.change(container.querySelector('input[name="name"]'), { target: { name: 'name', value: 'Jane Doe' } });
    fireEvent.change(container.querySelector('input[name="email"]'), { target: { name: 'email', value: 'jane@example.com' } });
    fireEvent.change(container.querySelector('textarea[name="description"]'), { target: { name: 'description', value: 'Private project details.' } });
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      description: 'We could not save your request. Please try again or use the email link below.',
    })));
    expect(captureException).toHaveBeenCalledWith(expect.objectContaining({ message: 'Contact submission failed' }), expect.any(Object));
  });
});
