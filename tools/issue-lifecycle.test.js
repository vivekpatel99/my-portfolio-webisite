import { describe, expect, it, vi } from 'vitest';
import { issueReferences, runIssueLifecycle } from './issue-lifecycle.js';

function fixture(prOverrides = {}, issueOverrides = {}) {
  const issue = { state: 'open', ...issueOverrides };
  const pr = {
    number: 9, merged: true, body: 'Closes #206\nCloses #206\nRefs #183',
    base: { ref: 'develop', repo: { full_name: 'owner/repo' } },
    merge_commit_sha: 'merged-sha', html_url: 'https://github.com/owner/repo/pull/9',
    ...prOverrides,
  };
  const github = {
    graphql: vi.fn().mockResolvedValue({ repository: { pullRequest: {
      body: pr.body, lastEditedAt: null, mergedAt: '2026-10-01T06:00:00Z',
    } } }),
    paginate: vi.fn().mockResolvedValue([{ number: 9 }]),
    rest: {
      repos: { listPullRequestsAssociatedWithCommit: vi.fn() },
      pulls: { get: vi.fn().mockResolvedValue({ data: pr }) },
      issues: {
        get: vi.fn().mockImplementation(async () => ({ data: { ...issue } })),
        update: vi.fn().mockImplementation(async () => { issue.state = 'closed'; }),
      },
    },
  };
  const context = {
    eventName: 'push', repo: { owner: 'owner', repo: 'repo' },
    payload: { ref: 'refs/heads/develop', after: 'merged-sha', pull_request: pr },
  };
  return { github, context, core: { info: vi.fn() } };
}

describe('issue declarations', () => {
  it('separates explicit completion from partial work and deduplicates', () => {
    expect(issueReferences('Closes #206\nFIXES: #116\n- Resolved #22.\nCloses #206\nRefs #183')).toEqual({
      closes: [206, 116, 22], refs: [183], noIssue: false,
    });
  });

  it('ignores quoted, commented, fenced, inline, indented and cross-repository examples', () => {
    const body = '<!--\nCloses #1\n-->\n```md\nCloses #2\n```\n~~~\nCloses #3\n~~~\n'
      + '> Closes #4\n    Closes #5\nExample: Closes #6\nCloses other/repo#7\n`Closes #8`\nCloses #0';
    expect(issueReferences(body).closes).toEqual([]);
    expect(issueReferences('<!-- Closes #11')).toEqual({ closes: [], refs: [], noIssue: false });
    expect(issueReferences(null).closes).toEqual([]);
  });

  it('supports all GitHub keyword forms as standalone lines', () => {
    for (const keyword of ['close', 'closes', 'closed', 'fix', 'fixes', 'fixed', 'resolve', 'resolves', 'resolved']) {
      expect(issueReferences(`${keyword} #10`).closes).toEqual([10]);
    }
  });

  it('keeps invalid closing fences inside examples and preserves declarations after literal HTML comments in code', () => {
    expect(issueReferences('```md\n```not-a-closing-fence\nCloses #123\n```').closes).toEqual([]);
    expect(issueReferences('```html\n<!--\n```\nCloses #123').closes).toEqual([123]);
    expect(issueReferences('````md\n```\nCloses #123\n````\nCloses #124').closes).toEqual([124]);
    expect(issueReferences('```md\r\nCloses #123\r\n```\r\nCloses #124').closes).toEqual([124]);
  });
});

describe('merged develop issue closure', () => {
  it('closes only completed issues after the matching merge, and reruns without another write', async () => {
    const state = fixture();
    await runIssueLifecycle(state);
    await runIssueLifecycle(state);
    expect(state.github.paginate).toHaveBeenCalledWith(
      state.github.rest.repos.listPullRequestsAssociatedWithCommit,
      { owner: 'owner', repo: 'repo', commit_sha: 'merged-sha', per_page: 100 },
    );
    expect(state.github.rest.issues.update).toHaveBeenCalledExactlyOnceWith({
      owner: 'owner', repo: 'repo', issue_number: 206, state: 'closed', state_reason: 'completed',
    });
  });

  it.each([
    { merged: false }, { merge_commit_sha: 'different-sha' },
    { base: { ref: 'main', repo: { full_name: 'owner/repo' } } },
    { base: { ref: 'develop', repo: { full_name: 'other/repo' } } },
  ])('does not close issues for an ineligible PR %j', async (overrides) => {
    const state = fixture(overrides);
    await expect(runIssueLifecycle(state)).rejects.toThrow('No merged develop PR matches');
    expect(state.github.rest.issues.update).not.toHaveBeenCalled();
  });

  it('keeps partially addressed issues open after an eligible merge', async () => {
    const state = fixture({ body: 'Refs #206' });
    await runIssueLifecycle(state);
    expect(state.github.rest.issues.update).not.toHaveBeenCalled();
  });

  it('rejects post-merge body edits, including removed completion lines, before any writes', async () => {
    for (const body of ['Closes #999', 'Refs #206']) {
      const state = fixture();
      state.github.graphql.mockResolvedValue({ repository: { pullRequest: {
        body, lastEditedAt: '2026-10-01T06:01:00Z', mergedAt: '2026-10-01T06:00:00Z',
      } } });
      await expect(runIssueLifecycle(state)).rejects.toThrow('edited after merging');
      expect(state.github.rest.issues.update).not.toHaveBeenCalled();
    }
  });

  it('accepts pre-merge body edits and uses the body returned with its edit timestamp', async () => {
    const state = fixture({ body: 'Closes #999' });
    state.github.graphql.mockResolvedValue({ repository: { pullRequest: {
      body: 'Closes #206', lastEditedAt: '2026-10-01T05:00:00Z', mergedAt: '2026-10-01T06:00:00Z',
    } } });
    await runIssueLifecycle(state);
    expect(state.github.rest.issues.update).toHaveBeenCalledExactlyOnceWith({
      owner: 'owner', repo: 'repo', issue_number: 206, state: 'closed', state_reason: 'completed',
    });
  });

  it.each(['main', 'feature'])('ignores pushes to %s', async (branch) => {
    const state = fixture();
    state.context.payload.ref = `refs/heads/${branch}`;
    await runIssueLifecycle(state);
    expect(state.github.paginate).not.toHaveBeenCalled();
  });

  it('skips deleted branches and already closed issues', async () => {
    const state = fixture({}, { state: 'closed', state_reason: 'not_planned' });
    await runIssueLifecycle(state);
    state.context.payload.deleted = true;
    await runIssueLifecycle(state);
    expect(state.github.rest.issues.update).not.toHaveBeenCalled();
    expect(state.github.paginate).toHaveBeenCalledTimes(1);
  });

  it('rejects pull request numbers and propagates API failures', async () => {
    const state = fixture({}, { pull_request: {} });
    await expect(runIssueLifecycle(state)).rejects.toThrow('not an issue');
    expect(state.github.rest.issues.update).not.toHaveBeenCalled();
    state.github.rest.issues.get.mockRejectedValue(new Error('API denied'));
    await expect(runIssueLifecycle(state)).rejects.toThrow('API denied');
  });

  it('reports missing PR associations so a maintainer can retry', async () => {
    const state = fixture();
    state.github.paginate.mockResolvedValue([]);
    await expect(runIssueLifecycle(state)).rejects.toThrow('No merged develop PR matches');
  });
});

describe('PR issue-reference check', () => {
  it.each(['Closes #206', 'Refs #206', 'No issue: Repository maintenance'])('accepts %s without writes', async (body) => {
    const state = fixture({ body });
    state.context.eventName = 'pull_request';
    await runIssueLifecycle(state);
    expect(state.github.rest.issues.update).not.toHaveBeenCalled();
    expect(state.github.paginate).not.toHaveBeenCalled();
  });

  it.each(['', '<!-- Closes #206 -->', 'Related to #206', 'No issue:'])('rejects missing declarations in %s', async (body) => {
    const state = fixture({ body });
    state.context.eventName = 'pull_request';
    await expect(runIssueLifecycle(state)).rejects.toThrow('standalone Closes');
  });
});
