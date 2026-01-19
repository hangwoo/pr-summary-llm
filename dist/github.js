'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.fetchMergedPrs = fetchMergedPrs;
exports.fetchPrDetails = fetchPrDetails;
exports.fetchPrFiles = fetchPrFiles;
const promises_1 = require('node:timers/promises');
async function fetchMergedPrs({
  owner,
  repo,
  githubApiUrl,
  githubToken,
  since,
  until,
  maxResults,
}) {
  const items = [];
  let page = 1;
  while (items.length < maxResults) {
    const query = [
      `repo:${owner}/${repo}`,
      'is:pr',
      'is:merged',
      `merged:>=${since.toISOString()}`,
      `merged:<${until.toISOString()}`,
    ].join(' ');
    const url = new URL(`${githubApiUrl}/search/issues`);
    url.searchParams.set('q', query);
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));
    const data = await githubRequest(url.toString(), githubToken);
    const pageItems = Array.isArray(data.items) ? data.items : [];
    items.push(...pageItems);
    if (pageItems.length < 100) {
      break;
    }
    if (items.length >= maxResults) {
      break;
    }
    page += 1;
    await (0, promises_1.setTimeout)(150);
  }
  return items.slice(0, maxResults).map(item => ({ number: item.number }));
}
async function fetchPrDetails({
  owner,
  repo,
  githubApiUrl,
  githubToken,
  number,
}) {
  const url = `${githubApiUrl}/repos/${owner}/${repo}/pulls/${number}`;
  return githubRequest(url, githubToken);
}
async function fetchPrFiles({
  owner,
  repo,
  githubApiUrl,
  githubToken,
  number,
}) {
  const files = [];
  let page = 1;
  while (true) {
    const url = new URL(
      `${githubApiUrl}/repos/${owner}/${repo}/pulls/${number}/files`,
    );
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));
    const data = await githubRequest(url.toString(), githubToken);
    const pageFiles = Array.isArray(data) ? data : [];
    files.push(...pageFiles);
    if (pageFiles.length < 100) {
      break;
    }
    page += 1;
    await (0, promises_1.setTimeout)(120);
  }
  return files;
}
async function githubRequest(url, token) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'pr-summary-bot',
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API 오류: ${response.status} ${errorText}`);
  }
  return response.json();
}
