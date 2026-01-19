'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.loadConfigWithFallback = loadConfigWithFallback;
exports.compileConfig = compileConfig;
const promises_1 = __importDefault(require('node:fs/promises'));
const default_config_1 = require('./default-config');
async function loadConfigWithFallback(configPath) {
  if (!configPath) {
    return default_config_1.DEFAULT_CONFIG;
  }
  try {
    const raw = await promises_1.default.readFile(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.warn(
      `설정 파일을 읽지 못해 기본값을 사용합니다: ${configPath}`,
      error,
    );
    return default_config_1.DEFAULT_CONFIG;
  }
}
function compileConfig(config) {
  return {
    excludeMatchers: (config.excludePaths || []).map(globToRegExp),
    domainMatchers: (config.domainMap || []).map(rule => ({
      name: rule.name,
      patterns: (rule.patterns || []).map(globToRegExp),
    })),
    signalMatchers: (config.signalKeywords || []).map(rule => ({
      name: rule.name,
      keywords: (rule.keywords || []).map(keyword => keyword.toLowerCase()),
    })),
  };
}
function globToRegExp(glob) {
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
function escapeRegExp(char) {
  return char.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}
