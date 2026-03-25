import { useState, useEffect, useRef } from 'react'
import Cropper from 'react-easy-crop'
import NeumorphicCard from '../components/ui/NeumorphicCard'
import NeumorphicProgressBar from '../components/ui/NeumorphicProgressBar'
import { useLanguage } from '../context/LanguageContext'
import { DISEASE_INFO } from '../utils/diseaseInfo'
import { generateTriagePDF } from '../utils/pdfGenerator'

// ─── Phase Step Header ────────────────────────────────────────────────────────
const PhaseHeader = ({ phases, currentPhase }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        {phases.map((label, i) => {
            const num = i + 1
            const isActive = num === currentPhase
            const isDone = num < currentPhase
            return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: i < phases.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: 'var(--bg)',
                            boxShadow: isActive
                                ? 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)'
                                : '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 700,
                            color: isDone ? 'var(--green-alert)' : isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            transition: 'all 0.3s ease',
                        }}>
                            {isDone ? '✓' : num}
                        </div>
                        <span style={{ fontSize: '8px', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isActive ? 700 : 400, width: '56px', textAlign: 'center', lineHeight: 1.2 }}>
                            {label}
                        </span>
                    </div>
                    {i < phases.length - 1 && (
                        <div style={{ flex: 1, height: '2px', background: isDone ? 'var(--green-alert)' : 'var(--shadow-dark)', borderRadius: '2px', marginBottom: '18px', transition: 'background 0.3s ease' }} />
                    )}
                </div>
            )
        })}
    </div>
)

// ─── AI Summary Card (reusable, non-diagnostic output) ────────────────────────
const AISummaryCard = ({ analyzeResult, riskLevel, confidence }) => {
    const { t } = useLanguage()
    const riskColor = riskLevel === 'red' ? 'var(--red-alert)' : riskLevel === 'yellow' ? '#f5a623' : 'var(--green-alert)'
    const riskGlow = riskLevel === 'red' ? 'rgba(255,107,107,0.2)' : riskLevel === 'yellow' ? 'rgba(255,193,7,0.2)' : 'rgba(32,201,151,0.2)'

    return (
        <NeumorphicCard>
            <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('triage.ai_result')}
            </p>

            {/* Risk Banner */}
            <div style={{
                padding: '18px', borderRadius: '16px', background: 'var(--bg)',
                boxShadow: `inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light), 0 0 20px ${riskGlow}`,
                textAlign: 'center', marginBottom: '14px',
            }}>
                <div style={{ fontSize: '44px', marginBottom: '8px' }}>
                    {riskLevel === 'red' ? '🚨' : riskLevel === 'yellow' ? '⚠️' : '✅'}
                </div>
                <div style={{
                    display: 'inline-block', padding: '5px 18px', borderRadius: '50px',
                    background: 'var(--bg)', boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
                    color: riskColor, fontSize: '14px', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '10px',
                }}>
                    {riskLevel === 'red' ? t('triage.risk_red') : riskLevel === 'yellow' ? t('triage.risk_yellow') : t('triage.risk_green')}
                </div>

                {/* Non-diagnostic summary */}
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {analyzeResult?.summary || (
                        riskLevel === 'red'
                            ? t('triage.summary_red')
                            : t('triage.summary_green')
                    )}
                </p>
            </div>

            {/* Dual Model Breakdown */}
            {analyzeResult && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'var(--bg)', boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>🎙️ {t('triage.model_cough')}</p>
                        <p style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: 800, color: analyzeResult.cough.risk === 'red' ? 'var(--red-alert)' : 'var(--green-alert)' }}>
                            {analyzeResult.cough.label}
                        </p>
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>{analyzeResult.cough.confidence.toFixed(1)}% {t('triage.confidence_val')}</p>
                    </div>
                    <div style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'var(--bg)', boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>👁️ {t('triage.model_eye')}</p>
                        <p style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: 800, color: analyzeResult.eye.risk === 'red' ? 'var(--red-alert)' : 'var(--green-alert)' }}>
                            {analyzeResult.eye.label}
                        </p>
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>{analyzeResult.eye.confidence.toFixed(1)}% {t('triage.confidence_val')}</p>
                    </div>
                </div>
            )}

            {/* Confidence Bar */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{t('triage.label.overall_confidence')}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: riskColor }}>{confidence}%</span>
                </div>
                <NeumorphicProgressBar value={parseFloat(confidence)} color={riskColor} height={12} />
            </div>
        </NeumorphicCard>
    )
}

// ─── Main TriagePage ──────────────────────────────────────────────────────────
const TriagePage = ({ userName }) => {
    const { t } = useLanguage()

    const PHASES = [
        `🪪 ${t('triage.phase.intake_short') || 'Intake'}`,
        `🔬 ${t('triage.phase.capture_short') || 'Capture'}`,
        `📋 ${t('triage.phase.clinical_short') || 'Clinical'}`,
        `💾 ${t('triage.phase.save_short') || 'Save'}`,
    ]

    // ── Phase & Navigation ──
    const [phase, setPhase] = useState(1)
    const [subStep, setSubStep] = useState('2A') // '2A' | '2B' | '2C' | 'analyzing'

    // ── Phase 1: Patient Info ──
    const [patientInfo, setPatientInfo] = useState({ name: '', age: '', gender: 'M', pincode: '', latitude: null, longitude: null })

    // ── Phase 2: Audio ──
    const [recording, setRecording] = useState(false)
    const [audioProgress, setAudioProgress] = useState(0)
    const [audioFile, setAudioFile] = useState(null)
    const [audioUploaded, setAudioUploaded] = useState(false)
    const [audioPreview, setAudioPreview] = useState(null)
    const canvasRef = useRef(null)
    const audioCtxRef = useRef(null)
    const analyserRef = useRef(null)
    const animationRef = useRef(null)
    const timerRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])
    const audioInputRef = useRef(null)

    // ── Phase 2: Vision ──
    const [visionFile, setVisionFile] = useState(null)
    const [visionPreview, setVisionPreview] = useState(null)
    const [, setVisionUploaded] = useState(false)
    const [imageToCrop, setImageToCrop] = useState(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const visionInputRef = useRef(null)
    const cameraInputRef = useRef(null)

    // ── Phase 2C: AI Results ──
    const [analyzeResult, setAnalyzeResult] = useState(null)
    const [riskLevel, setRiskLevel] = useState(null)
    const [confidence, setConfidence] = useState(null)

    // ── Phase 3: Clinical Pathway ──
    const [clinicalAnswers, setClinicalAnswers] = useState({}) // { q1: true/false, q2: ... }
    const [clinicalDecision, setClinicalDecision] = useState(null) // { assessment, action, urgency }
    const toggleAnswer = (key) => setClinicalAnswers(prev => ({ ...prev, [key]: !prev[key] }))

    // Determine which pathway to use based on ML result
    const mlCoughSick = analyzeResult?.cough?.label === 'Sick'
    const mlEyeAnemic = analyzeResult?.eye?.label === 'Anemic'
    // If only one result, use it; if both, prefer the higher risk (cough=A, eye=B, both=A+B)
    const activePathway = (mlCoughSick && mlEyeAnemic) ? 'BOTH' : mlCoughSick ? 'A' : mlEyeAnemic ? 'B' : 'A' // fallback A

    const PATHWAY_A_QUESTIONS = [
        { key: 'a1', text: t('triage.clinical.q1') },
        { key: 'a2', text: t('triage.clinical.q2') },
        { key: 'a3', text: t('triage.clinical.q3') },
        { key: 'a4', text: t('triage.clinical.q4') },
        { key: 'a5', text: t('triage.clinical.q5') },
    ]
    const PATHWAY_B_QUESTIONS = [
        { key: 'b1', text: t('triage.clinical.qb1') },
        { key: 'b2', text: t('triage.clinical.qb2') },
        { key: 'b3', text: t('triage.clinical.qb3') },
    ]

    const computeDecision = () => {
        const a = clinicalAnswers
        const results = []

        if (activePathway === 'A' || activePathway === 'BOTH') {
            // IF [Q1=Yes] AND [Q2=Yes OR Q3=Yes] -> Active TB
            if (a.a1 && (a.a2 || a.a3))
                results.push({ key: 'tb', urgency: 'urgent' })
            // IF [Q4=Yes] AND [Q1=No] -> Pneumonia
            else if (a.a4 && !a.a1)
                results.push({ key: 'pneumonia', urgency: 'urgent' })
            // IF [Q5=Yes] AND [Q1=No] -> Flu
            else if (a.a5 && !a.a1)
                results.push({ key: 'flu', urgency: 'routine' })
            // IF [All Answers = No] -> Mild Cough
            else if (!a.a1 && !a.a2 && !a.a3 && !a.a4 && !a.a5)
                results.push({ key: 'mild_cough', urgency: 'routine' })
            else
                results.push({ key: 'mild_cough', urgency: 'routine' }) // Fallback for other combinations
        }

        if (activePathway === 'B' || activePathway === 'BOTH') {
            // IF [Q2=Yes] -> Acute Blood Loss
            if (a.b2)
                results.push({ key: 'acute_blood', urgency: 'emergency' })
            // IF [Q1=Yes OR Q3=Yes] -> Severe Symptomatic Anemia
            else if (a.b1 || a.b3)
                results.push({ key: 'severe_anemia', urgency: 'urgent' })
            // IF [All Answers = No] -> Mild Anemia
            else if (!a.b1 && !a.b2 && !a.b3)
                results.push({ key: 'mild_anemia', urgency: 'routine' })
            else
                results.push({ key: 'mild_anemia', urgency: 'routine' }) // Fallback
        }

        const order = ['emergency', 'urgent', 'routine']
        results.sort((x, y) => order.indexOf(x.urgency) - order.indexOf(y.urgency))
        
        const finalResults = results.map(r => ({
            ...r,
            assessment: t(`disease.${r.key}.name`),
            action: t(`disease.${r.key}.action`),
            precautions: t(`disease.${r.key}.precautions`),
            diet: t(`disease.${r.key}.diet`),
            suggestions: t(`disease.${r.key}.suggestions`)
        }))
        
        setClinicalDecision(finalResults)
        setPhase(4)
    }

    // ── Cleanup ──
    useEffect(() => () => {
        clearInterval(timerRef.current)
        if (audioPreview) URL.revokeObjectURL(audioPreview)
        if (visionPreview) URL.revokeObjectURL(visionPreview)
    }, [audioPreview, visionPreview])

    // ─────────────────────────────────────────────────────────────────────────
    // Audio Recording Logic
    // ─────────────────────────────────────────────────────────────────────────
    const toggleRecording = async () => {
        if (recording) {
            clearInterval(timerRef.current)
            if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
            if (audioCtxRef.current?.state !== 'closed') audioCtxRef.current.close().catch(console.error)
            setRecording(false)
            return
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
            const analyser = audioCtx.createAnalyser()
            analyser.fftSize = 256
            audioCtx.createMediaStreamSource(stream).connect(analyser)
            audioCtxRef.current = audioCtx
            analyserRef.current = analyser

            const drawSpectrogram = () => {
                if (!canvasRef.current || !analyserRef.current) return
                const canvas = canvasRef.current
                const ctx = canvas.getContext('2d')
                const bufferLength = analyserRef.current.frequencyBinCount
                const dataArray = new Uint8Array(bufferLength)
                analyserRef.current.getByteFrequencyData(dataArray)
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                const barWidth = (canvas.width / bufferLength) * 2.5
                let x = 0
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * canvas.height
                    ctx.fillStyle = `rgba(${barHeight + (25 * (i / bufferLength))}, ${250 * (i / bufferLength)}, 255, 0.8)`
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
                    x += barWidth + 1
                }
                animationRef.current = requestAnimationFrame(drawSpectrogram)
            }

            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                setAudioFile(audioBlob)
                setAudioPreview(URL.createObjectURL(audioBlob))
                setAudioUploaded(true)
                stream.getTracks().forEach(t => t.stop())
                audioCtxRef.current?.close().catch(console.error)
                if (animationRef.current) cancelAnimationFrame(animationRef.current)
            }

            mediaRecorder.start()
            setRecording(true)
            setAudioProgress(0)
            setAudioPreview(null)
            drawSpectrogram()

            let p = 0
            timerRef.current = setInterval(() => {
                p += 10
                setAudioProgress(p)
                if (p >= 100) {
                    clearInterval(timerRef.current)
                    if (mediaRecorder.state === 'recording') mediaRecorder.stop()
                    setRecording(false)
                }
            }, 1000)
        } catch { alert('Microphone access denied or unavailable.') }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Vision / Crop Logic
    // ─────────────────────────────────────────────────────────────────────────
    const handleFileUpload = (type, e) => {
        const file = e.target.files[0]
        if (!file) return
        if (type === 'audio') {
            setAudioFile(file); setAudioPreview(URL.createObjectURL(file))
            setAudioUploaded(true); setAudioProgress(100)
        } else if (type === 'vision') {
            setImageToCrop(URL.createObjectURL(file))
        }
        e.target.value = null
    }

    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = new Image()
        image.src = imageSrc
        await new Promise(resolve => { image.onload = resolve })
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = pixelCrop.width; canvas.height = pixelCrop.height
        ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
        return new Promise(resolve => {
            canvas.toBlob(blob => { blob.name = 'cropped_eye.jpg'; resolve(blob) }, 'image/jpeg')
        })
    }

    const handleCropComplete = async () => {
        if (!croppedAreaPixels) return
        try {
            const blob = await getCroppedImg(imageToCrop, croppedAreaPixels)
            setVisionFile(blob); setVisionPreview(URL.createObjectURL(blob))
            setVisionUploaded(true); setImageToCrop(null)
        } catch (e) { console.error(e) }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AI Analysis (Phase 2C)
    // ─────────────────────────────────────────────────────────────────────────
    const runAnalysis = () => {
        setSubStep('analyzing')
        const formData = new FormData()
        if (!audioFile) { alert('No audio file found'); setSubStep('2A'); return }
        formData.append('audio', audioFile, audioFile.name || 'recording.webm')

        // Use http (not https) because the Python backend doesn't have TLS
        const backendBase = `http://${window.location.hostname}:5001`

        if (visionFile) {
            formData.append('image', visionFile, visionFile.name || 'eye.jpg')
            formData.append('sex', patientInfo.gender || 'M')
            fetch(`${backendBase}/analyze`, { method: 'POST', body: formData })
                .then(async res => {
                    if (!res.ok) {
                        const text = await res.text()
                        console.error(`/analyze ${res.status}:`, text)
                        alert(`Server Error ${res.status}: ${text.slice(0, 200)}`)
                        setSubStep('2B'); return
                    }
                    return res.json()
                })
                .then(data => {
                    if (!data) return
                    if (data.detail) { alert('Analysis Error: ' + data.detail); setSubStep('2B'); return }
                    let overall = data.overall_risk
                    setAnalyzeResult(data)
                    setRiskLevel(overall)
                    setConfidence(Math.max(data.cough.confidence, data.eye.confidence).toFixed(1))
                    setSubStep('2C')
                })
                .catch(err => { console.error(err); alert('Failed to connect to ML server. Make sure the Python backend is running on port 5000.'); setSubStep('2B') })
        } else {
            fetch(`${backendBase}/predict`, { method: 'POST', body: formData })
                .then(async res => {
                    if (!res.ok) {
                        const text = await res.text()
                        console.error(`/predict ${res.status}:`, text)
                        alert(`Server Error ${res.status}: ${text.slice(0, 200)}`)
                        setSubStep('2A'); return
                    }
                    return res.json()
                })
                .then(data => {
                    if (!data) return
                    if (data.error) { alert('Analysis Error: ' + data.error); setSubStep('2A'); return }
                    let risk = data.risk; let conf = parseFloat(data.confidence).toFixed(1)
                    setAnalyzeResult(null); setRiskLevel(risk); setConfidence(conf)
                    setSubStep('2C')
                })
                .catch(err => { console.error(err); alert('Failed to connect to ML server.'); setSubStep('2A') })
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Save to Patients Records (Phase 4)
    // ─────────────────────────────────────────────────────────────────────────
    const saveRecord = async () => {
        const record = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            patient: patientInfo,
            workerId: userName,
            riskLevel,
            confidence,
            analyzeResult,
            clinicalDecision,
            clinicalAnswers,
            activePathway,
            visionPreview: visionPreview || null,
        }
        
        try {
            const backendBase = `http://${window.location.hostname}:5001`
            const res = await fetch(`${backendBase}/records`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            })
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            
            alert(`✅ ${t('triage.alert.saved_db')} ${patientInfo.name || 'Patient'}. ${t('home.view_all')}`)
            handleReset()
        } catch (err) {
            console.error('Failed to save record to DB:', err)
            // Fallback for offline mode
            const existing = JSON.parse(localStorage.getItem('triage_records') || '[]')
            localStorage.setItem('triage_records', JSON.stringify([record, ...existing]))
            alert(`⚠️ ${t('triage.alert.saved_local')} ${patientInfo.name || 'Patient'}.`)
            handleReset()
        }
    }

    const handleReset = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        audioCtxRef.current?.close().catch(console.error)
        setPhase(1); setSubStep('2A'); setRecording(false); setAudioProgress(0)
        setAudioFile(null); setAudioPreview(null); setAudioUploaded(false)
        setVisionFile(null); setVisionPreview(null); setVisionUploaded(false)
        setImageToCrop(null); setCrop({ x: 0, y: 0 }); setZoom(1); setCroppedAreaPixels(null)
        setAnalyzeResult(null); setRiskLevel(null); setConfidence(null)
        setPatientInfo({ name: '', age: '', gender: 'M', pincode: '', latitude: null, longitude: null })
        setClinicalAnswers({}); setClinicalDecision(null)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Phase Header */}
            <PhaseHeader phases={PHASES} currentPhase={phase} />

            {/* ══════════════════════════════════════════════════════════════
                PHASE 1 — Patient Intake
            ══════════════════════════════════════════════════════════════ */}
            {phase === 1 && (
                <>
                    <NeumorphicCard>
                        <p style={{ margin: '0 0 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            🪪 {t('triage.phase.intake')}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Name */}
                            <div style={{ background: 'var(--bg)', boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)', borderRadius: '12px', padding: '12px 16px' }}>
                                <input
                                    placeholder={t('triage.label.fullname')}
                                    value={patientInfo.name}
                                    onChange={e => setPatientInfo(p => ({ ...p, name: e.target.value }))}
                                    style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}
                                />
                            </div>

                            {/* Age + Pincode row */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1, background: 'var(--bg)', boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)', borderRadius: '12px', padding: '12px 16px' }}>
                                    <input
                                        type="number"
                                        placeholder={t('triage.label.age')}
                                        value={patientInfo.age}
                                        onChange={e => setPatientInfo(p => ({ ...p, age: e.target.value }))}
                                        style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}
                                    />
                                </div>
                                <div style={{ flex: 1, background: 'var(--bg)', boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)', borderRadius: '12px', padding: '12px 16px' }}>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder={t('triage.label.pincode')}
                                        maxLength={6}
                                        value={patientInfo.pincode}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                                            setPatientInfo(p => ({ ...p, pincode: val }))
                                        }}
                                        style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}
                                    />
                                </div>
                            </div>

                            {/* Location */}
                            <button
                                type="button"
                                onClick={() => {
                                    if ('geolocation' in navigator) {
                                        navigator.geolocation.getCurrentPosition(
                                            pos => setPatientInfo(p => ({ ...p, latitude: pos.coords.latitude, longitude: pos.coords.longitude })),
                                            () => alert('Location access denied or unavailable. You must allow location access to use this feature.')
                                        )
                                    } else {
                                        alert('Geolocation not supported by this browser.')
                                    }
                                }}
                                style={{
                                    padding: '12px', borderRadius: '12px', border: 'none',
                                    background: 'var(--bg)', boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
                                    color: patientInfo.latitude ? 'var(--green-alert)' : 'var(--text-primary)',
                                    fontWeight: 600, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                📍 {patientInfo.latitude ? `${t('triage.msg.location_captured')} (${patientInfo.latitude.toFixed(4)}, ${patientInfo.longitude.toFixed(4)})` : t('triage.btn.location')}
                            </button>

                            {/* Gender */}
                            <div>
                                <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('triage.label.gender')}</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {[{ label: t('patients.male'), val: 'M' }, { label: t('patients.female'), val: 'F' }, { label: t('patients.other'), val: 'O' }].map(g => (
                                        <button
                                            key={g.val}
                                            onClick={() => setPatientInfo(p => ({ ...p, gender: g.val }))}
                                            style={{
                                                flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
                                                background: 'var(--bg)',
                                                boxShadow: patientInfo.gender === g.val
                                                    ? 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)'
                                                    : '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
                                                color: patientInfo.gender === g.val ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                fontWeight: patientInfo.gender === g.val ? 700 : 500,
                                                cursor: 'pointer', fontSize: '13px',
                                            }}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </NeumorphicCard>

                    <button
                        onClick={() => { if (!patientInfo.name.trim()) { alert(t('triage.alert.name_required')); return } setPhase(2); setSubStep('2A') }}
                        style={{
                            width: '100%', padding: '16px', borderRadius: '20px', border: 'none',
                            background: 'var(--bg)', boxShadow: '9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light)',
                            color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        {t('triage.btn.start_diagnostic')}
                    </button>
                </>
            )}

            {/* ══════════════════════════════════════════════════════════════
                PHASE 2 — Multimodal Capture
            ══════════════════════════════════════════════════════════════ */}
            {phase === 2 && (
                <>
                    {/* Sub-step tabs */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[{ id: '2A', label: t('triage.tab.audio') }, { id: '2B', label: t('triage.tab.vision') }, { id: '2C', label: t('triage.tab.ai') }].map(s => (
                            <button
                                key={s.id}
                                onClick={() => { if (s.id === '2C' && !riskLevel) return; setSubStep(s.id) }}
                                style={{
                                    flex: 1, padding: '9px 4px', borderRadius: '12px', border: 'none',
                                    background: 'var(--bg)',
                                    boxShadow: subStep === s.id
                                        ? 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)'
                                        : '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)',
                                    color: subStep === s.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    fontWeight: subStep === s.id ? 700 : 500, cursor: 'pointer', fontSize: '11px',
                                    opacity: s.id === '2C' && !riskLevel ? 0.4 : 1,
                                }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* ── 2A: Audio Capture ── */}
                    {subStep === '2A' && (
                        <NeumorphicCard>
                            <p style={{ margin: '0 0 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                {t('triage.audio.title')}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <button
                                        onClick={toggleRecording}
                                        style={{
                                            width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg)', border: 'none',
                                            boxShadow: recording
                                                ? 'inset 6px 6px 12px var(--shadow-dark), inset -6px -6px 12px var(--shadow-light)'
                                                : '9px 9px 18px var(--shadow-dark), -9px -9px 18px var(--shadow-light)',
                                            cursor: 'pointer', fontSize: '28px', outline: 'none', position: 'relative',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        {recording ? '⏺️' : '🎙️'}
                                        {recording && (
                                            <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', border: '2px solid rgba(255,107,107,0.5)', animation: 'pulse 1s ease-in-out infinite' }} />
                                        )}
                                    </button>
                                    <span style={{ fontSize: '12px', color: 'var(--shadow-dark)', fontWeight: 600 }}>OR</span>
                                    <button
                                        onClick={() => audioInputRef.current?.click()}
                                        style={{
                                            width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg)', border: 'none',
                                            boxShadow: '9px 9px 18px var(--shadow-dark), -9px -9px 18px var(--shadow-light)',
                                            cursor: 'pointer', outline: 'none',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                        }}
                                    >
                                        <span style={{ fontSize: '24px' }}>📁</span>
                                        <span style={{ fontSize: '9px', color: 'var(--text-primary)', fontWeight: 600 }}>{t('triage.audio.upload')}</span>
                                    </button>
                                    <input type="file" accept="audio/*" ref={audioInputRef} style={{ display: 'none' }} onChange={e => handleFileUpload('audio', e)} />
                                </div>

                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                    {recording ? `${t('triage.audio.status_recording')} ${audioProgress}%` : audioUploaded ? t('triage.audio.status_uploaded') : t('triage.audio.tap_to_record')}
                                </p>
                                <div style={{ width: '100%' }}><NeumorphicProgressBar value={audioProgress} color="var(--red-alert)" /></div>

                                <div style={{ width: '100%', height: recording ? '60px' : '0px', transition: 'height 0.3s ease', overflow: 'hidden' }}>
                                    <canvas ref={canvasRef} width="300" height="60" style={{ width: '100%', height: '100%', borderRadius: '8px', background: 'var(--bg)', boxShadow: 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)' }} />
                                </div>
                                {audioPreview && <audio src={audioPreview} controls style={{ width: '100%', height: '36px', borderRadius: '18px' }} />}
                            </div>
                        </NeumorphicCard>
                    )}

                    {/* ── 2B: Vision Capture ── */}
                    {subStep === '2B' && (
                        <NeumorphicCard>
                            <p style={{ margin: '0 0 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                {t('triage.vision.title')}
                            </p>
                            {imageToCrop ? (
                                <div style={{ position: 'relative', width: '100%', height: '250px', borderRadius: '16px', overflow: 'hidden', boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)' }}>
                                    <Cropper
                                        image={imageToCrop} crop={crop} zoom={zoom} aspect={1}
                                        onCropChange={setCrop}
                                        onCropComplete={(_, cap) => setCroppedAreaPixels(cap)}
                                        onZoomChange={setZoom}
                                    />
                                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 10 }}>
                                        <button onClick={() => { setImageToCrop(null) }} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: 'var(--bg)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)' }}>
                                            {t('cancel')}
                                        </button>
                                        <button onClick={handleCropComplete} style={{ flex: 2, padding: '10px', borderRadius: '12px', border: 'none', background: 'var(--bg)', color: 'var(--green-alert)', cursor: 'pointer', fontWeight: 700, boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)' }}>
                                            {t('apply_crop')}
                                        </button>
                                    </div>
                                </div>
                            ) : visionPreview ? (
                                <div style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '9px 9px 18px var(--shadow-dark), -9px -9px 18px var(--shadow-light)' }}>
                                    <img src={visionPreview} alt="Eye preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                                    <button
                                        onClick={() => { setVisionPreview(null); setVisionUploaded(false) }}
                                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
                                    >✕</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div onClick={() => cameraInputRef.current?.click()} style={{ flex: 1, height: '120px', borderRadius: '16px', background: 'var(--bg)', boxShadow: 'inset 6px 6px 12px var(--shadow-dark), inset -6px -6px 12px var(--shadow-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <span style={{ fontSize: '32px' }}>📷</span>
                                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>{t('triage.vision.capture_cam')}</p>
                                    </div>
                                    <div onClick={() => visionInputRef.current?.click()} style={{ flex: 1, height: '120px', borderRadius: '16px', background: 'var(--bg)', boxShadow: '9px 9px 18px var(--shadow-dark), -9px -9px 18px var(--shadow-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <span style={{ fontSize: '28px' }}>📂</span>
                                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-primary)', textAlign: 'center', fontWeight: 600 }}>{t('triage.vision.upload_img')}</p>
                                    </div>
                                    <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: 'none' }} onChange={e => handleFileUpload('vision', e)} />
                                    <input type="file" accept="image/*" ref={visionInputRef} style={{ display: 'none' }} onChange={e => handleFileUpload('vision', e)} />
                                </div>
                            )}
                        </NeumorphicCard>
                    )}

                    {/* ── Analyzing spinner ── */}
                    {subStep === 'analyzing' && (
                        <NeumorphicCard style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div style={{ fontSize: '60px', marginBottom: '20px' }}>🧠</div>
                            <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('triage.msg.analyzing')}</p>
                            <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>{t('triage.msg.inference_engine')}</p>
                            <NeumorphicProgressBar value={65} color="var(--green-alert)" />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {['Audio FFT', 'Mel Spectrogram', 'Eye Pallor', 'Risk Model'].map(tag => (
                                    <span key={tag} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '20px', background: 'var(--bg)', boxShadow: '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        ✓ {tag}
                                    </span>
                                ))}
                            </div>
                        </NeumorphicCard>
                    )}

                    {/* ── 2C: AI Summary ── */}
                    {subStep === '2C' && riskLevel && (
                        <AISummaryCard analyzeResult={analyzeResult} riskLevel={riskLevel} confidence={confidence} />
                    )}

                    {/* Navigation Buttons */}
                    {subStep !== 'analyzing' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {/* Back */}
                            <button
                                onClick={() => {
                                    if (subStep === '2A') setPhase(1)
                                    else if (subStep === '2B') setSubStep('2A')
                                    else if (subStep === '2C') setSubStep('2B')
                                }}
                                style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--bg)', boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                            >← Back</button>

                            {/* Next / Run AI */}
                            {subStep === '2A' && (
                                <button
                                    onClick={() => setSubStep('2B')}
                                    disabled={!audioUploaded}
                                    style={{ flex: 2, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--bg)', boxShadow: audioUploaded ? '9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light)' : 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)', color: audioUploaded ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '14px', fontWeight: 700, cursor: audioUploaded ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif' }}
                                >
                                    {audioUploaded ? t('triage.btn.next_vision') : t('triage.btn.record_first')}
                                </button>
                            )}
                            {subStep === '2B' && (
                                <button
                                    onClick={runAnalysis}
                                    style={{ flex: 2, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--bg)', boxShadow: '9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light)', color: 'var(--green-alert)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                                >
                                    🔬 Run AI Analysis →
                                </button>
                            )}
                            {subStep === '2C' && (
                                <button
                                    onClick={() => setPhase(3)}
                                    style={{ flex: 2, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--bg)', boxShadow: '9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                                >
                                    {t('triage.btn.continue_clinical')}
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ══════════════════════════════════════════════════════════════
                PHASE 3 — Clinical Triage (ML-Driven Pathways)
            ══════════════════════════════════════════════════════════════ */}
            {phase === 3 && (
                <>
                    {/* AI Context banner */}
                    {riskLevel && (
                        <div style={{ padding: '12px 16px', borderRadius: '16px', background: 'var(--bg)', boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ fontSize: '28px' }}>{riskLevel === 'red' ? '🚨' : riskLevel === 'yellow' ? '⚠️' : '✅'}</div>
                            <div>
                                <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: riskLevel === 'red' ? 'var(--red-alert)' : riskLevel === 'yellow' ? '#f5a623' : 'var(--green-alert)', textTransform: 'uppercase' }}>
                                    {t('triage.label.ai_assessment')} {riskLevel === 'red' ? t('home.critical') : riskLevel === 'yellow' ? t('home.moderate') : t('home.clear')}
                                </p>
                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    {analyzeResult?.summary?.split('.')[0] || t('triage.label.answer_questions')}
                                </p>
                            </div>
                        </div>
                    )}


                    {/* Pathway A Questions */}
                    {(activePathway === 'A' || activePathway === 'BOTH') && (
                        <NeumorphicCard style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('triage.label.respiratory')}</p>
                            {PATHWAY_A_QUESTIONS.map(({ key, text }, i) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '12px 14px', borderRadius: '14px', background: 'var(--bg)', boxShadow: clinicalAnswers[key] ? 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)' : '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)', transition: 'box-shadow 0.2s ease' }}>
                                    <span style={{ flexShrink: 0, fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '2px' }}>Q{i + 1}</span>
                                    <p style={{ margin: 0, flex: 1, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>{text}</p>
                                    <button
                                        onClick={() => toggleAnswer(key)}
                                        style={{ flexShrink: 0, width: '52px', padding: '6px 0', borderRadius: '10px', border: 'none', background: 'var(--bg)', boxShadow: clinicalAnswers[key] ? 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)' : '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)', color: clinicalAnswers[key] ? 'var(--green-alert)' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s ease' }}
                                    >
                                        {clinicalAnswers[key] ? t('yes') : t('no')}
                                    </button>
                                </div>
                            ))}
                        </NeumorphicCard>
                    )}

                    {/* Pathway B Questions */}
                    {(activePathway === 'B' || activePathway === 'BOTH') && (
                        <NeumorphicCard style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('triage.label.systemic')}</p>
                            {PATHWAY_B_QUESTIONS.map(({ key, text }, i) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '12px 14px', borderRadius: '14px', background: 'var(--bg)', boxShadow: clinicalAnswers[key] ? 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)' : '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)', transition: 'box-shadow 0.2s ease' }}>
                                    <span style={{ flexShrink: 0, fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '2px' }}>Q{i + 1}</span>
                                    <p style={{ margin: 0, flex: 1, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>{text}</p>
                                    <button
                                        onClick={() => toggleAnswer(key)}
                                        style={{ flexShrink: 0, width: '52px', padding: '6px 0', borderRadius: '10px', border: 'none', background: 'var(--bg)', boxShadow: clinicalAnswers[key] ? 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)' : '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)', color: clinicalAnswers[key] ? 'var(--green-alert)' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s ease' }}
                                    >
                                        {clinicalAnswers[key] ? t('yes') : t('no')}
                                    </button>
                                </div>
                            ))}
                        </NeumorphicCard>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => { setPhase(2); setSubStep('2C') }} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--bg)', boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                            {t('back')}
                        </button>
                        <button onClick={computeDecision} style={{ flex: 2, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--bg)', boxShadow: '9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                            {t('triage.btn.get_assessment')}
                        </button>
                    </div>
                </>
            )}

            {/* ══════════════════════════════════════════════════════════════
                PHASE 4 — Finalization & Save
            ══════════════════════════════════════════════════════════════ */}
            {phase === 4 && (
                <>
                    {/* Patient Summary */}
                    <NeumorphicCard>
                        <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            🪪 Patient
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--bg)', boxShadow: '6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                                👤
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{patientInfo.name}</p>
                                <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    {t('patients.age')} {patientInfo.age} · {patientInfo.gender === 'M' ? t('patients.male') : patientInfo.gender === 'F' ? t('patients.female') : t('patients.other')}
                                </p>
                            </div>
                        </div>
                    </NeumorphicCard>

                    {/* AI Result Summary */}
                    {riskLevel && <AISummaryCard analyzeResult={analyzeResult} riskLevel={riskLevel} confidence={confidence} />}

                    {/* Clinical Decision Card */}
                    {clinicalDecision?.length > 0 && (
                        <NeumorphicCard style={{ padding: '18px' }}>
                            <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                📊 Clinical Assessment
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {clinicalDecision.map((item, idx) => {
                                    const uColor = item.urgency === 'emergency' ? 'var(--red-alert)' : item.urgency === 'urgent' ? '#f5a623' : 'var(--green-alert)'
                                    const uIcon = item.urgency === 'emergency' ? '🚨' : item.urgency === 'urgent' ? '⚠️' : '✅'
                                    const uLabel = item.urgency === 'emergency' ? t('triage.label.emergency') : item.urgency === 'urgent' ? t('triage.label.urgent') : t('triage.label.routine')
                                    return (
                                        <div key={idx} style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg)', boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)' }}>
                                            {/* Urgency badge */}
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '50px', background: 'var(--bg)', boxShadow: '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)', marginBottom: '10px' }}>
                                                <span style={{ fontSize: '12px' }}>{uIcon}</span>
                                                <span style={{ fontSize: '11px', fontWeight: 800, color: uColor, letterSpacing: '0.05em' }}>{uLabel}</span>
                                            </div>
                                            <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 700, color: uColor, lineHeight: 1.4 }}>{item.assessment}</p>
                                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>→ {item.action}</p>
                                        </div>
                                    )
                                })}
                            </div>
                            <p style={{ margin: '12px 0 0', fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                                {t('triage.footer_warning')}
                            </p>
                        </NeumorphicCard>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setPhase(3)} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--bg)', boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                            {t('back')}
                        </button>
                        <button onClick={saveRecord} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--bg)', boxShadow: '9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light)', color: 'var(--green-alert)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                            {t('triage.btn.save_triage')}
                        </button>
                    </div>

                    <button onClick={() => {
                        const recordForPdf = {
                            id: Date.now().toString(),
                            timestamp: new Date().toISOString(),
                            patient: patientInfo,
                            analyzeResult,
                            clinicalDecision
                        }
                        generateTriagePDF(recordForPdf, t)
                    }} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--blue-brand)', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 10px rgba(41, 128, 185, 0.4)' }}>
                        📄 {t('triage.btn.download_pdf')}
                    </button>

                    <button onClick={handleReset} style={{ width: '100%', padding: '12px', borderRadius: '14px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        🔄 {t('triage.btn.start_new')}
                    </button>
                </>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.7; }
                    50% { transform: scale(1.1); opacity: 0.3; }
                }
            `}</style>
        </div>
    )
}

export default TriagePage
