import { useMemo } from 'react'
import { Link } from 'react-router-dom'

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
  const { notifications, loading, error, refresh, markRead, markAllRead, respondToCourseInvite } = useNotifications()

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
              {notifications.map(item => {
                const feedbackId = item.feedback?.id || item.feedback_id
                const targetUrl = item.target_url || (feedbackId ? `/reviews/${feedbackId}` : null)
                const inviteStatus = item.metadata?.invite_status
                const canRespondToInvite = item.verb === 'course_invited' && (!inviteStatus || inviteStatus === 'pending')
                const acceptedInvite = item.verb === 'course_invited' && inviteStatus === 'accepted'
                const courseTargetUrl = item.metadata?.course_id ? `/my-courses?courseId=${item.metadata.course_id}` : '/my-courses'
                return (
                  <li key={item.id} className={item.is_read ? 'notification read' : 'notification'}>
                    <div>
                      <div>{item.message}</div>
                      <small className="muted">{formatDate(item.created_at)}</small>
                      {inviteStatus && <small className="muted">Invite status: {inviteStatus}</small>}
                    </div>
                    <div className="actions" style={{ gap: 8 }}>
                      {canRespondToInvite && (
                        <>
                          <button type="button" className="btn" onClick={() => respondToCourseInvite(item.id, 'accept')}>
                            Accept invite
                          </button>
                          <button type="button" className="btn" onClick={() => respondToCourseInvite(item.id, 'decline')}>
                            Decline
                          </button>
                        </>
                      )}
                      {!item.is_read && (
                        <button type="button" className="btn link" onClick={() => markRead(item.id)}>
                          Mark read
                        </button>
                      )}
                      {acceptedInvite && (
                        <Link className="btn link" to={courseTargetUrl} aria-label="View invited course">
                          View course
                        </Link>
                      )}
                      {targetUrl && (
                        <Link className="btn link" to={targetUrl} aria-label="View full review details">
                          View review
                        </Link>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}
