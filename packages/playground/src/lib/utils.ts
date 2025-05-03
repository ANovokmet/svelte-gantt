import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

(window as any)['dayjs'] = dayjs;

export function time(input: string) {
  return dayjs(input, 'HH:mm').valueOf();
}
