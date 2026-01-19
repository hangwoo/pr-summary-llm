import fs from 'node:fs/promises';
import { DEFAULT_CONFIG } from './default-config';

export async function loadConfigWithFallback(configPath: string) {
  if (!configPath) {
    return DEFAULT_CONFIG;
  }

  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.warn(
      `설정 파일을 읽지 못해 기본값을 사용합니다: ${configPath}`,
      error,
    );
    return DEFAULT_CONFIG;
  }
}

export function compileConfig(config: any) {
  return {
    excludeMatchers: (config.excludePaths || []).map(globToRegExp),
    domainMatchers: (config.domainMap || []).map((rule: any) => ({
      name: rule.name,
      patterns: (rule.patterns || []).map(globToRegExp),
    })),
    signalMatchers: (config.signalKeywords || []).map((rule: any) => ({
      name: rule.name,
      keywords: (rule.keywords || []).map((keyword: string) =>
        keyword.toLowerCase(),
      ),
    })),
  };
}

function globToRegExp(glob: string) {
  let regex = '';
  let index = 0;
  while (index < glob.length) {
    const char = glob[index];
    if (char === '*') {
      const next = glob[index + 1];
      if (next === '*') {
        regex += '.*';
        index += 2;
        continue;
      }
      regex += '[^/]*';
      index += 1;
      continue;
    }
    if (char === '?') {
      regex += '.';
      index += 1;
      continue;
    }
    regex += escapeRegExp(char);
    index += 1;
  }
  return new RegExp(`^${regex}$`);
}

function escapeRegExp(char: string) {
  return char.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}
