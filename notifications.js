(function () {
  const NOTIFICATION_KEY = 'hydroNotifications';

  const defaultNotifications = [
    { id: 1, title: 'Hydrobotics team liked your update', message: 'Hydrobotics team liked your update', type: 'success', time: '5 minutes ago' },
    { id: 2, title: 'New comments on your prototype post', message: 'New comments on your prototype post', type: 'info', time: '1 hour ago' },
    { id: 3, title: 'Inventor portal invitation', message: 'Inventor portal invitation', type: 'alert', time: 'Today' },
    { id: 4, title: 'Your settings were updated', message: 'Your settings were updated', type: 'purple', time: 'Yesterday' }
  ];

  function getNotifications() {
    const stored = localStorage.getItem(NOTIFICATION_KEY);
    if (!stored) {
      localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(defaultNotifications));
      return [...defaultNotifications];
    }

    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length ? parsed : [...defaultNotifications];
    } catch {
      localStorage.removeItem(NOTIFICATION_KEY);
      return [...defaultNotifications];
    }
  }

  function renderNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;

    const notifications = getNotifications();
    if (!notifications.length) {
      list.innerHTML = '<li class="notification-item"><span class="notification-dot info"></span><div><strong>No notifications yet</strong><small>New alerts will appear here.</small></div></li>';
      return;
    }

    list.innerHTML = notifications.map(item => `
      <li class="notification-item">
        <span class="notification-dot ${item.type || 'info'}"></span>
        <div>
          <strong>${item.title || item.message || 'New update'}</strong>
          <small>${item.time || 'Just now'}</small>
        </div>
      </li>
    `).join('');
  }

  document.addEventListener('DOMContentLoaded', renderNotifications);
})();
