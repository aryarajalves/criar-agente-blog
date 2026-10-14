import { describe, test, expect } from 'vitest';
import { parseUtcDate, formatBrasiliaDateTime } from '../src/utils/date';

describe('Date Utilities - Horário Oficial de Brasília', () => {
  test('parseUtcDate normaliza string UTC sem indicador Z', () => {
    const date = parseUtcDate('2026-10-14T01:34:00');
    expect(date).not.toBeNull();
    expect(date.toISOString()).toBe('2026-10-14T01:34:00.000Z');
  });

  test('parseUtcDate preserva string com indicador Z', () => {
    const date = parseUtcDate('2026-10-14T01:34:00.000Z');
    expect(date.toISOString()).toBe('2026-10-14T01:34:00.000Z');
  });

  test('formatBrasiliaDateTime formata 01:34 UTC do dia 14/10 para 22:34 do dia 13/10 (Horário de Brasília)', () => {
    const formatted = formatBrasiliaDateTime('2026-10-14T01:34:00');
    // Deve conter 13/10/2026 e 22:34
    expect(formatted).toContain('13/10/2026');
    expect(formatted).toContain('22:34');
  });

  test('formatBrasiliaDateTime formata expiração de convite 01:29 UTC do dia 15/10 para 22:29 do dia 14/10', () => {
    const formatted = formatBrasiliaDateTime('2026-10-15T01:29:00');
    expect(formatted).toContain('14/10/2026');
    expect(formatted).toContain('22:29');
  });

  test('retorna "-" para valores nulos ou vazios', () => {
    expect(formatBrasiliaDateTime(null)).toBe('-');
    expect(formatBrasiliaDateTime('')).toBe('-');
    expect(formatBrasiliaDateTime(undefined)).toBe('-');
  });
});
