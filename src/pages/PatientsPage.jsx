import { useState, useEffect } from 'react'
import NeumorphicCard from '../components/ui/NeumorphicCard'
import { generateTriagePDF } from '../utils/pdfGenerator'
import { useLanguage } from '../context/LanguageContext'

const RiskBadge = ({ risk }) => {
    const { t } = useLanguage()
    const color = risk === 'red' ? 'var(--red-alert)' : risk === 'yellow' ? '#f5a623' : 'var(--green-alert)'
    const label = risk === 'red' ? t('patients.risk_high') : risk === 'yellow' ? t('patients.risk_mod') : t('patients.risk_clear')
    return (
        <span style={{
            fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
            background: 'var(--bg)', boxShadow: '2px 2px 5px var(--shadow-dark), -2px -2px 5px var(--shadow-light)',
            color,
        }}>
            {label}
        </span>
    )
}

const PatientCard = ({ record, onDelete }) => {
    const { t } = useLanguage()
    const [expanded, setExpanded] = useState(false)
    const date = new Date(record.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    const time = new Date(record.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

    return (
        <NeumorphicCard style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Avatar */}
                <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg)',
                    boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0,
                }}>
                    {record.riskLevel === 'red' ? '🔴' : record.riskLevel === 'yellow' ? '🟡' : '🟢'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {record.patient?.name || 'Unknown'}
                        </p>
                        <RiskBadge risk={record.riskLevel} />
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {t('patients.age')} {record.patient?.age || '—'} · {record.patient?.gender === 'M' ? t('patients.male') : record.patient?.gender === 'F' ? t('patients.female') : t('patients.other')}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {date} {time} · {t('patients.confidence')}: {record.confidence}%
                    </p>
                </div>
            </div>

            {/* Expand Toggle */}
            <button
                onClick={() => setExpanded(e => !e)}
                style={{ width: '100%', marginTop: '12px', padding: '8px', borderRadius: '10px', border: 'none', background: 'var(--bg)', boxShadow: 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
            >
                {expanded ? t('patients.hide_details') : t('patients.view_details')}
            </button>

            {expanded && (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* AI breakdown */}
                    {record.analyzeResult && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--bg)', boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)' }}>
                                <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>🎙️ Cough</p>
                                <p style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 800, color: record.analyzeResult.cough.risk === 'red' ? 'var(--red-alert)' : 'var(--green-alert)' }}>
                                    {record.analyzeResult.cough.label}
                                </p>
                                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>{record.analyzeResult.cough.confidence.toFixed(1)}%</p>
                            </div>
                            <div style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--bg)', boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)' }}>
                                <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>👁️ Eye Scan</p>
                                <p style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 800, color: record.analyzeResult.eye.risk === 'red' ? 'var(--red-alert)' : 'var(--green-alert)' }}>
                                    {record.analyzeResult.eye.label}
                                </p>
                                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>{record.analyzeResult.eye.confidence.toFixed(1)}%</p>
                            </div>
                        </div>
                    )}

                    {/* Clinical Assessment (from Pathways) */}
                    {record.clinicalDecision && record.clinicalDecision.length > 0 && (
                        <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg)', boxShadow: 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)' }}>
                            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {t('patients.clinical_assessment')}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {record.clinicalDecision.map((item, idx) => {
                                    const uColor = item.urgency === 'emergency' ? 'var(--red-alert)' : item.urgency === 'urgent' ? '#f5a623' : 'var(--green-alert)'
                                    return (
                                        <div key={idx} style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg)', boxShadow: '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)' }}>
                                            <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: uColor }}>{item.assessment}</p>
                                            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.4 }}>→ {item.action}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Summary text */}
                    {record.analyzeResult?.summary && (
                        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg)', boxShadow: 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                                "{record.analyzeResult.summary}"
                            </p>
                        </div>
                    )}

                    {/* Eye image preview */}
                    {record.visionPreview && (
                        <img src={record.visionPreview} alt="Eye capture" style={{ width: '100%', borderRadius: '12px', boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)' }} />
                    )}

                    {/* Non-diagnostic disclaimer */}
                    <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
                        {t('patients.non_diagnostic')}
                    </p>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button
                            onClick={() => generateTriagePDF(record, t)}
                            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: 'var(--blue-brand)', color: 'white', fontSize: '11px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px rgba(41, 128, 185, 0.4)' }}
                        >
                            {t('patients.download_pdf')}
                        </button>
                        <button
                            onClick={() => onDelete(record.id)}
                            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: 'var(--bg)', boxShadow: '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)', color: 'var(--red-alert)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            {t('patients.delete_record')}
                        </button>
                    </div>
                </div>
            )}
        </NeumorphicCard>
    )
}

const PatientsPage = ({ userRole, userName }) => {
    const { t } = useLanguage()
    const [query, setQuery] = useState('')
    const [patients, setPatients] = useState([])

    useEffect(() => {
        const load = async () => {
            try {
                const backendBase = `http://${window.location.hostname}:5001`
                const res = await fetch(`${backendBase}/records`)
                if (!res.ok) throw new Error('Network response was not ok')
                const data = await res.json()
                
                let viewableData = data
                if (userRole !== 'admin') {
                    viewableData = data.filter(r => r.workerId === userName)
                }

                setPatients(viewableData)
                // Cache locally for offline fallback
                localStorage.setItem('triage_records', JSON.stringify(viewableData))
            } catch (err) {
                console.error("Failed to load records from backend:", err)
                // Fallback to local storage
                const localData = JSON.parse(localStorage.getItem('triage_records') || '[]')
                
                let viewableData = localData
                if (userRole !== 'admin') {
                    viewableData = localData.filter(r => r.workerId === userName)
                }
                setPatients(viewableData)
            }
        }
        load()
    }, [userName, userRole])

    const handleDelete = async (id) => {
        if (!window.confirm(t('patients.confirm_delete'))) return;
        
        try {
            const backendBase = `http://${window.location.hostname}:5001`
            await fetch(`${backendBase}/records/${id}`, { method: 'DELETE' })
            
            const updated = patients.filter(p => p.id !== id)
            setPatients(updated)
            localStorage.setItem('triage_records', JSON.stringify(updated))
        } catch (err) {
            console.error("Failed to delete record:", err)
            alert("Error deleting record from server. Please try again.")
        }
    }

    const filtered = patients.filter(p =>
        (p.patient?.name || '').toLowerCase().includes(query.toLowerCase())
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg)', boxShadow: 'inset 6px 6px 10px var(--shadow-dark), inset -6px -6px 10px var(--shadow-light)', borderRadius: '50px', padding: '10px 18px' }}>
                <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>🔍</span>
                <input
                    type="text"
                    placeholder={t('patients.search_placeholder')}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}
                />
                {query && (
                    <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '14px' }}>✕</button>
                )}
            </div>

            {/* Count */}
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {filtered.length} {t('patients.records_found')}
            </p>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered.map(record => (
                    <PatientCard key={record.id} record={record} onDelete={handleDelete} />
                ))}

                {patients.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                        <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600 }}>{t('patients.no_records_yet')}</p>
                        <p style={{ margin: 0, fontSize: '13px' }}>{t('patients.complete_triage')}</p>
                    </div>
                )}

                {patients.length > 0 && filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                        <p style={{ margin: 0, fontSize: '14px' }}>{t('patients.no_results_for').replace('{{query}}', query)}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PatientsPage
