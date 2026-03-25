import { useState, useEffect } from 'react'
import NeumorphicCard from '../components/ui/NeumorphicCard'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useLanguage } from '../context/LanguageContext'

const CHART_DATA = [
    { label: 'Mon', tb: 0, pneu: 0 },
    { label: 'Tue', tb: 0, pneu: 0 },
    { label: 'Wed', tb: 0, pneu: 0 },
    { label: 'Thu', tb: 0, pneu: 0 },
    { label: 'Fri', tb: 0, pneu: 0 },
    { label: 'Sat', tb: 0, pneu: 0 },
    { label: 'Sun', tb: 0, pneu: 0 },
]

const MAX_VAL = 8

const PressedDropdown = ({ value, options, onChange }) => (
    <div
        style={{
            background: 'var(--bg)',
            boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
            borderRadius: '50px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
        }}
    >
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                appearance: 'none',
            }}
        >
            {options.map((o) => <option key={o}>{o}</option>)}
        </select>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>▼</span>
    </div>
)

const AnalyticsPage = ({ userRole }) => {
    const { t } = useLanguage()
    const [period, setPeriod] = useState(t('analytics.this_week'))
    const [disease, setDisease] = useState(t('analytics.filter_all'))
    const [records, setRecords] = useState([])

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const backendBase = `http://${window.location.hostname}:5001`
                const res = await fetch(`${backendBase}/records`)
                if (res.ok) {
                    const data = await res.json()
                    setRecords(data)
                }
            } catch (err) {
                console.error("Failed to load records for heatmap", err)
            }
        }
        if (userRole === 'admin') {
            fetchRecords()
        }
    }, [userRole])

    if (userRole === 'admin') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
                <NeumorphicCard style={{ zIndex: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <p style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('analytics.epidemic_tracker')}</p>
                    <div style={{ flex: 1, minHeight: '400px', width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)', zIndex: 0 }}>
                        <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; OpenStreetMap contributors"
                            />
                            {records.map(r => {
                                if (!r.patient?.latitude || !r.patient?.longitude) return null;
                                const color = r.riskLevel === 'red' ? '#ff6b6b' : r.riskLevel === 'yellow' ? '#ffc107' : '#20c997';
                                return (
                                    <CircleMarker
                                        key={r.id}
                                        center={[r.patient.latitude, r.patient.longitude]}
                                        radius={8}
                                        pathOptions={{ fillColor: color, color: color, fillOpacity: 0.6 }}
                                    >
                                        <Popup>
                                            <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
                                                <strong>{r.patient.name || t('analytics.unknown')}</strong><br/>
                                                {t('analytics.risk_level')}: {r.riskLevel?.toUpperCase() || t('analytics.unknown')}<br/>
                                                {t('analytics.symptoms')}: {r.symptoms?.join(', ') || t('analytics.none')}
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                )
                            })}
                        </MapContainer>
                    </div>
                </NeumorphicCard>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <PressedDropdown
                    value={period}
                    options={[t('analytics.this_week'), t('analytics.this_month'), t('analytics.last_3_months'), t('analytics.this_year')]}
                    onChange={setPeriod}
                />
                <PressedDropdown
                    value={disease}
                    options={[t('analytics.filter_all'), t('analytics.tb_only'), t('analytics.pneumonia_only'), t('analytics.anemia')]}
                    onChange={setDisease}
                />
            </div>

            {/* Summary Chips */}
            <div style={{ display: 'flex', gap: '12px' }}>
                {[
                    { label: t('analytics.total_screens'), value: '0', icon: '🔬' },
                    { label: t('analytics.tb_alerts'), value: '0', icon: '🫁', color: 'var(--red-alert)' },
                    { label: t('analytics.pneumonia'), value: '0', icon: '💊', color: '#ffc107' },
                ].map((stat) => (
                    <NeumorphicCard key={stat.label} style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px' }}>{stat.icon}</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: stat.color || 'var(--text-primary)', marginTop: '4px' }}>{stat.value}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>{stat.label}</div>
                    </NeumorphicCard>
                ))}
            </div>

            {/* Bar Chart Card */}
            <NeumorphicCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('analytics.tb_vs_pneumonia')}</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '3px', background: 'var(--red-alert)' }} />
                            {t('analytics.tb_short')}
                        </span>
                        <span style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '3px', background: 'var(--green-alert)' }} />
                            {t('analytics.pneumonia_short')}
                        </span>
                    </div>
                </div>

                {/* Y-axis + Bars */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Y labels */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '20px', gap: '0' }}>
                        {[MAX_VAL, '', Math.floor(MAX_VAL / 2), '', 0].map((v, i) => (
                            <span key={i} style={{ fontSize: '9px', color: 'var(--text-secondary)', lineHeight: 1 }}>{v}</span>
                        ))}
                    </div>

                    {/* Bars */}
                    <div
                        style={{
                            flex: 1,
                            height: '160px',
                            borderRadius: '12px',
                            background: 'var(--bg)',
                            boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
                            padding: '10px 8px 0',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'space-around',
                            gap: '4px',
                        }}
                    >
                        {CHART_DATA.map((day) => (
                            <div key={day.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: 1 }}>
                                <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '120px' }}>
                                    {/* TB bar */}
                                    <div
                                        style={{
                                            width: '10px',
                                            height: `${(day.tb / MAX_VAL) * 120}px`,
                                            borderRadius: '4px 4px 0 0',
                                            background: 'linear-gradient(180deg, #ff8f8f, var(--red-alert))',
                                            boxShadow: '2px 2px 4px rgba(255,107,107,0.3), -1px -1px 3px rgba(255,255,255,0.5)',
                                            transition: 'height 0.5s ease',
                                        }}
                                    />
                                    {/* Pneumonia bar */}
                                    <div
                                        style={{
                                            width: '10px',
                                            height: `${(day.pneu / MAX_VAL) * 120}px`,
                                            borderRadius: '4px 4px 0 0',
                                            background: 'linear-gradient(180deg, #5fdfc9, var(--green-alert))',
                                            boxShadow: '2px 2px 4px rgba(32,201,151,0.3), -1px -1px 3px rgba(255,255,255,0.5)',
                                            transition: 'height 0.5s ease',
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', paddingBottom: '6px' }}>{t(`day.${day.label.toLowerCase()}`)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </NeumorphicCard>

            {/* Trend Card */}
            <NeumorphicCard>
                <p style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('analytics.weekly_trend')}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                        { label: t('analytics.tb_positivity'), value: '0%', trend: '-', bad: false },
                        { label: t('analytics.pneumonia_rate'), value: '0%', trend: '-', bad: false },
                        { label: t('analytics.avg_confidence'), value: '-', trend: '-', bad: false },
                    ].map((row) => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{row.label}</span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{row.value}</span>
                                <span
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: row.bad ? 'var(--red-alert)' : 'var(--green-alert)',
                                        padding: '2px 8px',
                                        borderRadius: '20px',
                                        background: 'var(--bg)',
                                        boxShadow: '2px 2px 5px var(--shadow-dark), -2px -2px 5px var(--shadow-light)',
                                    }}
                                >
                                    {row.trend}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </NeumorphicCard>

        </div>
    )
}

export default AnalyticsPage
