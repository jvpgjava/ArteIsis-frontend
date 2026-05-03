/** E-mail simples e prático para formulários (RFC completo no servidor). */
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function normalizeEmail(value: string): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

/** Restringe caracteres enquanto digita (uma `@`); útil como máscara leve de e-mail. */
export function formatEmailInput(raw: string): string {
  let s = String(raw ?? '').replace(/\s/g, '');
  const at = s.indexOf('@');
  if (at !== -1) {
    const local = s.slice(0, at);
    const domain = s.slice(at + 1).replace(/@/g, '');
    s = local + '@' + domain;
  }
  return s.replace(/[^a-zA-Z0-9@._+-]/g, '');
}

export function isValidEmail(value: string): boolean {
  const s = normalizeEmail(value);
  if (s.length < 5 || s.length > 254) {
    return false;
  }
  return EMAIL_RE.test(s);
}

export function stripPhoneDigits(value: string): string {
  return String(value ?? '').replace(/\D/g, '');
}

/** Telefone BR: 10 (fixo) ou 11 (celular com 9 na frente). */
export function isValidBrazilPhoneDigits(digits: string): boolean {
  const d = stripPhoneDigits(digits);
  return d.length === 10 || d.length === 11;
}

export function formatBrazilPhoneMask(raw: string): string {
  const d = stripPhoneDigits(raw).slice(0, 11);
  if (d.length === 0) {
    return '';
  }
  if (d.length <= 2) {
    return '(' + d;
  }
  if (d.length <= 6) {
    return '(' + d.slice(0, 2) + ') ' + d.slice(2);
  }
  if (d.length <= 10) {
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
  }
  return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7, 11);
}

/** Quantidade: só dígitos, sem negativos (máx. 7 dígitos). */
export function formatOrderQtyInput(raw: string): string {
  return String(raw ?? '')
    .replace(/\D/g, '')
    .slice(0, 7);
}

/** Moeda BRL enquanto digita: dígitos = centavos acumulados → ex. `1` → R$ 0,01. */
export function formatBrlCurrencyInput(raw: string): string {
  const digits = String(raw ?? '')
    .replace(/\D/g, '')
    .slice(0, 14);
  if (!digits) {
    return '';
  }
  const cents = parseInt(digits, 10);
  if (!Number.isFinite(cents)) {
    return '';
  }
  const reais = cents / 100;
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reais);
  return 'R$ ' + formatted;
}

export function formatBrlCurrencyFromNumber(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return 'R$ 0,00';
  }
  const cents = Math.round(value * 100);
  const reais = cents / 100;
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reais);
  return 'R$ ' + formatted;
}

/** Interpreta valor mascarado `R$ 1.234,56` (dígitos = centavos). */
export function parseBrlCurrencyInput(value: string): number {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) {
    return 0;
  }
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return n / 100;
}
