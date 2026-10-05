/**
 * @vitest-environment jsdom
 */
import React from "react";
import { renderWithMotion as render } from '@/test/renderWithMotion';
import { act, fireEvent, renderHook, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/ui/use-toast";
import { captureException } from "@/lib/sentryTelemetry";
import Contact from "./Contact";
import { useContactDraft } from '@/lib/useContactDraft';
import { CONTACT_LEAD_VALIDATION_ERROR } from "../../convex/lib/leadValidation";

const mockSubmitLead = vi.fn();

beforeEach(() => {
  cleanup();
  const draft = renderHook(() => useContactDraft());
  act(() => draft.result.current.setFormState({ name: '', email: '', budget: '', description: '' }));
  draft.unmount();
});

function unloadIsPrevented() {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

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

describe("Contact form", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockSubmitLead.mockResolvedValue({ success: true });
  });

  it('#265: restores every unsent field after navigation unmounts the contact route', () => {
    const first = render(<Contact />);
    fillValidLead(first.container, { budget: '€5k-€10k' });
    fireEvent.change(screen.getByLabelText('Project Description *'), {
      target: { value: 'First line\nSecond line' },
    });
    first.unmount();

    const returned = render(<Contact />);
    expect(returned.container.querySelector('[name="name"]').value).toBe('Jane Doe');
    expect(returned.container.querySelector('[name="email"]').value).toBe('jane@example.com');
    expect(returned.container.querySelector('#budget').value).toBe('€5k-€10k');
    expect(returned.container.querySelector('textarea[name="description"]').value).toBe('First line\nSecond line');
  });

  it('#265: protects a dirty draft on reload/close even after leaving the contact route', () => {
    const first = render(<Contact />);
    expect(unloadIsPrevented()).toBe(false);
    fireEvent.change(screen.getByLabelText('Full Name *'), { target: { value: 'Jane Doe' } });
    expect(unloadIsPrevented()).toBe(true);
    first.unmount();
    expect(unloadIsPrevented()).toBe(true);
  });

  it('#265: successful submission clears the saved draft and unload protection', async () => {
    const first = render(<Contact />);
    fillValidLead(first.container, { budget: '€5k-€10k' });
    fireEvent.submit(first.container.querySelector('form'));
    await screen.findByRole('status', { name: 'Request received' });
    expect(unloadIsPrevented()).toBe(false);
    first.unmount();

    render(<Contact />);
    for (const label of ['Full Name *', 'Email Address *', 'Budget Range', 'Project Description *']) {
      expect(screen.getByLabelText(label).value).toBe('');
    }
    expect(unloadIsPrevented()).toBe(false);
  });

  it('#265: failed submission retains the saved draft and unload protection on return', async () => {
    mockSubmitLead.mockRejectedValueOnce({ data: EMAIL_RATE_LIMIT_ERROR });
    const first = render(<Contact />);
    fillValidLead(first.container, { budget: '€5k-€10k' });
    fireEvent.submit(first.container.querySelector('form'));
    await waitFor(() => expect(toast).toHaveBeenCalled());
    first.unmount();

    render(<Contact />);
    expect(screen.getByLabelText('Full Name *').value).toBe('Jane Doe');
    expect(screen.getByLabelText('Budget Range').value).toBe('€5k-€10k');
    expect(screen.getByLabelText('Project Description *').value).toBe('Need help.');
    expect(unloadIsPrevented()).toBe(true);
  });

  it.each(['before returning', 'after returning'])('#265: success %s while navigation interrupted a pending send never restores sent fields', async (timing) => {
    let resolveSubmission;
    mockSubmitLead.mockImplementationOnce(() => new Promise((resolve) => { resolveSubmission = resolve; }));
    const first = render(<Contact />);
    fillValidLead(first.container);
    fireEvent.submit(first.container.querySelector('form'));
    first.unmount();

    if (timing === 'before returning') {
      await act(async () => resolveSubmission({ success: true }));
      render(<Contact />);
    } else {
      const returned = render(<Contact />);
      expect(screen.getByRole('button', { name: /sending/i }).disabled).toBe(true);
      fireEvent.submit(returned.container.querySelector('form'));
      expect(mockSubmitLead).toHaveBeenCalledTimes(1);
      await act(async () => resolveSubmission({ success: true }));
    }
    expect(screen.getByLabelText('Full Name *').value).toBe('');
    expect(screen.getByLabelText('Project Description *').value).toBe('');
    expect(screen.getByRole('button', { name: /send project request/i }).disabled).toBe(false);
    expect(unloadIsPrevented()).toBe(false);

    fireEvent.change(screen.getByLabelText('Full Name *'), { target: { value: 'New draft' } });
    cleanup();
    render(<Contact />);
    expect(screen.getByLabelText('Full Name *').value).toBe('New draft');
    expect(unloadIsPrevented()).toBe(true);
  });

  it('#265: pending failure after navigation leaves the restored fields available for retry', async () => {
    let rejectSubmission;
    mockSubmitLead.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectSubmission = reject; }));
    const first = render(<Contact />);
    fillValidLead(first.container);
    fireEvent.submit(first.container.querySelector('form'));
    first.unmount();
    render(<Contact />);
    await act(async () => rejectSubmission({ data: EMAIL_RATE_LIMIT_ERROR }));

    expect(screen.getByLabelText('Full Name *').value).toBe('Jane Doe');
    expect(screen.getByRole('button', { name: /send project request/i }).disabled).toBe(false);
    expect(unloadIsPrevented()).toBe(true);
    fireEvent.submit(screen.getByRole('button', { name: /send project request/i }).closest('form'));
    await screen.findByRole('status', { name: 'Request received' });
    expect(mockSubmitLead).toHaveBeenCalledTimes(2);
  });

  it("keeps the next-steps panel out of the complementary landmark tree", () => {
    const { container } = render(<Contact />);
    const nextSteps = container.querySelector(".aside");

    expect(nextSteps?.tagName).toBe("DIV");
    expect(nextSteps?.getAttribute("role")).not.toBe("complementary");
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
    const receipt = await screen.findByRole('status', { name: 'Request received' });
    expect(receipt.textContent.toLowerCase()).not.toMatch(/sent|delivered/);
    expect(toast).not.toHaveBeenCalled();
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
    expect(await screen.findByRole('status', { name: 'Request received' })).toBeTruthy();
    expect(mockSubmitLead).toHaveBeenCalledTimes(1);
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
    expect(screen.queryByText(/CONTACT ·/i)).toBeNull();
    const panelLabel = document.querySelector('form > .detection-label');
    expect(panelLabel.textContent).toBe('PROJECT · REQUEST');
    expect(panelLabel.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText('PROCESS · NEXT STEPS').getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('button', { name: /send project request/i })).toBeTruthy();
    expect(screen.queryByText(/SUBMIT · FIELD/i)).toBeNull();
    expect(screen.queryByText(/FORM REMAINS PRIMARY/i)).toBeNull();
  });

  it('#188: submit accessible name matches its visible text', () => {
    render(<Contact />);
    const button = screen.getByRole('button', { name: 'Send project request' });
    expect(button.hasAttribute('aria-label')).toBe(false);
    expect(button.querySelector('.action-submit-label').textContent.trim()).toBe('Send project request');
    expect(button.querySelector('.detection-label').getAttribute('aria-hidden')).toBe('true');
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

describe('#230: contact outcome focus and receipt', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockSubmitLead.mockResolvedValue({ success: true });
  });

  function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  async function fillByKeyboard(user, container) {
    await user.type(container.querySelector('input[name="name"]'), 'Jane Doe');
    await user.type(container.querySelector('input[name="email"]'), 'jane@example.com');
    await user.selectOptions(container.querySelector('#budget'), '€5k-€10k');
    await user.type(container.querySelector('textarea[name="description"]'), 'Need help.');
  }

  const submitButton = () => screen.getByRole('button', { name: /send project request|sending/i });
  const receipt = () => screen.queryByRole('status', { name: 'Request received' });

  it('keyboard failure keeps every value and focuses the enabled submit; keyboard retry from submit shows a focused receipt', async () => {
    const first = deferred();
    mockSubmitLead.mockImplementationOnce(() => first.promise);
    const user = userEvent.setup();
    const { container } = render(<Contact />);
    await fillByKeyboard(user, container);

    await user.click(container.querySelector('input[name="name"]'));
    await user.keyboard('{Enter}');
    expect(submitButton().disabled).toBe(true);

    fireEvent.submit(container.querySelector('form'));
    expect(mockSubmitLead).toHaveBeenCalledTimes(1);

    await act(async () => {
      first.reject(errorWithMessage(DIAGNOSTIC_MESSAGE));
    });
    expect(toast).toHaveBeenCalledWith({
      title: 'Submission Failed',
      description: SAFE_SUBMIT_FAILURE,
      variant: 'destructive',
    });
    expectNoDiagnostics();

    const retry = submitButton();
    expect(retry.disabled).toBe(false);
    expect(document.activeElement).toBe(retry);
    expect(container.querySelector('input[name="name"]').value).toBe('Jane Doe');
    expect(container.querySelector('input[name="email"]').value).toBe('jane@example.com');
    expect(container.querySelector('#budget').value).toBe('€5k-€10k');
    expect(container.querySelector('textarea[name="description"]').value).toBe('Need help.');
    expect(receipt()).toBeNull();

    await user.keyboard('{Enter}');
    await waitFor(() => expect(receipt()).not.toBeNull());
    expect(mockSubmitLead).toHaveBeenCalledTimes(2);
    expect(mockSubmitLead).toHaveBeenLastCalledWith({
      name: 'Jane Doe',
      email: 'jane@example.com',
      budget: '€5k-€10k',
      description: 'Need help.',
    });

    const status = receipt();
    const labelId = status.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId).textContent).toBe('Request received');
    const descriptionId = status.getAttribute('aria-describedby');
    expect(document.getElementById(descriptionId).textContent).toBe("Your details are saved. I'll get back to you within 24 hours.");
    expect(status.textContent).toContain("Your details are saved. I'll get back to you within 24 hours.");
    expect(container.querySelector('form').contains(status)).toBe(true);
    expect(document.activeElement).toBe(status);
    expect(container.querySelector('input[name="name"]').value).toBe('');
    expect(container.querySelector('#budget').value).toBe('');
  });

  it('renders a success status without a success toast', async () => {
    const { container } = render(<Contact />);
    fireEvent.change(container.querySelector('input[name="name"]'), { target: { value: 'Jane Doe' } });
    fireEvent.change(container.querySelector('input[name="email"]'), { target: { value: 'jane@example.com' } });
    fireEvent.change(container.querySelector('textarea[name="description"]'), { target: { value: 'Need help.' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => expect(receipt()).not.toBeNull());
    expect(toast).not.toHaveBeenCalled();
  });

  it('refocuses the submit button after each consecutive failure', async () => {
    const user = userEvent.setup();
    const { container } = render(<Contact />);
    await fillByKeyboard(user, container);

    for (const [attempt, field] of [[1, 'input[name="name"]'], [2, 'input[name="email"]']]) {
      const pending = deferred();
      mockSubmitLead.mockImplementationOnce(() => pending.promise);
      await user.click(container.querySelector(field));
      await user.keyboard('{Enter}');
      expect(mockSubmitLead).toHaveBeenCalledTimes(attempt);
      expect(submitButton().disabled).toBe(true);
      expect(document.activeElement).toBe(container.querySelector(field));

      await act(async () => {
        pending.reject({ data: EMAIL_RATE_LIMIT_ERROR });
      });
      expect(submitButton().disabled).toBe(false);
      expect(document.activeElement).toBe(submitButton());
    }
    expect(container.querySelector('textarea[name="description"]').value).toBe('Need help.');
  });

  it('dismisses the latest contact-owned feedback toast when the next valid send starts', async () => {
    const failureHandle = { dismiss: vi.fn() };
    const validationHandle = { dismiss: vi.fn() };
    mockSubmitLead.mockRejectedValueOnce({ data: EMAIL_RATE_LIMIT_ERROR });
    const user = userEvent.setup();
    const { container } = render(<Contact />);
    await fillByKeyboard(user, container);

    toast.mockReturnValueOnce(failureHandle);
    await user.click(submitButton());
    await waitFor(() => expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Submission Failed', description: EMAIL_RATE_LIMIT_ERROR, variant: 'destructive' }),
    ));
    expect(failureHandle.dismiss).not.toHaveBeenCalled();

    const description = container.querySelector('textarea[name="description"]');
    await user.clear(description);
    toast.mockReturnValueOnce(validationHandle);
    await user.click(submitButton());
    expect(toast).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: 'Uh oh! Missing fields.', variant: 'destructive' }),
    );
    expect(mockSubmitLead).toHaveBeenCalledTimes(1);
    expect(failureHandle.dismiss).not.toHaveBeenCalled();
    expect(validationHandle.dismiss).not.toHaveBeenCalled();

    const retry = deferred();
    mockSubmitLead.mockImplementationOnce(() => retry.promise);
    await user.type(description, 'Need help.');
    await user.click(submitButton());
    expect(mockSubmitLead).toHaveBeenCalledTimes(2);
    expect(validationHandle.dismiss).toHaveBeenCalledTimes(1);
    expect(failureHandle.dismiss).not.toHaveBeenCalled();

    await act(async () => {
      retry.resolve({ success: true });
    });
    expect(receipt()).not.toBeNull();

    await user.type(container.querySelector('input[name="name"]'), 'Jane Doe');
    await user.type(container.querySelector('input[name="email"]'), 'jane@example.com');
    await user.type(description, 'Another request.');
    await user.click(submitButton());
    await waitFor(() => expect(mockSubmitLead).toHaveBeenCalledTimes(3));
    expect(validationHandle.dismiss).toHaveBeenCalledTimes(1);
    expect(failureHandle.dismiss).not.toHaveBeenCalled();
  });

  it('dismisses a validation toast when a valid send follows an invalid submit', async () => {
    const validationHandle = { dismiss: vi.fn() };
    const user = userEvent.setup();
    const { container } = render(<Contact />);

    toast.mockReturnValueOnce(validationHandle);
    await user.click(submitButton());
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Uh oh! Missing fields.', variant: 'destructive' }),
    );
    expect(mockSubmitLead).not.toHaveBeenCalled();
    expect(validationHandle.dismiss).not.toHaveBeenCalled();

    await fillByKeyboard(user, container);
    await user.click(submitButton());
    await waitFor(() => expect(receipt()).not.toBeNull());
    expect(mockSubmitLead).toHaveBeenCalledTimes(1);
    expect(validationHandle.dismiss).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledTimes(1);
  });

  it('keeps the receipt while composing and through invalid submits, then clears it on the next actual send', async () => {
    const user = userEvent.setup();
    const { container } = render(<Contact />);
    await fillByKeyboard(user, container);
    await user.click(submitButton());
    await waitFor(() => expect(receipt()).not.toBeNull());

    await user.type(container.querySelector('input[name="name"]'), 'Second Lead');
    expect(receipt()).not.toBeNull();

    await user.click(submitButton());
    expect(document.activeElement).toBe(container.querySelector('input[name="email"]'));
    expect(receipt()).not.toBeNull();
    expect(mockSubmitLead).toHaveBeenCalledTimes(1);

    const second = deferred();
    mockSubmitLead.mockImplementationOnce(() => second.promise);
    await user.type(container.querySelector('input[name="email"]'), 'second@example.com');
    await user.type(container.querySelector('textarea[name="description"]'), 'Another request.');
    await user.click(submitButton());
    expect(mockSubmitLead).toHaveBeenCalledTimes(2);
    expect(receipt()).toBeNull();

    await act(async () => {
      second.resolve({ success: true });
    });
    expect(receipt()).not.toBeNull();
    expect(document.activeElement).toBe(receipt());
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
    expect(document.activeElement).toBe(submit);
    expect(container.querySelector('input[name="name"]').value).toBe("Jane Doe");
    expect(container.querySelector('input[name="email"]').value).toBe("jane@example.com");
    expect(container.querySelector("#budget").value).toBe("€5k-€10k");
    expect(container.querySelector('textarea[name="description"]').value).toBe("Need help.");
    expectNoDiagnostics();

    fireEvent.submit(form);
    const receipt = await screen.findByRole("status", { name: "Request received" });
    expect(document.activeElement).toBe(receipt);
    expect(toast).toHaveBeenCalledTimes(1);
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
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Send project request" }));
    expectNoDiagnostics();
  });
});
