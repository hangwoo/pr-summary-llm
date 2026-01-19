export function analyzeFiles({
  files,
  compiled,
  config,
}: {
  files: any[];
  compiled: any;
  config: any;
}) {
  const includedFiles: any[] = [];
  const excludedFiles: Array<{ filename: string; reason: string }> = [];
  const domainTags = new Set<string>();
  const signalTags = new Set<string>();

  let totalAdditions = 0;
  let totalDeletions = 0;
  let totalChanges = 0;

  for (const file of files) {
    const filename = normalizePath(file.filename || '');
    const patch = typeof file.patch === 'string' ? file.patch : '';
    const changes = Number(file.changes || 0);

    const exclusionReason = getExclusionReason({
      filename,
      patch,
      changes,
      compiled,
      config,
    });

    if (exclusionReason) {
      excludedFiles.push({ filename, reason: exclusionReason });
      continue;
    }

    includedFiles.push({
      filename,
      additions: Number(file.additions || 0),
      deletions: Number(file.deletions || 0),
      changes,
      status: file.status || '',
    });

    totalAdditions += Number(file.additions || 0);
    totalDeletions += Number(file.deletions || 0);
    totalChanges += changes;

    for (const domain of matchDomains(filename, compiled.domainMatchers)) {
      domainTags.add(domain);
    }

    for (const signal of matchSignals({ filename, patch, compiled })) {
      signalTags.add(signal);
    }
  }

  return {
    includedFiles,
    excludedFiles,
    domainTags: Array.from(domainTags),
    signalTags: Array.from(signalTags),
    diffStat: {
      additions: totalAdditions,
      deletions: totalDeletions,
      changes: totalChanges,
    },
  };
}

export function splitPrsByInclusion(prs: any[]) {
  const includedPrs: any[] = [];
  const excludedPrs: any[] = [];

  for (const pr of prs) {
    if (pr.includedFiles.length === 0) {
      excludedPrs.push(pr);
      continue;
    }
    includedPrs.push(pr);
  }

  return { includedPrs, excludedPrs };
}

export function countTags(listOfTagLists: string[][]) {
  const counter = new Map<string, number>();
  for (const tags of listOfTagLists) {
    for (const tag of tags) {
      counter.set(tag, (counter.get(tag) || 0) + 1);
    }
  }

  const result: Record<string, number> = {};
  for (const [tag, count] of counter.entries()) {
    result[tag] = count;
  }
  return result;
}

function normalizePath(value: string) {
  return value.replace(/\\/g, '/');
}

function getExclusionReason({
  filename,
  patch,
  changes,
  compiled,
  config,
}: {
  filename: string;
  patch: string;
  changes: number;
  compiled: any;
  config: any;
}) {
  if (!filename) {
    return 'missing-filename';
  }

  if (matchesAny(filename, compiled.excludeMatchers)) {
    return 'excluded-path';
  }

  if (!patch) {
    return 'no-patch';
  }

  if (
    typeof config.maxPatchLines === 'number' &&
    changes > config.maxPatchLines
  ) {
    return 'large-patch';
  }

  if (
    typeof config.maxPatchChars === 'number' &&
    patch.length > config.maxPatchChars
  ) {
    return 'large-patch';
  }

  return '';
}

function matchDomains(
  filename: string,
  domainMatchers: Array<{ name: string; patterns: RegExp[] }>,
) {
  const matches: string[] = [];
  for (const rule of domainMatchers) {
    if (matchesAny(filename, rule.patterns)) {
      matches.push(rule.name);
    }
  }
  return matches;
}

function matchSignals({
  filename,
  patch,
  compiled,
}: {
  filename: string;
  patch: string;
  compiled: any;
}) {
  const text = `${filename}\n${patch}`.toLowerCase();
  const matches: string[] = [];
  for (const rule of compiled.signalMatchers) {
    if (rule.keywords.some((keyword: string) => text.includes(keyword))) {
      matches.push(rule.name);
    }
  }
  return matches;
}

function matchesAny(filename: string, matchers: RegExp[]) {
  return matchers.some(matcher => matcher.test(filename));
}
