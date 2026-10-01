export function issueReferences(body = '') {
  const references = { closes: [], refs: [], noIssue: false };
  let fence = null;
  let inComment = false;
  for (const rawLine of (body ?? '').split(/\r?\n/)) {
    if (fence) {
      const end = rawLine.match(/^ {0,3}(`{3,}|~{3,})([ \t]*)$/);
      if (end && end[1][0] === fence[0] && end[1].length >= fence.length) fence = null;
      continue;
    }
    let line = '';
    for (const part of rawLine.split(/(<!--|-->)/)) {
      if (part === '<!--') inComment = true;
      else if (part === '-->' && inComment) inComment = false;
      else if (!inComment) line += part;
    }
    const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (delimiter && (delimiter[1][0] === '~' || !delimiter[2].includes('`'))) {
      fence = delimiter[1];
      continue;
    }
    const match = line.match(/^ {0,3}(?:- )?(close[sd]?|fix(?:es|ed)?|resolve[sd]?|refs)\s*:?\s+#([1-9]\d*)\.?\s*$/i);
    if (match) {
      const key = match[1].toLowerCase() === 'refs' ? 'refs' : 'closes';
      const number = Number(match[2]);
      if (Number.isSafeInteger(number) && !references[key].includes(number)) references[key].push(number);
    }
    if (/^ {0,3}No issue:\s*\S.+$/i.test(line)) references.noIssue = true;
  }
  const conflict = references.closes.find((number) => references.refs.includes(number));
  if (conflict) throw new Error(`#${conflict} has both Closes and Refs declarations. Choose complete or partial work.`);
  return references;
}

export async function runIssueLifecycle({ github, context, core }) {
  const repository = context.repo;
  if (context.eventName === 'pull_request') {
    const references = issueReferences(context.payload.pull_request.body);
    const numbers = [...new Set([...references.closes, ...references.refs])];
    if (!numbers.length && !references.noIssue) {
      throw new Error('Add a standalone Closes #123 for completed work, Refs #123 for partial work, or No issue: <reason>.');
    }
    for (const issue_number of numbers) {
      const { data: issue } = await github.rest.issues.get({ ...repository, issue_number });
      if (issue.pull_request) throw new Error(`#${issue_number} is a pull request, not an issue.`);
    }
    core.info('Issue references validated. No issues changed.');
    return;
  }
  if (context.eventName !== 'push' || context.payload.ref !== 'refs/heads/develop' || context.payload.deleted) return;
  const sha = context.payload.after;
  const candidates = await github.paginate(github.rest.repos.listPullRequestsAssociatedWithCommit, {
    ...repository, commit_sha: sha, per_page: 100,
  });
  let matched = false;
  for (const candidate of candidates) {
    const { data: pr } = await github.rest.pulls.get({ ...repository, pull_number: candidate.number });
    if (!pr.merged || pr.base.ref !== 'develop' || pr.merge_commit_sha !== sha
      || pr.base.repo.full_name.toLowerCase() !== `${repository.owner}/${repository.repo}`.toLowerCase()) continue;
    matched = true;
    const { repository: { pullRequest: declaration } } = await github.graphql(`
      query($owner: String!, $name: String!, $number: Int!) {
        repository(owner: $owner, name: $name) {
          pullRequest(number: $number) { body lastEditedAt mergedAt }
        }
      }
    `, { owner: repository.owner, name: repository.repo, number: pr.number });
    if (declaration.lastEditedAt && declaration.lastEditedAt >= declaration.mergedAt) {
      throw new Error(`PR #${pr.number} was edited at or after merging. Verify its original issue declarations manually.`);
    }
    for (const issue_number of issueReferences(declaration.body).closes) {
      const { data: issue } = await github.rest.issues.get({ ...repository, issue_number });
      if (issue.pull_request) throw new Error(`#${issue_number} is a pull request, not an issue.`);
      if (issue.state === 'closed') continue;
      await github.rest.issues.update({ ...repository, issue_number, state: 'closed', state_reason: 'completed' });
      core.info(`Closed #${issue_number} after ${pr.html_url} merged into develop at ${sha}.`);
    }
  }
  if (!matched) throw new Error(`No merged develop PR matches commit ${sha}. Retry this workflow after checking the merge.`);
}
