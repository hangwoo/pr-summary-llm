import { setTimeout as delay } from 'node:timers/promises';

export async function fetchMergedPrs({
  owner,
  repo,
  githubApiUrl,
  githubToken,
  since,
  until,
  maxResults,
}: {
  owner: string;
  repo: string;
  githubApiUrl: string;
  githubToken: string;
  since: Date;
  until: Date;
  maxResults: number;
}) {
  const items: Array<{ number: number }> = [];
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
    await delay(150);
  }

  return items.slice(0, maxResults).map(item => ({ number: item.number }));
}

export async function fetchPrDetails({
  owner,
  repo,
  githubApiUrl,
  githubToken,
  number,
}: {
  owner: string;
  repo: string;
  githubApiUrl: string;
  githubToken: string;
  number: number;
}) {
  const url = `${githubApiUrl}/repos/${owner}/${repo}/pulls/${number}`;
  return githubRequest(url, githubToken);
}

export async function fetchPrFiles({
  owner,
  repo,
  githubApiUrl,
  githubToken,
  number,
}: {
  owner: string;
  repo: string;
  githubApiUrl: string;
  githubToken: string;
  number: number;
}) {
  const files: any[] = [];
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
    await delay(120);
  }

  return files;
}

async function githubRequest(url: string, token: string) {
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
