import './TabBar.css'

export type TabId = 'path' | 'wins' | 'rewards' | 'progress'

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'path', icon: '🐾', label: 'Path' },
  { id: 'wins', icon: '🏆', label: 'Wins' },
  { id: 'rewards', icon: '🎁', label: 'Rewards' },
  { id: 'progress', icon: '⭐', label: 'Progress' },
]

/*
  Bottom tab bar, matching the official Duolingo pattern: circular icon
  badges on a raised bar, the active one ringed rather than filled — so nav
  stays quiet and doesn't compete with the green mission card above it.
*/
export function TabBar({
  active,
  onChange,
}: {
  active: TabId
  onChange: (t: TabId) => void
}) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className="tabbar__item"
          data-active={t.id === active}
          onClick={() => onChange(t.id)}
          aria-label={t.label}
          aria-current={t.id === active}
        >
          <span className="tabbar__badge">{t.icon}</span>
        </button>
      ))}
    </nav>
  )
}
