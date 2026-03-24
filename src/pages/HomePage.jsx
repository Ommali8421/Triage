import { useState } from 'react'
import NeumorphicCard from '../components/ui/NeumorphicCard'
import NeumorphicButton from '../components/ui/NeumorphicButton'
import { useLanguage } from '../context/LanguageContext'

const RECENT_PATIENTS = []

const QuickActionButton = ({ icon, label, onClick }) => {
    return (
        <NeumorphicButton
            onClick={onClick}
            style={{ flexDirection: 'column', gap: '8px', padding: '20px 10px', borderRadius: '20px', width: '100%' }}
        >
            <span style={{ fontSize: '28px' }}>{icon}</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>{label}</span>
        </NeumorphicButton>
    )
}

const HomePage = ({ onNavigate }) => {
    const { t } = useLanguage()
    const [showReportOptions, setShowReportOptions] = useState(false)
    const [reportData, setReportData] = useState(null)

    const QUICK_ACTIONS = [
        { icon: '🔄', label: t('home.sync_data') },
        { icon: '📝', label: t('home.new_triage') },
        { icon: '📊', label: t('home.generate_report') },
    ]

    const generateMockReport = (duration) => {
        let stats = {}
        if (duration === '1 Day') {
            stats = { screenings: 12, critical: 2, safe: 10, village: 'Khandala Rural', doctor: 'Dr. A. Sharma (CHW)' }
        } else if (duration === '1 Week') {
            stats = { screenings: 64, critical: 9, safe: 55, village: 'Khandala + 2 adjacent', doctor: 'Dr. A. Sharma (CHW)' }
        } else if (duration === '1 Month') {
            stats = { screenings: 215, critical: 28, safe: 187, village: 'District Block A', doctor: 'Dr. A. Sharma (CHW)' }
        } else {
            stats = { screenings: 1420, critical: 185, safe: 1235, village: 'District Base', doctor: 'Dr. A. Sharma (CHW)' }
        }
        setReportData({ duration, ...stats })
        setShowReportOptions(false)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Summary Card */}
            <NeumorphicCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>TODAY'S OVERVIEW</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                            <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>0</span>
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Screenings</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'var(--bg)',
                                boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
                                borderRadius: '12px',
                                padding: '8px 14px',
                            }}
                        >
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>0 Pending Syncs</span>
                        </div>
                        <div style={{ marginTop: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Last sync: 2h ago</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                    {[
                        { label: 'Critical', value: '0', color: 'var(--red-alert)' },
                        { label: 'Moderate', value: '0', color: '#ffc107' },
                        { label: 'Clear', value: '0', color: 'var(--green-alert)' },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            style={{
                                flex: 1,
                                textAlign: 'center',
                                background: 'var(--bg)',
                                boxShadow: 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)',
                                borderRadius: '14px',
                                padding: '10px 6px',
                            }}
                        >
                            <div style={{ fontSize: '22px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </NeumorphicCard>

            {/* Quick Actions */}
            <div>
                <p style={{ margin: '0 0 12px 4px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t('home.quick_actions')}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    {QUICK_ACTIONS.map((action) => (
                        <QuickActionButton 
                            key={action.label} 
                            {...action} 
                            onClick={() => {
                                if (action.label === t('home.new_triage')) onNavigate && onNavigate('triage');
                                if (action.label === t('home.generate_report')) setShowReportOptions(true);
                                if (action.label === t('home.sync_data')) alert('Syncing Data...');
                            }} 
                        />
                    ))}
                </div>
            </div>

            {/* Recent Patients */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {t('home.recent_activity')}
                    </p>
                    <button
                        onClick={() => onNavigate('patients')}
                        style={{ background: 'none', border: 'none', color: 'var(--green-alert)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        View All →
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {RECENT_PATIENTS.map((patient) => (
                        <NeumorphicCard key={patient.name} style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                {/* Avatar */}
                                <div
                                    style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '50%',
                                        background: 'var(--bg)',
                                        boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px',
                                        flexShrink: 0,
                                    }}
                                >
                                    👤
                                </div>
                                {/* Info */}
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{patient.name}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{patient.condition}</p>
                                </div>
                                {/* Status + Time */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <div
                                        style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: patient.status === 'green' ? 'var(--green-alert)' : 'var(--red-alert)',
                                            boxShadow: `0 0 8px ${patient.status === 'green' ? 'var(--green-alert)' : 'var(--red-alert)'}`,
                                        }}
                                    />
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{patient.time}</span>
                                </div>
                            </div>
                        </NeumorphicCard>
                    ))}
                </div>
            </div>

            {/* Modals for Report functionality */}
            {showReportOptions && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(218, 224, 230, 0.8)', padding: '20px' }}>
                    <NeumorphicCard style={{ width: '100%', maxWidth: '300px' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: 'var(--text-primary)', textAlign: 'center' }}>Generate Report</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {['1 Day', '1 Week', '1 Month', '1 Year'].map(dur => (
                                <button
                                    key={dur}
                                    onClick={() => generateMockReport(dur)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: 'var(--bg)',
                                        boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
                                        color: 'var(--text-primary)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {dur} Report
                                </button>
                            ))}
                            <button
                                onClick={() => setShowReportOptions(false)}
                                style={{ marginTop: '8px', padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--bg)', boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </NeumorphicCard>
                </div>
            )}

            {reportData && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(218, 224, 230, 0.9)', padding: '20px' }}>
                    <NeumorphicCard style={{ width: '100%', maxWidth: '340px' }}>
                        <div style={{ borderBottom: '2px solid var(--shadow-dark)', paddingBottom: '12px', marginBottom: '16px', textAlign: 'center' }}>
                            <h2 style={{ margin: '0 0 4px', fontSize: '20px', color: 'var(--text-primary)' }}>📊 {reportData.duration} Report</h2>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Generated for {reportData.village}</p>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>Doctor / CHW:</span>
                                <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700 }}>{reportData.doctor}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>Total Screenings:</span>
                                <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700 }}>{reportData.screenings}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>Safe (Green):</span>
                                <span style={{ color: 'var(--green-alert)', fontSize: '13px', fontWeight: 700 }}>{reportData.safe}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>Critical (Red):</span>
                                <span style={{ color: 'var(--red-alert)', fontSize: '13px', fontWeight: 700 }}>{reportData.critical}</span>
                            </div>
                            <div style={{ marginTop: '8px', padding: '12px', background: 'var(--bg)', borderRadius: '12px', boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)' }}>
                                <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>RECENT PATIENTS LOG (Preview)</span>
                                <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>• Ramkumar S. - Clear</div>
                                <div style={{ fontSize: '12px', color: 'var(--red-alert)' }}>• Bina Devi - Suspected TB</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>• Ashok M. - Clear</div>
                            </div>
                        </div>

                        <button
                            onClick={() => setReportData(null)}
                            style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--bg)', boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)', color: 'var(--green-alert)', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Close Report
                        </button>
                    </NeumorphicCard>
                </div>
            )}
        </div>
    )
}

export default HomePage
