function getInputValue(name: string) {
  const key = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
  const raw = process.env[key];
  if (!raw) {
    return '';
  }
  return raw.trim();
}

export function resolveInputValue(
  name: string,
  fallbackValue: string | number | undefined | null,
) {
  const value = getInputValue(name);
  if (value) {
    return value;
  }
  if (fallbackValue === undefined || fallbackValue === null) {
    return '';
  }
  return String(fallbackValue);
}

export function assertRequired(name: string, value: string) {
  if (!value) {
    throw new Error(`${name} 입력이 필요합니다.`);
  }
}
