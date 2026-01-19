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

## 필요 시크릿

- `PR_SUMMARY_SLACK_WEBHOOK_URL`
- `OPENAI_API_KEY` 또는 `ANTHROPIC_API_KEY` 또는 `GEMINI_API_KEY`

## 라이선스

MIT
