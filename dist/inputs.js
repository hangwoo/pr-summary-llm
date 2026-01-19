'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.resolveInputValue = resolveInputValue;
exports.assertRequired = assertRequired;
function getInputValue(name) {
  const key = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
  const raw = process.env[key];
  if (!raw) {
    return '';
  }
  return raw.trim();
}
function resolveInputValue(name, fallbackValue) {
  const value = getInputValue(name);
  if (value) {
    return value;
  }
  if (fallbackValue === undefined || fallbackValue === null) {
    return '';
  }
  return String(fallbackValue);
}
function assertRequired(name, value) {
  if (!value) {
    throw new Error(`${name} 입력이 필요합니다.`);
  }
}
