// 每日游玩时长与休息状态
import { reactive } from 'vue';
import { storage } from '@/sdk/storage';
import { settings } from '@/sdk/settings';

const dateKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export const session = reactive({
  today: storage.get('today', { date: '', sec: 0 }),
  resting: false,
});

function rollDate() {
  if (session.today.date !== dateKey()) session.today = { date: dateKey(), sec: 0 };
}

export function addSecond() {
  rollDate();
  session.today.sec++;
  if (session.today.sec % 5 === 0) storage.set('today', session.today);
}

export function overLimit() {
  rollDate();
  return settings.limit > 0 && session.today.sec >= settings.limit * 60;
}

export function resetToday() {
  session.today = { date: dateKey(), sec: 0 };
  storage.set('today', session.today);
  session.resting = false;
}
