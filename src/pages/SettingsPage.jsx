import { useState } from 'react'
import NeumorphicCard from '../components/ui/NeumorphicCard'
import NeumorphicToggle from '../components/ui/NeumorphicToggle'
import NeumorphicProgressBar from '../components/ui/NeumorphicProgressBar'
import { useLanguage } from '../context/LanguageContext'

const TOGGLES = [
    { id: 'offline', label: 'Offline Sync Manager', icon: '📶', desc: 'Auto-sync when network is available', default: true },
    { id: 'bluetooth', label: 'Bluetooth Mesh Syncing', icon: '🔵', desc: 'Peer-to-peer data sharing nearby', default: false },
    { id: 'cloud', label: 'Connect to Cloud', icon: '☁️', desc: 'Upload to national health registry', default: true },
    { id: 'alerts', label: 'Push Alert Notifications', icon: '🔔', desc: 'Real-time critical case notifications', default: true },
]

const SettingsPage = ({ isDarkMode, toggleDarkMode, onLogout }) => {
    const [toggleStates, setToggleStates] = useState(
        Object.fromEntries(TOGGLES.map((t) => [t.id, t.default]))
    )
    const [alertPressed, setAlertPressed] = useState(false)
    const { language, setLanguage, t } = useLanguage()

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Profile Card */}
            <NeumorphicCard style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'var(--bg)',
                        boxShadow: '6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        flexShrink: 0,
                    }}
                >
                    🩺
                </div>
                <div>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Dr. Priya Sharma</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>CHW ID: #TZ-2089 · Rampur PHC</p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        <span
                            style={{
                                fontSize: '10px',
                                padding: '3px 10px',
                                borderRadius: '20px',
                                background: 'var(--bg)',
                                boxShadow: '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)',
                                color: 'var(--green-alert)',
                                fontWeight: 600,
                            }}
                        >
                            ✓ Certified
                        </span>
                        <span
                            style={{
                                fontSize: '10px',
                                padding: '3px 10px',
                                borderRadius: '20px',
                                background: 'var(--bg)',
                                boxShadow: '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)',
                                color: 'var(--text-secondary)',
                                fontWeight: 600,
                            }}
                        >
                            🏥 Jharkhand
                        </span>
                    </div>
                </div>
            </NeumorphicCard>

            {/* Storage Card */}
            <NeumorphicCard>
                <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    💾 Local Storage
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>DB Usage</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>45</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>MB / 1 GB</span>
                    </div>
                </div>
                <NeumorphicProgressBar value={4.5} color="var(--green-alert)" height={14} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                    {[
                        { label: 'Audio Files', size: '28MB', icon: '🎙️' },
                        { label: 'Images', size: '12MB', icon: '📸' },
                        { label: 'Records', size: '5MB', icon: '📋' },
                    ].map((item) => (
                        <div key={item.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '14px' }}>{item.icon}</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.size}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{item.label}</div>
                        </div>
                    ))}
                </div>
            </NeumorphicCard>

            {/* Language Selection */}
            <NeumorphicCard style={{ padding: '18px' }}>
                <p style={{ margin: '0 0 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    🌐 {t('settings.language')}
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {['en', 'hi', 'mr'].map((lang) => (
                        <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'var(--bg)',
                                boxShadow: language === lang
                                    ? 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)'
                                    : '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
                                color: language === lang ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: language === lang ? 700 : 500,
                                cursor: 'pointer',
                            }}
                        >
                            {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
                        </button>
                    ))}
                </div>
            </NeumorphicCard>

            {/* Toggles */}
            <NeumorphicCard style={{ padding: '18px' }}>
                <p style={{ margin: '0 0 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ⚙️ Connectivity & Appearance
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {/* Dark Mode Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0' }}>
                        <span style={{ fontSize: '22px', flexShrink: 0 }}>{isDarkMode ? '🌙' : '☀️'}</span>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Dark Mode</p>
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>Toggle application theme</p>
                        </div>
                        <NeumorphicToggle
                            defaultOn={isDarkMode}
                            onChange={() => toggleDarkMode()}
                        />
                    </div>
                    <div
                        style={{
                            height: '1px',
                            background: 'linear-gradient(90deg, transparent, var(--shadow-dark), transparent)',
                            opacity: 0.5,
                        }}
                    />
                    {TOGGLES.map((toggle, i) => (
                        <div key={toggle.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0' }}>
                                <span style={{ fontSize: '22px', flexShrink: 0 }}>{toggle.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{toggle.label}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>{toggle.desc}</p>
                                </div>
                                <NeumorphicToggle
                                    defaultOn={toggle.default}
                                    onChange={(v) => setToggleStates((s) => ({ ...s, [toggle.id]: v }))}
                                />
                            </div>
                            {i < TOGGLES.length - 1 && (
                                <div
                                    style={{
                                        height: '1px',
                                        background: 'linear-gradient(90deg, transparent, var(--shadow-dark), transparent)',
                                        opacity: 0.5,
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </NeumorphicCard>

            {/* App Info Card */}
            <NeumorphicCard style={{ padding: '14px 18px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    📱 App Info
                </p>
                {[
                    { label: 'App Version', value: 'v2.4.1' },
                    { label: 'Model Version', value: 'TZ-AI-v1.3' },
                    { label: 'Last Sync', value: '2h ago' },
                    { label: 'Network', value: '🔴 Offline' },
                ].map((row) => (
                    <div
                        key={row.label}
                        style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(163,177,198,0.2)' }}
                    >
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{row.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.value}</span>
                    </div>
                ))}
            </NeumorphicCard>

            {/* Logout Button */}
            <button
                onClick={onLogout}
                style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'var(--bg)',
                    boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'box-shadow 0.15s ease, transform 0.1s ease',
                }}
                onMouseDown={(e) => { e.currentTarget.style.boxShadow = 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)'; e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={(e) => { e.currentTarget.style.boxShadow = '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)'; e.currentTarget.style.transform = 'scale(1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)'; e.currentTarget.style.transform = 'scale(1)' }}
            >
                Log Out
            </button>

            {/* Force Red Alert Button */}
            <button
                onMouseDown={() => setAlertPressed(true)}
                onMouseUp={() => setAlertPressed(false)}
                onMouseLeave={() => setAlertPressed(false)}
                onTouchStart={() => setAlertPressed(true)}
                onTouchEnd={() => setAlertPressed(false)}
                style={{
                    width: '100%',
                    padding: '18px',
                    borderRadius: '20px',
                    border: 'none',
                    background: 'var(--bg)',
                    boxShadow: alertPressed
                        ? 'inset 6px 6px 10px var(--shadow-dark), inset -6px -6px 10px var(--shadow-light)'
                        : '9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light)',
                    color: 'var(--red-alert)',
                    fontSize: '15px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'box-shadow 0.15s ease, transform 0.1s ease',
                    transform: alertPressed ? 'scale(0.97)' : 'scale(1)',
                    outline: 'none',
                }}
            >
                🚨 FORCE RED ALERT (Protocol Override)
            </button>

            {/* Danger Zone */}
            <NeumorphicCard style={{ padding: '14px 18px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 600, color: 'var(--red-alert)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ⚠ Danger Zone
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {['Clear Local Cache', 'Factory Reset App', 'Revoke Device Auth'].map((action) => (
                        <button
                            key={action}
                            style={{
                                padding: '12px 16px',
                                borderRadius: '14px',
                                border: 'none',
                                background: 'var(--bg)',
                                boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)',
                                color: 'var(--text-secondary)',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif',
                                textAlign: 'left',
                            }}
                        >
                            {action}
                        </button>
                    ))}
                </div>
            </NeumorphicCard>

            <div style={{ height: '10px' }} />
        </div>
    )
}

export default SettingsPage
