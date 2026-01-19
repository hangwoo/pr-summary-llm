import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import {
  DEFAULT_LOOKBACK_HOURS,
  DEFAULT_MAX_RESULTS,
  DEFAULT_TIMEZONE,
  DEFAULT_LLM_PROVIDER,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_GEMINI_MODEL,
} from './constants';
import { resolveInputValue, assertRequired } from './inputs';
import { loadConfigWithFallback, compileConfig } from './config';
import { fetchMergedPrs, fetchPrDetails, fetchPrFiles } from './github';
import { analyzeFiles, splitPrsByInclusion, countTags } from './analysis';
import { buildLlmInput, buildRuleSummary, formatPeriodLabel } from './summary';
import { summarizeWithProvider } from './llm';
import { buildSlackMessage, postSlackMessage } from './slack';

export async function run() {
  const githubToken = resolveInputValue(
    'github-token',
    process.env.GITHUB_TOKEN,
  );
  const slackWebhookUrl = resolveInputValue(
    'pr-summary-slack-webhook-url',
    process.env.PR_SUMMARY_SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL,
  );
  const llmProvider = resolveInputValue(
    'llm-provider',
    process.env.LLM_PROVIDER || DEFAULT_LLM_PROVIDER,
  ).toLowerCase();
  const openaiApiKey = resolveInputValue(
    'openai-api-key',
    process.env.OPENAI_API_KEY,
  );
  const anthropicApiKey = resolveInputValue(
    'anthropic-api-key',
    process.env.ANTHROPIC_API_KEY,
  );
  const geminiApiKey = resolveInputValue(
    'gemini-api-key',
    process.env.GEMINI_API_KEY,
  );
  const openaiModel = resolveInputValue(
    'openai-model',
    process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
  );
  const anthropicModel = resolveInputValue(
    'anthropic-model',
    process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
  );
  const geminiModel = resolveInputValue(
    'gemini-model',
    process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  );
  const lookbackHours = Number(
    resolveInputValue(
      'lookback-hours',
      process.env.LOOKBACK_HOURS || DEFAULT_LOOKBACK_HOURS,
    ),
  );
  const timezone = resolveInputValue(
    'timezone',
    process.env.TIMEZONE || DEFAULT_TIMEZONE,
  );
  const maxResults = Number(
    resolveInputValue(
      'max-results',
      process.env.MAX_RESULTS || DEFAULT_MAX_RESULTS,
    ),
  );
  const repoFullName = process.env.GITHUB_REPOSITORY;
  const githubApiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';

  assertRequired('github-token', githubToken);
  assertRequired('pr-summary-slack-webhook-url', slackWebhookUrl);
  if (!repoFullName) {
    throw new Error('GITHUB_REPOSITORY가 설정되지 않았습니다.');
  }

  const [owner, repo] = repoFullName.split('/');
  if (!owner || !repo) {
    throw new Error(
      `GITHUB_REPOSITORY 형식이 올바르지 않습니다: ${repoFullName}`,
    );
  }

  const rawConfigPath = resolveInputValue(
    'config-path',
    process.env.PR_SUMMARY_CONFIG ||
      path.join('scripts', 'pr-summary.config.json'),
  );
  const configPath = resolveConfigPath(rawConfigPath);
  const config = await loadConfigWithFallback(configPath);
  const compiled = compileConfig(config);
  const topPrCount = Number(config.topPrCount || 10);

  const now = new Date();
  const since = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);

  const prs = await fetchMergedPrs({
    owner,
    repo,
    githubApiUrl,
    githubToken,
    since,
    until: now,
    maxResults,
  });

  if (prs.length === 0) {
    const message = buildSlackMessage({
      periodLabel: formatPeriodLabel({ since, until: now, timezone }),
      summaryText: '이번 기간에 머지된 PR이 없습니다.',
      domainCounts: {},
      includedPrs: [],
      excludedPrs: [],
      topPrCount,
    });
    await postSlackMessage(slackWebhookUrl, message);
    console.log('No merged PRs found. Slack message sent.');
    return;
  }

  const detailedPrs: any[] = [];
  for (const prItem of prs) {
    const pr = await fetchPrDetails({
      owner,
      repo,
      githubApiUrl,
      githubToken,
      number: prItem.number,
    });
    const files = await fetchPrFiles({
      owner,
      repo,
      githubApiUrl,
      githubToken,
      number: prItem.number,
    });

    const { includedFiles, excludedFiles, domainTags, signalTags, diffStat } =
      analyzeFiles({
        files,
        compiled,
        config,
      });

    detailedPrs.push({
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      body: pr.body || '',
      mergedAt: pr.merged_at,
      author: pr.user?.login || 'unknown',
      includedFiles,
      excludedFiles,
      domainTags,
      signalTags,
      diffStat,
    });

    await delay(120);
  }

  const { includedPrs, excludedPrs } = splitPrsByInclusion(detailedPrs);
  const domainCounts = countTags(includedPrs.map(pr => pr.domainTags));
  const signalCounts = countTags(includedPrs.map(pr => pr.signalTags));

  const periodLabel = formatPeriodLabel({ since, until: now, timezone });

  const llmInput = buildLlmInput({
    periodLabel,
    includedPrs,
    domainCounts,
    signalCounts,
    maxBodyChars: 1500,
    maxFilesPerPr: 8,
  });

  const summaryText = await summarizeWithProvider({
    provider: llmProvider,
    apiKeys: {
      openai: openaiApiKey,
      anthropic: anthropicApiKey,
      gemini: geminiApiKey,
    },
    models: {
      openai: openaiModel,
      anthropic: anthropicModel,
      gemini: geminiModel,
    },
    llmInput,
  });

  const finalSummary =
    summaryText || buildRuleSummary({ includedPrs, domainCounts });

  const message = buildSlackMessage({
    periodLabel,
    summaryText: finalSummary,
    domainCounts,
    includedPrs,
    excludedPrs,
    topPrCount,
  });

  await postSlackMessage(slackWebhookUrl, message);
  console.log('Slack summary sent.');
}

function resolveConfigPath(value: string) {
  if (!value) {
    return '';
  }

  if (path.isAbsolute(value)) {
    return value;
  }

  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  return path.join(workspace, value);
}
