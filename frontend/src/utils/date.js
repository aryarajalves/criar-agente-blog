/**
 * Utilitários para formatação de datas no Horário Oficial de Brasília (America/Sao_Paulo).
 * O backend armazena e trafega timestamps em UTC.
 */

/**
 * Converte qualquer representação de data UTC (mesmo sem o sufixo 'Z')
 * para um objeto Date válido.
 */
export const parseUtcDate = (dateString) => {
  if (!dateString) return null;
  let str = String(dateString).trim();
  if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
    str += 'Z';
  }
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Formata a data e hora no padrão brasileiro (DD/MM/AAAA, HH:MM)
 * expressamente no fuso horário 'America/Sao_Paulo' (Horário de Brasília).
 */
export const formatBrasiliaDateTime = (dateString, options = {}) => {
  const date = parseUtcDate(dateString);
  if (!date) return '-';

  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  });
};
