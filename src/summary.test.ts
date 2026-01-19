import { describe, expect, it } from 'vitest';
import {
  buildLlmInput,
  buildRuleSummary,
  buildSummaryUserPrompt,
  formatCounts,
  formatPeriodLabel,
} from './summary';

describe('buildLlmInput', () => {
  it('cleans and truncates body and limits files per PR', () => {
    const result = buildLlmInput({
      periodLabel: '기간',
      includedPrs: [
        {
          number: 1,
          title: 'Test',
          url: 'https://example.com/pr/1',
          body: 'Hello <!--comment-->world 123',
          mergedAt: '2024-01-01T00:00:00Z',
          domainTags: ['checkout'],
          signalTags: ['pricing'],
          diffStat: { additions: 1, deletions: 0, changes: 1 },
          includedFiles: [
            { filename: 'a.ts' },
            { filename: 'b.ts' },
            { filename: 'c.ts' },
          ],
        },
      ],
      domainCounts: { checkout: 1 },
      signalCounts: { pricing: 1 },
      maxBodyChars: 5,
      maxFilesPerPr: 2,
      timezone: 'Asia/Seoul',
    });

    expect(result.period).toBe('기간');
    expect(result.totalPrs).toBe(1);
    expect(result.prs[0].body).toBe('Hello…');
    expect(result.prs[0].files).toEqual(['a.ts', 'b.ts']);
    expect(result.prs[0].mergedDate).toContain('2024. 01. 01.');
    expect(result.prs[0].mergedDayLabel).toBe('월요일');
  });
});

describe('buildRuleSummary', () => {
  it('includes domain summary when counts exist', () => {
    const summary = buildRuleSummary({
      includedPrs: [{}, {}],
      domainCounts: { checkout: 2 },
    });

    expect(summary).toContain('- 총 2건의 PR이 집계되었습니다.');
    expect(summary).toContain('주요 도메인: 결제/주문 2건');
  });
});

describe('formatCounts', () => {
  it('sorts by count and formats using labels', () => {
    const result = formatCounts(
      { a: 2, b: 1, c: 1 },
      { a: 'A', b: 'B' },
    );

    expect(result).toBe('A 2건, B 1건, c 1건');
  });
});

describe('formatPeriodLabel', () => {
  it('formats a period with timezone', () => {
    const label = formatPeriodLabel({
      since: new Date(Date.UTC(2024, 0, 2, 0, 0)),
      until: new Date(Date.UTC(2024, 0, 2, 3, 30)),
      timezone: 'Asia/Seoul',
    });

    expect(label).toContain('2024. 01. 02.');
    expect(label).toContain('09:00');
    expect(label).toContain('12:30');
    expect(label).toContain('(Asia/Seoul)');
  });
});

describe('buildSummaryUserPrompt', () => {
  it('renders the JSON payload with required headers', () => {
    const prompt = buildSummaryUserPrompt({ totalPrs: 1 });

    expect(prompt).toContain('JSON:');
    expect(prompt).toContain('*코드적인 변경*');
    expect(prompt).toContain('"totalPrs": 1');
  });
});
