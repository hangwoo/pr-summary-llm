"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeFiles = analyzeFiles;
exports.splitPrsByInclusion = splitPrsByInclusion;
exports.countTags = countTags;
function analyzeFiles({ files, compiled, config, }) {
    const includedFiles = [];
    const excludedFiles = [];
    const domainTags = new Set();
    const signalTags = new Set();
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
function splitPrsByInclusion(prs) {
    const includedPrs = [];
    const excludedPrs = [];
    for (const pr of prs) {
        if (pr.includedFiles.length === 0) {
            excludedPrs.push(pr);
            continue;
        }
        includedPrs.push(pr);
    }
    return { includedPrs, excludedPrs };
}
function countTags(listOfTagLists) {
    const counter = new Map();
    for (const tags of listOfTagLists) {
        for (const tag of tags) {
            counter.set(tag, (counter.get(tag) || 0) + 1);
        }
    }
    const result = {};
    for (const [tag, count] of counter.entries()) {
        result[tag] = count;
    }
    return result;
}
function normalizePath(value) {
    return value.replace(/\\/g, '/');
}
function getExclusionReason({ filename, patch, changes, compiled, config, }) {
    if (!filename) {
        return 'missing-filename';
    }
    if (matchesAny(filename, compiled.excludeMatchers)) {
        return 'excluded-path';
    }
    if (!patch) {
        return 'no-patch';
    }
    if (typeof config.maxPatchLines === 'number' &&
        changes > config.maxPatchLines) {
        return 'large-patch';
    }
    if (typeof config.maxPatchChars === 'number' &&
        patch.length > config.maxPatchChars) {
        return 'large-patch';
    }
    return '';
}
function matchDomains(filename, domainMatchers) {
    const matches = [];
    for (const rule of domainMatchers) {
        if (matchesAny(filename, rule.patterns)) {
            matches.push(rule.name);
        }
    }
    return matches;
}
function matchSignals({ filename, patch, compiled, }) {
    const text = `${filename}\n${patch}`.toLowerCase();
    const matches = [];
    for (const rule of compiled.signalMatchers) {
        if (rule.keywords.some((keyword) => text.includes(keyword))) {
            matches.push(rule.name);
        }
    }
    return matches;
}
function matchesAny(filename, matchers) {
    return matchers.some(matcher => matcher.test(filename));
}
