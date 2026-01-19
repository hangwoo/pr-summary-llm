"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const node_path_1 = __importDefault(require("node:path"));
const promises_1 = require("node:timers/promises");
const constants_1 = require("./constants");
const inputs_1 = require("./inputs");
const config_1 = require("./config");
const github_1 = require("./github");
const analysis_1 = require("./analysis");
const summary_1 = require("./summary");
const llm_1 = require("./llm");
const slack_1 = require("./slack");
async function run() {
    const githubToken = (0, inputs_1.resolveInputValue)('github-token', process.env.GITHUB_TOKEN);
    const slackWebhookUrl = (0, inputs_1.resolveInputValue)('pr-summary-slack-webhook-url', process.env.PR_SUMMARY_SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL);
    const llmProvider = (0, inputs_1.resolveInputValue)('llm-provider', process.env.LLM_PROVIDER || constants_1.DEFAULT_LLM_PROVIDER).toLowerCase();
    const openaiApiKey = (0, inputs_1.resolveInputValue)('openai-api-key', process.env.OPENAI_API_KEY);
    const anthropicApiKey = (0, inputs_1.resolveInputValue)('anthropic-api-key', process.env.ANTHROPIC_API_KEY);
    const geminiApiKey = (0, inputs_1.resolveInputValue)('gemini-api-key', process.env.GEMINI_API_KEY);
    const openaiModel = (0, inputs_1.resolveInputValue)('openai-model', process.env.OPENAI_MODEL || constants_1.DEFAULT_OPENAI_MODEL);
    const anthropicModel = (0, inputs_1.resolveInputValue)('anthropic-model', process.env.ANTHROPIC_MODEL || constants_1.DEFAULT_ANTHROPIC_MODEL);
    const geminiModel = (0, inputs_1.resolveInputValue)('gemini-model', process.env.GEMINI_MODEL || constants_1.DEFAULT_GEMINI_MODEL);
    const lookbackHours = Number((0, inputs_1.resolveInputValue)('lookback-hours', process.env.LOOKBACK_HOURS || constants_1.DEFAULT_LOOKBACK_HOURS));
    const timezone = (0, inputs_1.resolveInputValue)('timezone', process.env.TIMEZONE || constants_1.DEFAULT_TIMEZONE);
    const maxResults = Number((0, inputs_1.resolveInputValue)('max-results', process.env.MAX_RESULTS || constants_1.DEFAULT_MAX_RESULTS));
    const repoFullName = process.env.GITHUB_REPOSITORY;
    const githubApiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';
    (0, inputs_1.assertRequired)('github-token', githubToken);
    (0, inputs_1.assertRequired)('pr-summary-slack-webhook-url', slackWebhookUrl);
    if (!repoFullName) {
        throw new Error('GITHUB_REPOSITORY가 설정되지 않았습니다.');
    }
    const [owner, repo] = repoFullName.split('/');
    if (!owner || !repo) {
        throw new Error(`GITHUB_REPOSITORY 형식이 올바르지 않습니다: ${repoFullName}`);
    }
    const rawConfigPath = (0, inputs_1.resolveInputValue)('config-path', process.env.PR_SUMMARY_CONFIG ||
        node_path_1.default.join('scripts', 'pr-summary.config.json'));
    const configPath = resolveConfigPath(rawConfigPath);
    const config = await (0, config_1.loadConfigWithFallback)(configPath);
    const compiled = (0, config_1.compileConfig)(config);
    const topPrCount = Number(config.topPrCount || 10);
    const now = new Date();
    const since = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);
    const prs = await (0, github_1.fetchMergedPrs)({
        owner,
        repo,
        githubApiUrl,
        githubToken,
        since,
        until: now,
        maxResults,
    });
    if (prs.length === 0) {
        const message = (0, slack_1.buildSlackMessage)({
            periodLabel: (0, summary_1.formatPeriodLabel)({ since, until: now, timezone }),
            summaryText: '이번 기간에 머지된 PR이 없습니다.',
            domainCounts: {},
            includedPrs: [],
            excludedPrs: [],
            topPrCount,
        });
        await (0, slack_1.postSlackMessage)(slackWebhookUrl, message);
        console.log('No merged PRs found. Slack message sent.');
        return;
    }
    const detailedPrs = [];
    for (const prItem of prs) {
        const pr = await (0, github_1.fetchPrDetails)({
            owner,
            repo,
            githubApiUrl,
            githubToken,
            number: prItem.number,
        });
        const files = await (0, github_1.fetchPrFiles)({
            owner,
            repo,
            githubApiUrl,
            githubToken,
            number: prItem.number,
        });
        const { includedFiles, excludedFiles, domainTags, signalTags, diffStat } = (0, analysis_1.analyzeFiles)({
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
        await (0, promises_1.setTimeout)(120);
    }
    const { includedPrs, excludedPrs } = (0, analysis_1.splitPrsByInclusion)(detailedPrs);
    const domainCounts = (0, analysis_1.countTags)(includedPrs.map(pr => pr.domainTags));
    const signalCounts = (0, analysis_1.countTags)(includedPrs.map(pr => pr.signalTags));
    const periodLabel = (0, summary_1.formatPeriodLabel)({ since, until: now, timezone });
    const llmInput = (0, summary_1.buildLlmInput)({
        periodLabel,
        includedPrs,
        domainCounts,
        signalCounts,
        maxBodyChars: 1500,
        maxFilesPerPr: 8,
        timezone,
    });
    const summaryText = await (0, llm_1.summarizeWithProvider)({
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
    const finalSummary = summaryText || (0, summary_1.buildRuleSummary)({ includedPrs, domainCounts });
    const message = (0, slack_1.buildSlackMessage)({
        periodLabel,
        summaryText: finalSummary,
        domainCounts,
        includedPrs,
        excludedPrs,
        topPrCount,
    });
    await (0, slack_1.postSlackMessage)(slackWebhookUrl, message);
    console.log('Slack summary sent.');
}
function resolveConfigPath(value) {
    if (!value) {
        return '';
    }
    if (node_path_1.default.isAbsolute(value)) {
        return value;
    }
    const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
    return node_path_1.default.join(workspace, value);
}
