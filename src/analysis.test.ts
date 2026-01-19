import { describe, expect, it } from 'vitest';
import { analyzeFiles, countTags, splitPrsByInclusion } from './analysis';

describe('analyzeFiles', () => {
  it('filters files and aggregates tags and diff stats', () => {
    const compiled = {
      excludeMatchers: [/node_modules\//, /dist\//],
      domainMatchers: [
        { name: 'checkout', patterns: [/src\/checkout\//] },
        { name: 'analytics', patterns: [/src\/analytics\//] },
      ],
      signalMatchers: [
        { name: 'pricing', keywords: ['price', 'discount'] },
        { name: 'notification', keywords: ['email'] },
      ],
    };
    const config = { maxPatchLines: 5, maxPatchChars: 40 };

    const files = [
      { filename: '', patch: 'x', changes: 1 },
      { filename: 'node_modules/pkg/index.js', patch: 'x', changes: 1 },
      { filename: 'src/checkout/cart.ts', patch: '', changes: 1 },
      { filename: 'src/checkout/large.ts', patch: 'x', changes: 10 },
      {
        filename: 'src/analytics/long.ts',
        patch: 'x'.repeat(50),
        changes: 1,
      },
      {
        filename: 'src/checkout/price.ts',
        patch: '+ price change',
        additions: 3,
        deletions: 1,
        changes: 4,
        status: 'modified',
      },
      {
        filename: 'src/notify/email.ts',
        patch: '+ send email',
        additions: 1,
        deletions: 0,
        changes: 1,
      },
      {
        filename: 'src\\checkout\\promo.ts',
        patch: '+ discount',
        additions: 2,
        deletions: 0,
        changes: 2,
      },
    ];

    const result = analyzeFiles({ files, compiled, config });

    expect(result.includedFiles).toHaveLength(3);
    expect(result.excludedFiles).toHaveLength(5);
    expect(result.domainTags.sort()).toEqual(['checkout']);
    expect(result.signalTags.sort()).toEqual(['notification', 'pricing']);
    expect(result.diffStat).toEqual({ additions: 6, deletions: 1, changes: 7 });

    const reasons = result.excludedFiles.map(item => item.reason).sort();
    expect(reasons).toEqual([
      'excluded-path',
      'large-patch',
      'large-patch',
      'missing-filename',
      'no-patch',
    ]);
  });
});

describe('splitPrsByInclusion', () => {
  it('separates PRs based on included files', () => {
    const prs = [{ includedFiles: [] }, { includedFiles: ['a.ts'] }];
    const result = splitPrsByInclusion(prs);

    expect(result.includedPrs).toHaveLength(1);
    expect(result.excludedPrs).toHaveLength(1);
  });
});

describe('countTags', () => {
  it('counts tag occurrences across lists', () => {
    const result = countTags([
      ['a', 'b'],
      ['a'],
    ]);

    expect(result).toEqual({ a: 2, b: 1 });
  });
});
