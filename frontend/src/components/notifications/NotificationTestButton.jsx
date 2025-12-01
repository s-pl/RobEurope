import { useState } from 'react';
import { showNotification, requestNotificationPermission } from '../../lib/notifications';

// Dev-only test button for push/web notifications
export default function NotificationTestButton() {
  if (!import.meta.env.DEV) return null; // hide in production build
  const [count, setCount] = useState(0);

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
      className="fixed bottom-5 left-5 z-[1100] rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Push Test
    </button>
  );
}
