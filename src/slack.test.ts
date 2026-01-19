import { describe, expect, it } from 'vitest';
import { buildSlackMessage } from './slack';

describe('buildSlackMessage', () => {
  it('builds blocks with domain summary and PR lists', () => {
    const payload = buildSlackMessage({
      periodLabel: '2024-01-01',
      summaryText: '요약 텍스트',
      domainCounts: { checkout: 2 },
      includedPrs: [
        {
          number: 1,
          title: 'Fix < & >',
          url: 'https://example.com/pr/1',
        },
      ],
      excludedPrs: [
        {
          number: 2,
          title: 'Skip',
          url: 'https://example.com/pr/2',
        },
      ],
      topPrCount: 5,
    });

    expect(payload.blocks).toHaveLength(5);

    const includedBlock = payload.blocks.find(
      block => block.text?.text?.includes('*포함 PR'),
    );
    const excludedBlock = payload.blocks.find(
      block => block.text?.text?.includes('*제외됨 PR'),
    );

    expect(includedBlock.text.text).toContain('&lt;');
    expect(includedBlock.text.text).toContain('&amp;');
    expect(includedBlock.text.text).toContain('&gt;');
    expect(excludedBlock.text.text).toContain('(제외됨)');
  });
});
