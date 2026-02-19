export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function todayString(): string {
  return toDateString(new Date());
}

export function getWeekDays(startDate: Date, startDayOffset = 0): Date[] {
  // startDayOffset: 0=Mon, 1=Tue, ..., 6=Sun
  const days: Date[] = [];
  const date = new Date(startDate);
  // Find this week's start
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ...
  const diff = (dayOfWeek - 1 - startDayOffset + 7) % 7;
  date.setDate(date.getDate() - diff);
  for (let i = 0; i < 7; i++) {
    const d = new Date(date);
    d.setDate(date.getDate() + i);
    days.push(d);
  }
  return days;
}

export function formatDateDutch(date: Date): string {
  const days = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
  const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

export function formatDayOfWeek(date: Date): string {
  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  return days[date.getDay()];
}

export function formatShortDay(date: Date): string {
  const days = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
  return days[date.getDay()];
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateString(a) === toDateString(b);
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
