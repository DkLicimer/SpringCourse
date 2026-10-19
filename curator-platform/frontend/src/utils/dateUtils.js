// Утилита форматирования времени в часовом поясе Читы (UTC+9, Забайкальский край)
export const formatChitaTime = (dateStr, options = {}) => {
  if (!dateStr) return '—';
  const defaultOptions = {
    timeZone: 'Asia/Chita',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  return new Date(dateStr).toLocaleString('ru-RU', defaultOptions);
};