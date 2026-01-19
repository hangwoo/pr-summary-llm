'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.summarizeWithProvider = summarizeWithProvider;
const constants_1 = require('../constants');
const summary_1 = require('../summary');
async function summarizeWithProvider({ provider, apiKeys, models, llmInput }) {
  if (provider === 'openai') {
    if (!apiKeys.openai) {
      console.warn('OpenAI API 키가 없어 요약을 건너뜁니다.');
      return '';
    }
    return summarizeWithOpenAI({
      apiKey: apiKeys.openai,
      model: models.openai,
      llmInput,
    });
  }
  if (provider === 'anthropic') {
    if (!apiKeys.anthropic) {
      console.warn('Anthropic API 키가 없어 요약을 건너뜁니다.');
      return '';
    }
    return summarizeWithAnthropic({
      apiKey: apiKeys.anthropic,
      model: models.anthropic,
      llmInput,
    });
  }
  if (provider === 'gemini') {
    if (!apiKeys.gemini) {
      console.warn('Gemini API 키가 없어 요약을 건너뜁니다.');
      return '';
    }
    return summarizeWithGemini({
      apiKey: apiKeys.gemini,
      model: models.gemini,
      llmInput,
    });
  }
  console.warn(`지원하지 않는 LLM_PROVIDER: ${provider}`);
  return '';
}
async function summarizeWithOpenAI({ apiKey, model, llmInput }) {
  const payload = {
    model,
    input: [
      {
        role: 'system',
        content: constants_1.SUMMARY_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: (0, summary_1.buildSummaryUserPrompt)(llmInput),
      },
    ],
    temperature: 0.2,
    max_output_tokens: 700,
  };
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`OpenAI 응답 오류: ${response.status} ${errorText}`);
      return '';
    }
    const data = await response.json();
    return extractOpenAiText(data);
  } catch (error) {
    console.warn('OpenAI 요청 실패:', error);
    return '';
  }
}
async function summarizeWithAnthropic({ apiKey, model, llmInput }) {
  const payload = {
    model,
    max_tokens: 700,
    temperature: 0.2,
    system: constants_1.SUMMARY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: (0, summary_1.buildSummaryUserPrompt)(llmInput),
      },
    ],
  };
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Anthropic 응답 오류: ${response.status} ${errorText}`);
      return '';
    }
    const data = await response.json();
    return extractAnthropicText(data);
  } catch (error) {
    console.warn('Anthropic 요청 실패:', error);
    return '';
  }
}
async function summarizeWithGemini({ apiKey, model, llmInput }) {
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: (0, summary_1.buildSummaryUserPrompt)(llmInput),
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [
        {
          text: constants_1.SUMMARY_SYSTEM_PROMPT,
        },
      ],
    },
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 700,
    },
  };
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Gemini 응답 오류: ${response.status} ${errorText}`);
      return '';
    }
    const data = await response.json();
    return extractGeminiText(data);
  } catch (error) {
    console.warn('Gemini 요청 실패:', error);
    return '';
  }
}
function extractOpenAiText(data) {
  if (typeof data?.output_text === 'string') {
    return data.output_text.trim();
  }
  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (item?.content) {
        const textItem = item.content.find(
          content => content.type === 'output_text',
        );
        if (textItem?.text) {
          return textItem.text.trim();
        }
      }
    }
  }
  return '';
}
function extractAnthropicText(data) {
  if (Array.isArray(data?.content)) {
    const text = data.content
      .filter(item => item?.type === 'text' && typeof item.text === 'string')
      .map(item => item.text)
      .join('\n');
    return text.trim();
  }
  return '';
}
function extractGeminiText(data) {
  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const text = parts
    .map(part => part?.text)
    .filter(Boolean)
    .join('\n');
  return text.trim();
}
