import { DOMAIN_LABELS } from './constants';
import { formatCounts } from './summary';

export function buildSlackMessage({
  periodLabel,
  summaryText,
  domainCounts,
  includedPrs,
  excludedPrs,
  topPrCount,
}: {
  periodLabel: string;
  summaryText: string;
  domainCounts: Record<string, number>;
  includedPrs: any[];
  excludedPrs: any[];
  topPrCount: number;
}) {
  const blocks: any[] = [];
  const maxItems =
    Number.isFinite(topPrCount) && topPrCount > 0 ? topPrCount : 10;

  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: `PR 변경 요약 (${periodLabel})`,
    },
  });

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: summaryText,
    },
  });

  const domainLine = formatCounts(domainCounts, DOMAIN_LABELS);
  if (domainLine) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*도메인 분포*\n${domainLine}`,
      },
    });
  }

  if (includedPrs.length > 0) {
    const list = includedPrs
      .slice(0, maxItems)
      .map(pr => `- <${pr.url}|#${pr.number} ${escapeSlack(pr.title)}>`)
      .join('\n');
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*포함 PR (${includedPrs.length}건)*\n${list}`,
      },
    });
  }

  if (excludedPrs.length > 0) {
    const list = excludedPrs
      .slice(0, maxItems)
      .map(
        pr => `- <${pr.url}|#${pr.number} ${escapeSlack(pr.title)}> (제외됨)`,
      )
      .join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*제외됨 PR (${excludedPrs.length}건)*\n${list}`,
      },
    });
  }

  return { blocks };
}

export async function postSlackMessage(webhookUrl: string, payload: any) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Slack 전송 실패: ${response.status} ${errorText}`);
  }
}

function escapeSlack(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
