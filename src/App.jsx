import { useState, useEffect } from 'react'
import './index.css'
import TopHeader from './components/layout/TopHeader'
import BottomNav from './components/layout/BottomNav'
import HomePage from './pages/HomePage'
import PatientsPage from './pages/PatientsPage'
import TriagePage from './pages/TriagePage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import VoiceAssistantPage from './pages/VoiceAssistantPage'
import AnalyticsPage from './pages/AnalyticsPage'

import { LanguageProvider, useLanguage } from './context/LanguageContext'

function AppContent() {
  const { t } = useLanguage()
  
  const PAGE_TITLES = {
    home: t('nav.home'),
    patients: t('nav.patients'),
    triage: t('nav.triage'),
    voice: t('nav.voice'),
    analytics: t('nav.analytics'),
    settings: t('nav.settings'),
  }

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('chw')
  const [userName, setUserName] = useState('')
  const [activePage, setActivePage] = useState('home')
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  const renderPage = () => {
    switch (activePage) {
      case 'home': return <HomePage onNavigate={setActivePage} userRole={userRole} userName={userName} />
      case 'patients': return <PatientsPage userRole={userRole} userName={userName} />
      case 'triage': return <TriagePage userName={userName} />
      case 'voice': return <VoiceAssistantPage />
      case 'analytics': return <AnalyticsPage userRole={userRole} />
      case 'settings': return <SettingsPage isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} onLogout={() => { setIsLoggedIn(false); setUserRole('chw'); setUserName(''); setActivePage('home'); }} userRole={userRole} userName={userName} />
      default: return <HomePage onNavigate={setActivePage} userRole={userRole} userName={userName} />
    }
  }


  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        maxWidth: '480px',
        margin: '0 auto',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {!isLoggedIn ? (
        <LoginPage onLogin={(role, name) => { setIsLoggedIn(true); setUserRole(role); setUserName(name); }} />
      ) : (
        <>
          <TopHeader title={PAGE_TITLES[activePage]} />
          <div className="page-content" style={{ marginTop: '72px' }}>
            {renderPage()}
          </div>
          <BottomNav activePage={activePage} onNavigate={setActivePage} userRole={userRole} />
        </>
      )}
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App
