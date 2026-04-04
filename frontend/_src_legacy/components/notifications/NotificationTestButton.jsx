import { useState } from 'react';
import { showNotification, requestNotificationPermission } from '../../lib/notifications';

// Dev-only test button for push/web notifications
export default function NotificationTestButton() {
  const [count, setCount] = useState(0);
  if (!import.meta.env.DEV) return null; // hide in production build

  const trigger = async () => {
    await requestNotificationPermission();
    const id = count + 1;
    showNotification(`Test Notification #${id}`, {
      body: 'This is a local test notification. It will not appear in production builds.',
      tag: `dev-test-${id}`
    });
    setCount(id);
  };

  return (
    <button
      type="button"
      onClick={trigger}
      className="fixed bottom-4 left-20 z-[1100] border-2 border-stone-900 dark:border-stone-600 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 hover:bg-stone-900 hover:text-white dark:hover:bg-stone-800 dark:hover:text-white transition-colors duration-100 font-mono"
    >
      {count > 0 ? `test #${count}` : 'push test'}
    </button>
  );
}
