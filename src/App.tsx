import { useEffect } from 'react';
import { AppProvider, useApp } from './context';
import type { Role, Permission, Screen } from './types';
import Drawer from './components/Drawer';
import Toast from './components/Toast';
import Portfolio from './screens/Portfolio';
import NewRequest from './screens/NewRequest';
import IdeaCapture from './screens/IdeaCapture';
import Arbitration from './screens/Arbitration';
import POBAssessment from './screens/POBAssessment';
import TriageQueue from './screens/TriageQueue';
import Capacity from './screens/Capacity';
import PrioritisedRanking from './screens/PrioritisedRanking';
import PlanOnAPage from './screens/PlanOnAPage';
import BoardPack from './screens/BoardPack';
import Settings from './screens/Settings';

const ROLES: Role[] = ['Requester', 'Delivery Ops', 'Portfolio Delivery', 'POB'];
const PERMISSIONS: Permission[] = ['Viewer', 'Reviewer', 'Admin'];

type NavItem = { screen: Screen; label: string; roles: Role[] };
const NAV_ITEMS: NavItem[] = [
  { screen: 'portfolio',    label: 'Portfolio overview',    roles: ['Requester', 'Delivery Ops', 'Portfolio Delivery', 'POB'] },
  { screen: 'idea',         label: 'Submit an idea',        roles: ['Requester'] },
  { screen: 'new-request',  label: 'Full request',          roles: ['Requester', 'Delivery Ops', 'Portfolio Delivery'] },
  { screen: 'arbitration',  label: 'Arbitration & ideas',   roles: ['Delivery Ops'] },
  { screen: 'pob-assessment',label: 'New work assessment',  roles: ['POB'] },
  { screen: 'triage',       label: 'Triage queue',          roles: ['Portfolio Delivery'] },
  { screen: 'capacity',     label: 'Capacity & contention', roles: ['Delivery Ops', 'Portfolio Delivery'] },
  { screen: 'ranking',      label: 'Prioritised ranking',   roles: ['Portfolio Delivery'] },
  { screen: 'plan',         label: 'Plan on a page',        roles: ['Portfolio Delivery'] },
  { screen: 'board',        label: 'Board pack',            roles: ['Portfolio Delivery', 'POB'] },
  { screen: 'settings',     label: 'Settings',              roles: [] },
];

// Screens each permission level can always reach, regardless of the active role.
// Viewer is deliberately narrow; Reviewer and Admin see everything (Admin also gets Settings).
const PERMISSION_SCREENS: Record<Permission, Screen[]> = {
  Viewer: ['portfolio', 'ranking'],
  Reviewer: NAV_ITEMS.filter(n => n.screen !== 'settings').map(n => n.screen),
  Admin: NAV_ITEMS.map(n => n.screen),
};

const SCREEN_TITLES: Record<Screen, string> = {
  'portfolio':      'Portfolio overview',
  'idea':           'Submit an idea',
  'new-request':    'New request',
  'arbitration':    'Arbitration queue',
  'pob-assessment': 'New work assessment',
  'triage':         'Triage queue',
  'capacity':       'Capacity & contention',
  'ranking':        'Prioritised ranking',
  'plan':           'Plan on a page',
  'board':          'Board pack',
  'settings':       'Settings',
};

function AppShell() {
  const { role, setRole, permission, setPermission, currentScreen, navigateTo, initiatives } = useApp();

  // Permission level is the access-control gate for navigation: Viewer is capped to
  // portfolio + ranking, Reviewer sees every functional screen, Admin adds Settings on
  // top. Role stays a separate, permission-independent dimension (defaults and labels).
  const permissionAllowed = PERMISSION_SCREENS[permission];
  const visibleNav = NAV_ITEMS.filter(n => permissionAllowed.includes(n.screen));

  const screenOk = visibleNav.some(n => n.screen === currentScreen);
  useEffect(() => {
    if (!screenOk) navigateTo('portfolio');
  }, [screenOk, navigateTo]);

  const awaitingArbitration = initiatives.filter(i => i.stage === 'Awaiting arbitration' || i.stage === 'Idea capture').length;
  const awaitingPOB = initiatives.filter(i => i.stage === 'Awaiting POB assessment').length;
  const awaitingTriage = initiatives.filter(i => i.stage === 'Idea or request').length;

  function badge(screen: Screen) {
    if (screen === 'arbitration')   return awaitingArbitration;
    if (screen === 'pob-assessment') return awaitingPOB;
    if (screen === 'triage')        return awaitingTriage;
    return 0;
  }

  function renderScreen() {
    switch (currentScreen) {
      case 'portfolio':     return <Portfolio />;
      case 'idea':          return <IdeaCapture />;
      case 'new-request':   return <NewRequest />;
      case 'arbitration':   return <Arbitration />;
      case 'pob-assessment':return <POBAssessment />;
      case 'triage':        return <TriageQueue />;
      case 'capacity':      return <Capacity />;
      case 'ranking':       return <PrioritisedRanking />;
      case 'plan':          return <PlanOnAPage />;
      case 'board':         return <BoardPack />;
      case 'settings':      return <Settings />;
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#F3F4F6]">
      {/* Top bar */}
      <header className="h-12 bg-[#0E2841] text-white flex items-center px-4 gap-4 shrink-0 z-20">
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-base tracking-tight">e.surv</span>
          <span className="w-px h-4 bg-white/20" />
          <span className="text-xs text-white/70 font-medium">Work Ingestion &amp; Planning</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {/* Role switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/40 uppercase tracking-wide font-semibold hidden xl:inline">Role</span>
            <div className="flex bg-white/10 rounded-full p-0.5 gap-0.5">
              {ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
                    role === r ? 'bg-white text-[#0E2841]' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {/* Permission switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/40 uppercase tracking-wide font-semibold hidden xl:inline">Access</span>
            <div className="flex bg-white/10 rounded-full p-0.5 gap-0.5">
              {PERMISSIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setPermission(p)}
                  className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
                    permission === p ? 'bg-white text-[#0E2841]' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => navigateTo(role === 'Requester' ? 'idea' : 'new-request')}
            className="text-xs font-semibold bg-[#E3018C] hover:bg-[#c90178] text-white px-4 py-1.5 rounded transition-colors"
          >
            {role === 'Requester' ? '+ Submit idea' : '+ New request'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left nav */}
        <nav className="w-52 bg-white border-r border-[#E4E7EA] shrink-0 flex flex-col py-3 overflow-y-auto">
          {visibleNav.map(item => {
            const active = currentScreen === item.screen;
            const b = badge(item.screen);
            return (
              <button
                key={item.screen}
                onClick={() => navigateTo(item.screen)}
                className={`relative w-full text-left text-xs font-medium px-4 py-2.5 transition-colors flex items-center justify-between gap-2 ${
                  active ? 'bg-[#E8EEF4] text-[#0E2841] font-semibold' : 'text-gray-500 hover:bg-[#F3F4F6] hover:text-gray-800'
                }`}
              >
                {active && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0E2841] rounded-r" />}
                <span>{item.label}</span>
                {b > 0 && (
                  <span className="bg-[#E3018C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {b}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-base font-semibold text-[#0E2841]">{SCREEN_TITLES[currentScreen]}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{role} · {permission} access</p>
            </div>
          </div>
          {renderScreen()}
        </main>
      </div>

      <Drawer />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
