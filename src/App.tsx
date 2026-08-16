import { useState } from 'react'
import { Home } from './screens/Home'
import { Wins } from './screens/Wins'
import { Rewards } from './screens/Rewards'
import { ProgressScreen } from './screens/Progress'
import { TabBar, type TabId } from './components/TabBar'

const SCREENS: Record<TabId, React.ComponentType> = {
  path: Home,
  wins: Wins,
  rewards: Rewards,
  progress: ProgressScreen,
}

export default function App() {
  const [tab, setTab] = useState<TabId>('path')
  const Screen = SCREENS[tab]

  return (
    <div className="shell">
      <div className="app">
        <div className="app__scroll">
          <Screen />
        </div>
        <TabBar active={tab} onChange={setTab} />
      </div>
    </div>
  )
}
