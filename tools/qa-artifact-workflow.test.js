import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const workflowPath = new URL('../.github/workflows/ci.yml', import.meta.url);

describe('sanitized QA artifact workflow', () => {
  it('enables only the safe local capture mode and uploads two explicit JSON paths for seven days', async () => {
    const workflow = await readFile(workflowPath, 'utf8');

    expect(workflow).toContain("QA_LOCAL_ONLY: '1'");
    expect(workflow).toContain("QA_ARTIFACT_SAFE_MODE: '1'");
    expect(workflow).toContain('id: sanitize-qa-artifacts');
    expect(workflow).toContain("if: always() && steps.sanitize-qa-artifacts.outcome == 'success'");
    expect(workflow).toContain('qa-artifacts/summary.json');
    expect(workflow).toContain('qa-artifacts/failure-results.json');
    expect(workflow).toContain('if-no-files-found: ignore');
    expect(workflow).toContain('retention-days: 7');

    const uploadSection = workflow.slice(workflow.indexOf('name: passive-qa-sanitized'));
    const pathBlock = uploadSection.match(/path:\s*\|\n([\s\S]*?)\n\s+if-no-files-found/);
    expect(pathBlock?.[1].trim().split('\n').map((line) => line.trim())).toEqual([
      'qa-artifacts/summary.json',
      'qa-artifacts/failure-results.json',
    ]);
  });
});
