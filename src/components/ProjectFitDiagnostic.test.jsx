/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import ProjectFitDiagnostic from './ProjectFitDiagnostic';

const reviewedAnswers = [
  'Yes, usable source material or access is available',
  'Yes, the needed information and where it should go are clear',
  'A practical assessment and workflow that can be tested and reviewed',
  'A person will review exceptions and business decisions',
];

describe('ProjectFitDiagnostic', () => {
  afterEach(cleanup);

  const renderDiagnostic = () => {
    const user = userEvent.setup();
    const view = render(<MemoryRouter><ProjectFitDiagnostic /></MemoryRouter>);
    return { user, ...view };
  };

  const selectAndNext = async (user, optionLabel) => {
    await user.click(screen.getByLabelText(optionLabel, { exact: true }));
    await user.click(screen.getByRole('button', { name: /next|see result/i }));
  };

  const completeReviewedPath = async (user, projectType = 'Document or web data extraction') => {
    await user.click(screen.getByRole('button', { name: 'Start diagnostic' }));
    await selectAndNext(user, projectType);
    for (const answer of reviewedAnswers) await selectAndNext(user, answer);
  };

  it('is opt-in, keeps answers in this page only, and excludes the diagnostic from Sentry replay', () => {
    render(<MemoryRouter><ProjectFitDiagnostic /></MemoryRouter>);

    const diagnostic = document.querySelector('#project-fit-diagnostic');
    expect(diagnostic.classList.contains('sentry-block')).toBe(true);
    expect(diagnostic.classList.contains('sentry-ignore')).toBe(true);
    expect(screen.getByText('Your answers stay only in this page. They reset if you leave or reload, and nothing is submitted.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start diagnostic' })).toBeTruthy();
    expect(document.activeElement).toBe(document.body);
  });

  it('moves focus through a complete keyboard-only journey and returns from the result to the last answer', async () => {
    const { user } = renderDiagnostic();
    const questionHeadings = [
      'What kind of project are you considering?',
      'Can the relevant source material or system access be made available for review?',
      'Is the information needed and where it should go clear?',
      'What result are you expecting?',
      'Who will check exceptions and business decisions?',
    ];

    await user.tab();
    expect(screen.getByRole('button', { name: 'Start diagnostic' })).toBe(document.activeElement);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByText('What kind of project are you considering?')).toBe(document.activeElement));

    for (let step = 0; step < 5; step += 1) {
      await user.tab();
      await user.keyboard(' ');
      if (step > 0) await user.tab();
      await user.tab();
      await user.keyboard('{Enter}');
      if (step < questionHeadings.length - 1) {
        await waitFor(() => expect(screen.getByText(questionHeadings[step + 1])).toBe(document.activeElement));
      }
    }

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Strong Fit' })).toBe(document.activeElement));
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Back to last question' })).toBe(document.activeElement);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByText('Who will check exceptions and business decisions?')).toBe(document.activeElement));
    expect(screen.getByLabelText('A person will review exceptions and business decisions').checked).toBe(true);
  });

  it('uses only the current human-review answer, so changing unsafe to included removes the stale unsafe flag', async () => {
    const { user } = renderDiagnostic();

    await user.click(screen.getByRole('button', { name: 'Start diagnostic' }));
    await selectAndNext(user, 'Workflow automation, including fragile n8n or AI workflows');
    for (const answer of reviewedAnswers.slice(0, 3)) await selectAndNext(user, answer);
    await user.click(screen.getByLabelText('No person will review them before a decision is made'));
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await waitFor(() => expect(screen.getByText('What result are you expecting?')).toBe(document.activeElement));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('Who will check exceptions and business decisions?')).toBe(document.activeElement));
    await selectAndNext(user, 'A person will review exceptions and business decisions');

    expect(screen.getByRole('heading', { name: 'Strong Fit' })).toBeTruthy();
  });

  it('lets a result be edited from the last question and recalculates it', async () => {
    const { user } = renderDiagnostic();
    await completeReviewedPath(user);
    expect(screen.getByRole('heading', { name: 'Strong Fit' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Back to last question' }));
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await user.click(screen.getByLabelText('A guaranteed level of accuracy, saving, or business result'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'See result' }));

    expect(screen.getByRole('heading', { name: 'Not Recommended' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Why this result' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Limits and risks to review' })).toBeTruthy();
  });

  it('shows accessible progress and distinct proof links without depending on engine prose', async () => {
    const { user } = renderDiagnostic();
    await user.click(screen.getByRole('button', { name: 'Start diagnostic' }));
    expect(screen.getByRole('progressbar', { name: 'Question 1 of 5' }).getAttribute('aria-valuetext')).toBe('Question 1 of 5');
    await selectAndNext(user, 'Document or web data extraction');
    for (const answer of reviewedAnswers) await selectAndNext(user, answer);

    expect(screen.getByRole('heading', { name: 'Strong Fit' })).toBeTruthy();
    for (const heading of ['Why this result', 'Limits and risks to review', 'Next step', 'Relevant published proof']) {
      expect(screen.getByRole('heading', { name: heading })).toBeTruthy();
    }
    const proofLinks = screen.getAllByRole('link');
    expect(new Set(proofLinks.map((link) => link.textContent)).size).toBe(proofLinks.length);
    expect(proofLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/project/n8n-openai-data-extraction/',
      '/project/invoice-ocr-extraction/',
    ]);
  });

  it('clears answers and restores focus to Start on restart', async () => {
    const { user } = renderDiagnostic();
    await user.click(screen.getByRole('button', { name: 'Start diagnostic' }));
    await user.click(screen.getByLabelText('Document or web data extraction'));
    await user.click(screen.getByRole('button', { name: 'Restart' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Start diagnostic' })).toBe(document.activeElement));
    await user.keyboard('{Enter}');
    expect(screen.getByLabelText('Document or web data extraction').checked).toBe(false);
  });

  it('resets answers when the diagnostic unmounts and mounts again', async () => {
    const { user, unmount } = renderDiagnostic();
    await user.click(screen.getByRole('button', { name: 'Start diagnostic' }));
    await user.click(screen.getByLabelText('Document or web data extraction'));
    unmount();

    render(<MemoryRouter><ProjectFitDiagnostic /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Start diagnostic' })).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
