import { useMemo } from 'react'

import { useNotifications } from '../hooks/useNotifications.js'

const formatDate = (value) => {
  if (!value) return ''
  try {
    const date = new Date(value)
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } catch {
    return ''
  }
}

export default function Notifications() {
  const { notifications, loading, error, refresh, markRead, markAllRead } = useNotifications()

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications])

  return (
    <>
      <div className="header-row">
        <div>
          <h1>Notifications Center</h1>
          <p className="muted">Stay up to date with assignment posts and review activity.</p>
        </div>
        <div className="actions" style={{ gap: 8 }}>
          <button type="button" className="btn" onClick={refresh} disabled={loading} aria-label="Refresh notifications">
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={markAllRead}
            disabled={loading || unreadCount === 0}
            aria-label="Mark all notifications as read"
          >
            Mark all read
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="error-text">Unable to load notifications. Please try again.</p>
      )}
      <section className="tile" aria-labelledby="nt-recent">
        <h2 id="nt-recent" className="tile-title">
          {loading ? 'Recent notifications (loading…)': 'Recent notifications'}
        </h2>
        <div className="tile-content">
          {!loading && notifications.length === 0 ? (
            <p>No notifications yet.</p>
          ) : (
            <ul className="notification-list">
              {notifications.map(item => (
                <li key={item.id} className={item.is_read ? 'notification read' : 'notification'}>
                  <div>
                    <div>{item.message}</div>
                    <small className="muted">{formatDate(item.created_at)}</small>
                  </div>
                  {!item.is_read && (
                    <button type="button" className="btn link" onClick={() => markRead(item.id)}>
                      Mark read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}
