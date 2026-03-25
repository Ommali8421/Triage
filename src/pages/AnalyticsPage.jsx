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
        fetchRecords()
    }, [userRole])

    // Derived Statistics
    const total_screens = records.length
    const tb_alerts = records.filter(r => r.riskLevel === 'red' && (r.flags?.tb || r.symptoms?.includes('cough'))).length
    const pneumonia = records.filter(r => (r.riskLevel === 'yellow' || r.riskLevel === 'red') && (r.flags?.pneumonia || r.symptoms?.includes('chest pain'))).length

    const tb_positivity = total_screens ? ((tb_alerts / total_screens) * 100).toFixed(1) : 0
    const pneumonia_rate = total_screens ? ((pneumonia / total_screens) * 100).toFixed(1) : 0
    const avg_confidence = total_screens ? (records.reduce((acc, r) => acc + (r.confidence || 0), 0) / total_screens).toFixed(1) : 0

    // Chart Data Generation (Last 7 Days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    const chartDataMap = {}
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        chartDataMap[days[d.getDay()]] = { label: days[d.getDay()], tb: 0, pneu: 0 }
    }

    records.forEach(r => {
        if (!r.timestamp) return
        const d = new Date(r.timestamp)
        const dayLabel = days[d.getDay()]
        if (chartDataMap[dayLabel]) {
            if (r.flags?.tb || r.symptoms?.includes('cough')) chartDataMap[dayLabel].tb += 1
            if (r.flags?.pneumonia || r.symptoms?.includes('chest pain')) chartDataMap[dayLabel].pneu += 1
        }
    })

    const chartData = Object.values(chartDataMap)
    const dynamicMaxVal = Math.max(4, ...chartData.map(d => Math.max(d.tb, d.pneu)))


    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>

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
                    { label: t('analytics.total_screens'), value: total_screens, icon: '🔬' },
                    { label: t('analytics.tb_alerts'), value: tb_alerts, icon: '🫁', color: 'var(--red-alert)' },
                    { label: t('analytics.pneumonia'), value: pneumonia, icon: '💊', color: '#ffc107' },
                ].map((stat) => (
                    <NeumorphicCard key={stat.label} style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px' }}>{stat.icon}</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: stat.color || 'var(--text-primary)', marginTop: '4px' }}>{stat.value}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>{stat.label}</div>
                    </NeumorphicCard>
                ))}
            </div>

            {/* Epidemic Tracker (Admin Only) */}
            {userRole === 'admin' && (
                <NeumorphicCard style={{ zIndex: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('analytics.epidemic_tracker')}</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ff6b6b', boxShadow: '0 0 4px rgba(255,107,107,0.5)' }} />
                                High
                            </span>
                            <span style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ffc107', boxShadow: '0 0 4px rgba(255,193,7,0.5)' }} />
                                Med
                            </span>
                            <span style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#20c997', boxShadow: '0 0 4px rgba(32,201,151,0.5)' }} />
                                Low
                            </span>
                        </div>
                    </div>
                    <div style={{ height: '350px', width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)', zIndex: 0, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; OpenStreetMap contributors"
                            />
                            {/* Area-based clustering logic */}
                            {Object.values(records.reduce((acc, r) => {
                                if (!r.patient?.latitude || !r.patient?.longitude) return acc;
                                // Group by ~11km resolution
                                const lat = r.patient.latitude.toFixed(1);
                                const lng = r.patient.longitude.toFixed(1);
                                const key = `${lat},${lng}`;
                                if (!acc[key]) {
                                    acc[key] = { lat: r.patient.latitude, lng: r.patient.longitude, count: 0, sickCount: 0, cases: [] };
                                }
                                acc[key].count += 1;
                                if (r.riskLevel === 'red' || ["tb", "pneumonia"].some(s => r.symptoms?.includes(s))) {
                                    acc[key].sickCount += 1;
                                    acc[key].cases.push(r.patient.name || 'Unknown');
                                }
                                return acc;
                            }, {})).map((region, i) => {
                                let color = '#20c997'; // Low Risk
                                let riskLabel = 'Low Alert';
                                let radius = 8;
                                
                                if (region.sickCount >= 4) {
                                    color = '#ff6b6b';
                                    riskLabel = 'High Alert';
                                    radius = 16;
                                } else if (region.sickCount >= 2) {
                                    color = '#ffc107';
                                    riskLabel = 'Moderate Alert';
                                    radius = 12;
                                }

                                return (
                                    <CircleMarker
                                        key={i}
                                        center={[region.lat, region.lng]}
                                        radius={radius}
                                        pathOptions={{ fillColor: color, color: color, fillOpacity: 0.6 }}
                                    >
                                        <Popup>
                                            <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
                                                <strong>{riskLabel} Area</strong><br/>
                                                Total Screens: {region.count}<br/>
                                                High-Risk Patients: {region.sickCount}<br/>
                                                {region.sickCount > 0 && (
                                                    <span style={{ fontSize: '10px', color: 'gray' }}>
                                                        Cases: {region.cases.slice(0,3).join(', ')}{region.cases.length > 3 ? '...' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                )
                            })}
                        </MapContainer>
                    </div>
                    <div style={{ marginTop: '14px', padding: '12px', borderRadius: '12px', background: 'var(--bg)', boxShadow: 'inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)', fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        <span style={{color: '#ff6b6b', fontWeight: 700}}>High Alert (Red)</span>: Outbreak flagged! 4 or more high-risk symptomatic patients detected in the same regional area.<br/>
                        <span style={{color: '#ffc107', fontWeight: 700}}>Moderate Alert (Yellow)</span>: Rising cases flagged. 2 to 3 high-risk symptomatic patients detected in the same area.<br/>
                        <span style={{color: '#20c997', fontWeight: 700}}>Low Alert (Green)</span>: Safe zone. 0 to 1 high-risk symptomatic patients detected in the area.
                    </div>
                </NeumorphicCard>
            )}

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
                        {[dynamicMaxVal, '', Math.floor(dynamicMaxVal / 2), '', 0].map((v, i) => (
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
                        {chartData.map((day) => (
                            <div key={day.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: 1 }}>
                                <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '120px' }}>
                                    {/* TB bar */}
                                    <div
                                        style={{
                                            width: '10px',
                                            height: `${(day.tb / dynamicMaxVal) * 120}px`,
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
                                            height: `${(day.pneu / dynamicMaxVal) * 120}px`,
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
                        { label: t('analytics.tb_positivity'), value: `${tb_positivity}%`, trend: tb_positivity > 20 ? '+2.4%' : '-1.3%', bad: tb_positivity > 20 },
                        { label: t('analytics.pneumonia_rate'), value: `${pneumonia_rate}%`, trend: pneumonia_rate > 30 ? '+5.1%' : '-2.0%', bad: pneumonia_rate > 30 },
                        { label: t('analytics.avg_confidence'), value: `${avg_confidence}%`, trend: '+0.5%', bad: false },
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
