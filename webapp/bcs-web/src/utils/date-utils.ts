// src/utils/date-utils.ts
import { enUS, bn } from 'date-fns/locale';

export { bn };

export const formatBanglaDate = (date: Date): string => {
  return new Intl.DateTimeFormat('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};