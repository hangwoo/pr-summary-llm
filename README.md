# PR Summary LLM

Merged PRs를 요약해 Slack으로 전송하는 GitHub Action입니다. OpenAI/Anthropic/Gemini를 선택할 수 있습니다.

## 사용 예시

```yaml
name: PR Summary

on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:
    inputs:
      lookback_hours:
        description: "조회 기간(시간)"
        required: false
        default: "168"

permissions:
  contents: read
  pull-requests: read
  issues: read

jobs:
  pr-summary:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: PR Summary
        uses: hangwoo/pr-summary-llm@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          pr-summary-slack-webhook-url: ${{ secrets.PR_SUMMARY_SLACK_WEBHOOK_URL }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          llm-provider: openai
          openai-model: gpt-5.2
          lookback-hours: ${{ github.event.inputs.lookback_hours || '168' }}
          timezone: Asia/Seoul
          config-path: scripts/pr-summary.config.json
```

## 권한

```yaml
permissions:
  contents: read
  pull-requests: read
  issues: read
```

## Provider별 설정 예시

### OpenAI

```yaml
- uses: hangwoo/pr-summary-llm@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    pr-summary-slack-webhook-url: ${{ secrets.PR_SUMMARY_SLACK_WEBHOOK_URL }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    llm-provider: openai
    openai-model: gpt-5.2
```

### Anthropic

```yaml
- uses: hangwoo/pr-summary-llm@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    pr-summary-slack-webhook-url: ${{ secrets.PR_SUMMARY_SLACK_WEBHOOK_URL }}
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    llm-provider: anthropic
    anthropic-model: claude-3-5-sonnet-20240620
```

### Gemini

```yaml
- uses: hangwoo/pr-summary-llm@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    pr-summary-slack-webhook-url: ${{ secrets.PR_SUMMARY_SLACK_WEBHOOK_URL }}
    gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
    llm-provider: gemini
    gemini-model: gemini-3.0
```

## 입력값

- `github-token` (required): GitHub API 호출용 토큰
- `pr-summary-slack-webhook-url` (required): Slack Incoming Webhook URL
- `llm-provider`: `openai` | `anthropic` | `gemini` (default: `openai`)
- `openai-api-key`, `anthropic-api-key`, `gemini-api-key`: 선택한 provider에 맞게 설정
- `openai-model` (default: `gpt-5.2`)
- `anthropic-model` (default: `claude-3-5-sonnet-20240620`)
- `gemini-model` (default: `gemini-3.0`)
- `lookback-hours` (default: `168`)
- `timezone` (default: `Asia/Seoul`)
- `max-results` (default: `200`)
- `config-path` (default: `scripts/pr-summary.config.json`)

## 설정 파일

`config-path`는 **액션을 사용하는 레포지토리** 기준 경로입니다.
파일이 없으면 기본 설정이 사용됩니다.

예시:
```json
{
  "excludePaths": ["**/dist/**", "**/*.snap"],
  "maxPatchLines": 400,
  "maxPatchChars": 12000,
  "domainMap": [
    {"name": "checkout", "patterns": ["src/**/checkout/**"]}
  ],
  "signalKeywords": [
    {"name": "policy", "keywords": ["policy", "terms", "consent"]}
  ],
  "topPrCount": 8
}
```

## 출력 예시 (Slack)

```
*코드적인 변경*
- PR 요약 자동화 개선: 로컬 액션 도입 및 요약 포맷 표준화 (#123)
- 알림 설정 플로우 리뉴얼 및 권한 UI 추가 (#124)

*비즈니스 정책 변경*
- 신규 고객 첫 구매 적립금 기본값: 3000원 → 1000원

*큰 변화/추가점*
- 푸시 알림 설정/권한 플로우 전반 개편
```

## 버전 정책

- `v1` 태그는 호환성 유지 범위에서 최신 릴리스를 가리킵니다.
- 변경 후에는 `dist/`를 업데이트하고 `v1.x.y` → `v1` 순으로 태그를 갱신합니다.

## 필요 시크릿

- `PR_SUMMARY_SLACK_WEBHOOK_URL`
- `OPENAI_API_KEY` 또는 `ANTHROPIC_API_KEY` 또는 `GEMINI_API_KEY`

## 라이선스

MIT
