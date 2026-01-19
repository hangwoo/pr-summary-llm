import { DOMAIN_LABELS } from './constants';

export function buildLlmInput({
  periodLabel,
  includedPrs,
  domainCounts,
  signalCounts,
  maxBodyChars,
  maxFilesPerPr,
  timezone,
}: {
  periodLabel: string;
  includedPrs: any[];
  domainCounts: Record<string, number>;
  signalCounts: Record<string, number>;
  maxBodyChars: number;
  maxFilesPerPr: number;
  timezone: string;
}) {
  const prs = includedPrs.map(pr => {
    const mergedAt = pr.mergedAt || '';
    return {
      number: pr.number,
      title: pr.title,
      url: pr.url,
      body: truncateText(cleanBody(pr.body), maxBodyChars),
      domains: pr.domainTags,
      signals: pr.signalTags,
      diffStat: pr.diffStat,
      mergedAt,
      mergedDate: formatMergedDate(mergedAt, timezone),
      mergedDayLabel: formatMergedDayLabel(mergedAt, timezone),
      files: pr.includedFiles
        .slice(0, maxFilesPerPr)
        .map((file: any) => file.filename),
    };
  });

  return {
    period: periodLabel,
    totalPrs: includedPrs.length,
    domainCounts,
    signalCounts,
    prs,
  };
}

export function buildRuleSummary({
  includedPrs,
  domainCounts,
}: {
  includedPrs: any[];
  domainCounts: Record<string, number>;
}) {
  const lines = [];
  lines.push(`- 총 ${includedPrs.length}건의 PR이 집계되었습니다.`);

  const domainLine = formatCounts(domainCounts, DOMAIN_LABELS);
  if (domainLine) {
    lines.push(`- 주요 도메인: ${domainLine}`);
  }

  lines.push('- 비즈니스 영향: 중간(코드 경로/키워드 기반 추정)');
  return lines.join('\n');
}

export function formatCounts(
  counts: Record<string, number>,
  labels: Record<string, string>,
) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return '';
  }
  return entries
    .map(([key, value]) => `${labels[key] || key} ${value}건`)
    .slice(0, 5)
    .join(', ');
}

export function formatPeriodLabel({
  since,
  until,
  timezone,
}: {
  since: Date;
  until: Date;
  timezone: string;
}) {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${formatter.format(since)} ~ ${formatter.format(
    until,
  )} (${timezone})`;
}

export function buildSummaryUserPrompt(llmInput: any) {
  return `다음 JSON을 기반으로 요약을 작성하세요.\n요약은 반드시 아래 섹션 헤더를 포함하고, Slack mrkdwn 규칙을 지킵니다.\n\n- *코드적인 변경*\n- *비즈니스 정책 변경*\n- *큰 변화/추가점*\n\n추가 규칙:\n- 각 섹션은 요일별로 그룹화하며 요일 라인은 "월요일:" 형식으로 작성\n- 요일은 JSON의 mergedDayLabel/mergedDate를 기준으로 사용\n- 요일 아래 항목은 들여쓴 "- " 불릿으로 작성\n- 요일 순서는 날짜 기준 오름차순으로 정렬\n\nJSON:\n${JSON.stringify(
    llmInput,
    null,
    2,
  )}`;
}

function cleanBody(body: string) {
  return body.replace(/<!--([\s\S]*?)-->/g, '').trim();
}

function truncateText(text: string, maxChars: number) {
  if (!text) {
    return '';
  }
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}…`;
}

function formatMergedDate(mergedAt: string, timezone: string) {
  if (!mergedAt) {
    return '';
  }

  const date = new Date(mergedAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatMergedDayLabel(mergedAt: string, timezone: string) {
  if (!mergedAt) {
    return '';
  }

  const date = new Date(mergedAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: timezone,
    weekday: 'long',
  }).format(date);
}
