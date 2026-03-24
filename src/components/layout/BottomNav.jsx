const NAV_ITEMS = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'patients', icon: '👥', label: 'Patients' },
    { id: 'triage', icon: '🟢', label: 'Triage', isCenter: true },
    { id: 'analytics', icon: '📊', label: 'Reports' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
]

import { useLanguage } from '../../context/LanguageContext'

const BottomNav = ({ activePage, onNavigate }) => {
    const { t } = useLanguage()

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '480px',
                height: '70px',
                background: 'var(--bg)',
                boxShadow: '0 -4px 20px rgba(163,177,198,0.5), 0 -1px 0 var(--shadow-light)',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '0 10px',
            }}
        >
            {NAV_ITEMS.map((item) => {
                if (item.isCenter) {
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            style={{
                                width: '62px',
                                height: '62px',
                                borderRadius: '50%',
                                background: 'var(--bg)',
                                border: 'none',
                                boxShadow:
                                    activePage === item.id
                                        ? 'inset 6px 6px 10px var(--shadow-dark), inset -6px -6px 10px var(--shadow-light)'
                                        : '9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                marginTop: '-28px',
                                transition: 'box-shadow 0.2s ease',
                                outline: 'none',
                                flexShrink: 0,
                            }}
                            aria-label={item.label}
                        >
                            <span style={{ fontSize: '22px', lineHeight: 1 }}>{item.icon}</span>
                            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                                {t(`nav.${item.id}`)}
                            </span>
                        </button>
                    )
                }

                const isActive = activePage === item.id
                return (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '6px 4px',
                            borderRadius: '14px',
                            outline: 'none',
                        }}
                        aria-label={item.label}
                    >
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'var(--bg)',
                                boxShadow: isActive
                                    ? 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)'
                                    : '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                transition: 'box-shadow 0.2s ease',
                            }}
                        >
                            {item.icon}
                        </div>
                        <span
                            style={{
                                fontSize: '10px',
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                transition: 'color 0.2s ease',
                            }}
                        >
                            {t(`nav.${item.id}`)}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

export default BottomNav
