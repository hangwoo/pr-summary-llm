"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIGNAL_LABELS = exports.DOMAIN_LABELS = exports.SUMMARY_SYSTEM_PROMPT = exports.DEFAULT_GEMINI_MODEL = exports.DEFAULT_ANTHROPIC_MODEL = exports.DEFAULT_OPENAI_MODEL = exports.DEFAULT_LLM_PROVIDER = exports.DEFAULT_TIMEZONE = exports.DEFAULT_MAX_RESULTS = exports.DEFAULT_LOOKBACK_HOURS = void 0;
exports.DEFAULT_LOOKBACK_HOURS = 168;
exports.DEFAULT_MAX_RESULTS = 200;
exports.DEFAULT_TIMEZONE = 'Asia/Seoul';
exports.DEFAULT_LLM_PROVIDER = 'openai';
exports.DEFAULT_OPENAI_MODEL = 'gpt-5.2';
exports.DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-sonnet-20240620';
exports.DEFAULT_GEMINI_MODEL = 'gemini-3.0';
exports.SUMMARY_SYSTEM_PROMPT = '당신은 PR 변경 요약을 작성합니다. 주어진 데이터만 사용하고 과장하지 마세요. 결과는 한국어로, Slack mrkdwn에 맞게 간결한 불릿 위주로 작성합니다.\n\n출력 규칙:\n- 섹션 헤더는 "*코드적인 변경*", "*비즈니스 정책 변경*", "*큰 변화/추가점*" 형식으로 한 줄씩 작성\n- 각 섹션은 요일별로 그룹화하며 요일 라인은 "월요일:" 형식으로 작성\n- 요일은 JSON의 mergedDayLabel/mergedDate를 기준으로 사용\n- 요일 아래 항목은 들여쓴 "- " 불릿으로 작성\n- 요일 순서는 날짜 기준 오름차순으로 정렬\n- 항목이 없으면 해당 섹션에 "- 해당 없음"만 작성\n- 섹션 사이에는 빈 줄 1줄\n\n주의: 불확실한 추정은 하지 말고, 근거가 부족하면 생략합니다.';
exports.DOMAIN_LABELS = {
    checkout: '결제/주문',
    promotion: '프로모션',
    content: '콘텐츠',
    auth: '인증/가입',
    settings: '설정/프로필',
    notification: '알림',
    analytics: '분석/측정',
    'feature-flag': '기능 플래그',
    i18n: '카피/번역',
};
exports.SIGNAL_LABELS = {
    pricing: '가격/할인',
    payment: '결제',
    policy: '정책/약관',
    experiment: '실험/롤아웃',
    growth: '성장/전환',
    notification: '알림',
};
