export const FLOAT_PATTERN = '(-?(?:\\d+|\\d*\\.\\d+))';

export const FLOAT_AND_UNIT_PATTERN = `${FLOAT_PATTERN}([A-Za-z]+)`;

// e.g. `cmyk(0% 0% 0% 100%)`
export const CMYK_COLOR_PATTERN = `cmyk\\(\\s*${Array.from({ length: 4 })
  .fill(`${FLOAT_PATTERN}%`)
  .join('\\s+')}\\s*\\)`;
