/**
 * Автоматическое форматирование номера РФ в вид: +7 (9XX) XXX-XX-XX
 */
export function formatRussianPhone(input, prevValue = '') {
  // Если пользователь стирает
  if (input.length < prevValue.length) {
    return input;
  }

  let digits = input.replace(/\D/g, '');

  if (!digits) return '';

  // Если начинает с 8 или 7 — нормализуем к 7
  if (digits.startsWith('8') || digits.startsWith('7')) {
    digits = '7' + digits.slice(1);
  } else {
    digits = '7' + digits;
  }

  digits = digits.substring(0, 11);

  let formatted = '+7';
  if (digits.length > 1) {
    formatted += ' (' + digits.substring(1, 4);
  }
  if (digits.length > 4) {
    formatted += ') ' + digits.substring(4, 7);
  } else if (digits.length === 4) {
    formatted += ')';
  }
  if (digits.length > 7) {
    formatted += '-' + digits.substring(7, 9);
  }
  if (digits.length > 9) {
    formatted += '-' + digits.substring(9, 11);
  }

  return formatted;
}

export function isPhoneValid(phone) {
  return phone && phone.replace(/\D/g, '').length === 11;
}