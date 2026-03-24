import { useState, useEffect, useRef } from 'react'
import Cropper from 'react-easy-crop'
import NeumorphicCard from '../components/ui/NeumorphicCard'
import NeumorphicProgressBar from '../components/ui/NeumorphicProgressBar'
import NeumorphicToggle from '../components/ui/NeumorphicToggle'
import NeumorphicSlider from '../components/ui/NeumorphicSlider'
import { useLanguage } from '../context/LanguageContext'

const TriagePage = () => {
    const { t } = useLanguage()
    const STEPS = [
        t('triage.step.data'),
        t('triage.step.ai'),
        t('triage.step.review'),
    ]
    const [step, setStep] = useState(1)
    const [recording, setRecording] = useState(false)
    const canvasRef = useRef(null)
    const audioCtxRef = useRef(null)
    const analyserRef = useRef(null)
    const animationRef = useRef(null)
    const [audioProgress, setAudioProgress] = useState(0)
    const [audioFile, setAudioFile] = useState(null)
    const [triageData, setTriageData] = useState({
        m1_consciousness: false, m1_intake: false,
        m2_cough: 0, m2_breathing: 0, m2_fever: 0, m2_blood: false, m2_silicosis: false,
        m3_dizziness: 0, m3_fatigue: 0, m3_pain: 0, m3_paleness: 0, m3_appetite: 0,
        m4_maternal: false
    })

    const updateTriage = (key, val) => setTriageData(prev => ({ ...prev, [key]: val }))
    const [riskLevel, setRiskLevel] = useState(null) // 'green' | 'yellow' | 'red'
    const [confidence, setConfidence] = useState(null)
    const [analyzeResult, setAnalyzeResult] = useState(null) // full /analyze response
    const [audioUploaded, setAudioUploaded] = useState(false)
    const [visionUploaded, setVisionUploaded] = useState(false)
    const [audioPreview, setAudioPreview] = useState(null)
    const [visionPreview, setVisionPreview] = useState(null)
    const [visionFile, setVisionFile] = useState(null)
    const [imageToCrop, setImageToCrop] = useState(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    
    const audioInputRef = useRef(null)
    const visionInputRef = useRef(null)
    const cameraInputRef = useRef(null)
    const timerRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])

    const toggleRecording = async () => {
        if (recording) {
            clearInterval(timerRef.current)
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop()
            }
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close().catch(console.error)
            }
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
            const source = audioCtx.createMediaStreamSource(stream)
            source.connect(analyser)
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
                    
                    const r = barHeight + (25 * (i/bufferLength))
                    const g = 250 * (i/bufferLength)
                    const b = 255
                    
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
                    
                    x += barWidth + 1
                }
                
                animationRef.current = requestAnimationFrame(drawSpectrogram)
            }

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                const audioUrl = URL.createObjectURL(audioBlob)
                setAudioFile(audioBlob)
                setAudioPreview(audioUrl)
                setAudioUploaded(true)
                stream.getTracks().forEach(track => track.stop())
                
                if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                    audioCtxRef.current.close().catch(console.error)
                }
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current)
                }
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
        } catch (err) {
            alert("Microphone access denied or unavailable.")
        }
    }

    useEffect(() => () => {
        clearInterval(timerRef.current)
        if (audioPreview) URL.revokeObjectURL(audioPreview)
        if (visionPreview) URL.revokeObjectURL(visionPreview)
    }, [audioPreview, visionPreview])

    const runAnalysis = () => {
        setStep(2)

        const formData = new FormData()
        if (!audioFile) { alert('No audio file found'); setStep(1); return; }
        formData.append('audio', audioFile, audioFile.name || 'recording.webm')

        if (visionFile) {
            // Use combined /analyze endpoint
            formData.append('image', visionFile, visionFile.name || 'eye.jpg')
            formData.append('sex', 'M') // default; can be wired to patient info later

            fetch(`http://${window.location.hostname}:5000/analyze`, { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.detail) { alert('Analysis Error: ' + data.detail); setStep(1); return; }

                // Manual override for critical clinical flags
                let overall = data.overall_risk
                if (triageData.m1_consciousness || triageData.m1_intake) overall = 'red'

                setAnalyzeResult(data)
                setRiskLevel(overall)
                setConfidence(Math.max(data.cough.confidence, data.eye.confidence).toFixed(1))
                setStep(3)
            })
            .catch(err => { console.error(err); alert('Failed to connect to AI server. Make sure python backend is running on port 5000.'); setStep(1); })
        } else {
            fetch(`http://${window.location.hostname}:5000/predict`, { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.error) { alert('Analysis Error: ' + data.error); setStep(1); return; }
                let risk = data.risk
                let conf = parseFloat(data.confidence).toFixed(1)
                if (triageData.m1_consciousness || triageData.m1_intake) { risk = 'red'; conf = '99.9' }
                setAnalyzeResult(null)
                setRiskLevel(risk)
                setConfidence(conf)
                setStep(3)
            })
            .catch(err => { console.error(err); alert('Failed to connect to AI server.'); setStep(1); })
        }
    }

    const reset = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
            audioCtxRef.current.close().catch(console.error)
        }
        setStep(1); setRecording(false); setAudioProgress(0)
        setAudioFile(null); setRiskLevel(null); setConfidence(null)
        setAudioUploaded(false); setVisionUploaded(false)
        setAudioPreview(null); setVisionPreview(null)
        setVisionFile(null); setAnalyzeResult(null)
        setImageToCrop(null); setCrop({ x: 0, y: 0 }); setZoom(1); setCroppedAreaPixels(null)
        setTriageData({
            m1_consciousness: false, m1_intake: false,
            m2_cough: 0, m2_breathing: 0, m2_fever: 0, m2_blood: false, m2_silicosis: false,
            m3_dizziness: 0, m3_fatigue: 0, m3_pain: 0, m3_paleness: 0, m3_appetite: 0,
            m4_maternal: false
        })
    }

    const handleFileUpload = (type, e) => {
        const file = e.target.files[0]
        if (!file) return
        const fileUrl = URL.createObjectURL(file)
        if (type === 'audio') {
            setAudioFile(file)
            setAudioPreview(fileUrl)
            setAudioUploaded(true)
            setAudioProgress(100)
        } else if (type === 'vision') {
            setImageToCrop(fileUrl)
        }
        e.target.value = null // reset input
    }

    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = new Image()
        image.src = imageSrc
        await new Promise((resolve) => { image.onload = resolve })

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        )

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                blob.name = 'cropped_eye.jpg'
                resolve(blob)
            }, 'image/jpeg')
        })
    }

    const handleCropComplete = async () => {
        try {
            if (!croppedAreaPixels) return
            const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels)
            const croppedUrl = URL.createObjectURL(croppedBlob)
            setVisionFile(croppedBlob)
            setVisionPreview(croppedUrl)
            setVisionUploaded(true)
            setImageToCrop(null)
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {STEPS.map((label, i) => {
                    const num = i + 1
                    const isActive = num === step
                    const isDone = num < step
                    return (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <div
                                    style={{
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '50%',
                                        background: 'var(--bg)',
                                        boxShadow: isActive
                                            ? 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)'
                                            : isDone
                                                ? '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)'
                                                : '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: isDone ? 'var(--green-alert)' : isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    {isDone ? '✓' : num}
                                </div>
                                <span style={{ fontSize: '9px', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isActive ? 600 : 400, width: '60px', textAlign: 'center' }}>
                                    {label}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div
                                    style={{
                                        flex: 1,
                                        height: '2px',
                                        background: isDone ? 'var(--green-alert)' : 'var(--shadow-dark)',
                                        borderRadius: '2px',
                                        marginBottom: '18px',
                                        transition: 'background 0.3s ease',
                                    }}
                                />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Step 1: Data Acquisition */}
            {step === 1 && (
                <>
                    {/* Audio Capture */}
                    <NeumorphicCard>
                        <p style={{ margin: '0 0 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {t('triage.audio.title')}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            {/* Mic Button */}
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <button
                                    onClick={toggleRecording}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'var(--bg)',
                                        border: 'none',
                                        boxShadow: recording
                                            ? 'inset 6px 6px 12px var(--shadow-dark), inset -6px -6px 12px var(--shadow-light)'
                                            : '9px 9px 18px var(--shadow-dark), -9px -9px 18px var(--shadow-light)',
                                        cursor: recording ? 'default' : 'pointer',
                                        fontSize: '28px',
                                        transition: 'box-shadow 0.2s ease, transform 0.1s ease',
                                        transform: recording ? 'scale(0.95)' : 'scale(1)',
                                        outline: 'none',
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {recording ? '⏺️' : '🎙️'}
                                    {recording && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                inset: '-6px',
                                                borderRadius: '50%',
                                                border: '2px solid rgba(255, 107, 107, 0.5)',
                                                animation: 'pulse 1s ease-in-out infinite',
                                            }}
                                        />
                                    )}
                                </button>
                                <span style={{ fontSize: '12px', color: 'var(--shadow-dark)', fontWeight: 600 }}>OR</span>
                                <button
                                    onClick={() => audioInputRef.current?.click()}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'var(--bg)',
                                        border: 'none',
                                        boxShadow: '9px 9px 18px var(--shadow-dark), -9px -9px 18px var(--shadow-light)',
                                        cursor: 'pointer',
                                        transition: 'box-shadow 0.2s ease, transform 0.1s ease',
                                        outline: 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    <span style={{ fontSize: '24px' }}>📁</span>
                                    <span style={{ fontSize: '9px', color: 'var(--text-primary)', fontWeight: 600 }}>Upload</span>
                                </button>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    ref={audioInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileUpload('audio', e)}
                                />
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                {recording
                                    ? `Recording... ${audioProgress}% (tap to stop)`
                                    : audioUploaded
                                        ? 'Audio successfully acquired ✅'
                                        : 'Tap to record or upload audio'}
                            </p>
                            <div style={{ width: '100%' }}>
                                <NeumorphicProgressBar value={audioProgress} color="var(--red-alert)" />
                            </div>
                            
                            <div style={{ width: '100%', height: recording ? '60px' : '0px', transition: 'height 0.3s ease', overflow: 'hidden' }}>
                                <canvas 
                                    ref={canvasRef} 
                                    width="300" 
                                    height="60" 
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        borderRadius: '8px', 
                                        background: 'var(--bg)',
                                        boxShadow: 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)'
                                    }} 
                                />
                            </div>

                            {audioPreview && (
                                <audio src={audioPreview} controls style={{ width: '100%', marginTop: '8px', height: '36px', borderRadius: '18px' }} />
                            )}
                        </div>
                    </NeumorphicCard>

                    {/* Vision Capture */}
                    <NeumorphicCard>
                        <p style={{ margin: '0 0 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {t('triage.vision.title')}
                        </p>
                        {imageToCrop ? (
                            <div style={{ position: 'relative', width: '100%', height: '250px', borderRadius: '16px', overflow: 'hidden', boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)' }}>
                                <Cropper
                                    image={imageToCrop}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                                    onZoomChange={setZoom}
                                />
                                <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 10 }}>
                                    <button onClick={() => { setImageToCrop(null); setVisionUploaded(false); }} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: 'var(--bg)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)' }}>
                                        {t('cancel')}
                                    </button>
                                    <button onClick={handleCropComplete} style={{ flex: 2, padding: '10px', borderRadius: '12px', border: 'none', background: 'var(--bg)', color: 'var(--green-alert)', cursor: 'pointer', fontWeight: 700, boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)' }}>
                                        {t('apply_crop')}
                                    </button>
                                </div>
                            </div>
                        ) : visionPreview ? (
                            <div style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '9px 9px 18px var(--shadow-dark), -9px -9px 18px var(--shadow-light)' }}>
                                <img src={visionPreview} alt="Captured preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                                <button
                                    onClick={() => { setVisionPreview(null); setVisionUploaded(false); }}
                                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div
                                    onClick={() => cameraInputRef.current?.click()}
                                    style={{
                                        flex: 1,
                                        height: '120px',
                                        borderRadius: '16px',
                                        background: 'var(--bg)',
                                        boxShadow: 'inset 6px 6px 12px var(--shadow-dark), inset -6px -6px 12px var(--shadow-light)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <span style={{ fontSize: '32px' }}>📷</span>
                                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>Capture Camera</p>
                                </div>
                                <div
                                    onClick={() => visionInputRef.current?.click()}
                                    style={{
                                        flex: 1,
                                        height: '120px',
                                        borderRadius: '16px',
                                        background: 'var(--bg)',
                                        boxShadow: '9px 9px 18px var(--shadow-dark), -9px -9px 18px var(--shadow-light)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <span style={{ fontSize: '28px' }}>📂</span>
                                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-primary)', textAlign: 'center', fontWeight: 600 }}>Upload Image</p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    ref={cameraInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileUpload('vision', e)}
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={visionInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileUpload('vision', e)}
                                />
                            </div>
                        )}
                    </NeumorphicCard>

                    {/* Patient Info */}
                    <NeumorphicCard style={{ padding: '14px 18px' }}>
                        <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {t('triage.patient.title')}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {['Aadhaar No. (12 Digits)', 'Patient Name', 'DOB (DD/MM/YYYY)', 'Sex (M/F/O)', 'Village'].map((field) => (
                                <div
                                    key={field}
                                    style={{
                                        background: 'var(--bg)',
                                        boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
                                        borderRadius: '12px',
                                        padding: '10px 14px',
                                    }}
                                >
                                    <input
                                        placeholder={field}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            outline: 'none',
                                            width: '100%',
                                            fontSize: '14px',
                                            color: 'var(--text-primary)',
                                            fontFamily: 'Inter, sans-serif',
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </NeumorphicCard>

                    {/* Manual Triage */}
                    <NeumorphicCard style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--bg)', paddingBottom: '12px' }}>
                            {t('triage.clinical.title')}
                        </p>

                        {/* Module 1 */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>{t('triage.clinical.q1')}</span>
                                <NeumorphicToggle defaultOn={triageData.m1_consciousness} onChange={(v) => updateTriage('m1_consciousness', v)} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>{t('triage.clinical.q2')}</span>
                                <NeumorphicToggle defaultOn={triageData.m1_intake} onChange={(v) => updateTriage('m1_intake', v)} />
                            </div>
                        </div>

                        {/* Module 2 */}
                        <div style={{ paddingTop: '16px', borderTop: '2px solid var(--bg)' }}>
                            <NeumorphicSlider label={t('triage.clinical.m2.cough')} value={triageData.m2_cough} onChange={(v) => updateTriage('m2_cough', v)} options={[t('triage.clinical.m2.cough.0'), t('triage.clinical.m2.cough.1'), t('triage.clinical.m2.cough.2')]} />
                            <NeumorphicSlider label={t('triage.clinical.m2.breathing')} value={triageData.m2_breathing} onChange={(v) => updateTriage('m2_breathing', v)} options={[t('triage.clinical.m2.breath.0'), t('triage.clinical.m2.breath.1'), t('triage.clinical.m2.breath.2')]} />
                            <NeumorphicSlider label={t('triage.clinical.m2.fever')} value={triageData.m2_fever} onChange={(v) => updateTriage('m2_fever', v)} options={[t('triage.clinical.m2.fever.0'), t('triage.clinical.m2.fever.1'), t('triage.clinical.m2.fever.2')]} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', marginTop: '20px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>{t('triage.clinical.m2.blood')}</span>
                                <NeumorphicToggle defaultOn={triageData.m2_blood} onChange={(v) => updateTriage('m2_blood', v)} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>{t('triage.clinical.m2.occup')}</span>
                                <NeumorphicToggle defaultOn={triageData.m2_silicosis} onChange={(v) => updateTriage('m2_silicosis', v)} />
                            </div>
                        </div>

                        {/* Module 3 */}
                        <div style={{ paddingTop: '16px', borderTop: '2px solid var(--bg)' }}>
                            <NeumorphicSlider label={t('triage.clinical.m3.dizziness')} value={triageData.m3_dizziness} onChange={(v) => updateTriage('m3_dizziness', v)} options={['Never', 'Sometimes standing', 'Frequent blurry']} />
                            <NeumorphicSlider label={t('triage.clinical.m3.fatigue')} value={triageData.m3_fatigue} onChange={(v) => updateTriage('m3_fatigue', v)} options={['Normal Energy', 'Tires Quickly', 'Too weak to stand']} />
                            <NeumorphicSlider label={t('triage.clinical.m3.pain')} value={triageData.m3_pain} onChange={(v) => updateTriage('m3_pain', v)} options={['No Pain', 'Mild Ache', 'Severe/Throbbing']} />
                            <NeumorphicSlider label={t('triage.clinical.m3.paleness')} value={triageData.m3_paleness} onChange={(v) => updateTriage('m3_paleness', v)} options={['Normal / Pink', 'Slightly Pale', 'Very White']} />
                            <NeumorphicSlider label={t('triage.clinical.m3.appetite')} value={triageData.m3_appetite} onChange={(v) => updateTriage('m3_appetite', v)} options={['Normal Weight', 'Eating Less', 'Severe Weight Loss']} />
                        </div>

                        {/* Module 4 */}
                        <div style={{ paddingTop: '16px', borderTop: '2px solid var(--bg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>{t('triage.clinical.m4.maternal')}</span>
                                <NeumorphicToggle defaultOn={triageData.m4_maternal} onChange={(v) => updateTriage('m4_maternal', v)} />
                            </div>
                        </div>
                    </NeumorphicCard>

                    <button
                        onClick={runAnalysis}
                        disabled={audioProgress < 100}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '20px',
                            border: 'none',
                            background: 'var(--bg)',
                            boxShadow: audioProgress < 100
                                ? 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)'
                                : '9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light)',
                            color: audioProgress < 100 ? 'var(--text-secondary)' : 'var(--text-primary)',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: audioProgress < 100 ? 'not-allowed' : 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {audioProgress < 100 ? t('triage.btn.record_first') : t('triage.btn.run_ai')}
                    </button>
                </>
            )}

            {/* Step 2: Analyzing */}
            {step === 2 && (
                <NeumorphicCard style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>🧠</div>
                    <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Analyzing Data...</p>
                    <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>Inference engine processing audio + visual signals</p>
                    <NeumorphicProgressBar value={65} color="var(--green-alert)" />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {['Audio FFT', 'Mel Spectogram', 'Eye Pallor', 'Risk Model'].map((tag) => (
                            <span
                                key={tag}
                                style={{
                                    fontSize: '10px',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    background: 'var(--bg)',
                                    boxShadow: '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)',
                                    color: 'var(--text-secondary)',
                                    fontWeight: 600,
                                }}
                            >
                                ✓ {tag}
                            </span>
                        ))}
                    </div>
                </NeumorphicCard>
            )}

            {/* Step 3: Results */}
            {step === 3 && riskLevel && (
                <>
                    <NeumorphicCard>
                        <p style={{ margin: '0 0 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            🔬 AI Inference Result
                        </p>

                        {/* Overall Risk Banner */}
                        <div style={{
                            padding: '20px',
                            borderRadius: '16px',
                            background: 'var(--bg)',
                            boxShadow: riskLevel === 'red'
                                ? `inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light), 0 0 20px rgba(255,107,107,0.2)`
                                : riskLevel === 'yellow'
                                    ? `inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light), 0 0 20px rgba(255,193,7,0.2)`
                                    : `inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light), 0 0 20px rgba(32,201,151,0.2)`,
                            textAlign: 'center',
                            marginBottom: '16px',
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                                {riskLevel === 'red' ? '🚨' : riskLevel === 'yellow' ? '⚠️' : '✅'}
                            </div>
                            <div style={{
                                display: 'inline-block',
                                padding: '6px 20px',
                                borderRadius: '50px',
                                background: 'var(--bg)',
                                boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
                                color: riskLevel === 'red' ? 'var(--red-alert)' : riskLevel === 'yellow' ? '#f5a623' : 'var(--green-alert)',
                                fontSize: '16px',
                                fontWeight: 800,
                                letterSpacing: '0.05em',
                                marginBottom: '8px',
                            }}>
                                {riskLevel === 'red' ? '⚠ RED ALERT — HIGH RISK' : riskLevel === 'yellow' ? '◈ YELLOW — MODERATE RISK' : '✓ GREEN — CLEAR'}
                            </div>
                            <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {analyzeResult?.summary ||
                                    (riskLevel === 'red'
                                        ? 'High probability of active illness. Refer to district hospital immediately.'
                                        : 'Low risk indicators. Continue routine monitoring.')}
                            </p>
                        </div>

                        {/* Dual Model Breakdown — shown when /analyze was used */}
                        {analyzeResult && (
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                {/* Cough Card */}
                                <div style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'var(--bg)', boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)' }}>
                                    <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>🎙️ Cough</p>
                                    <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: analyzeResult.cough.risk === 'red' ? 'var(--red-alert)' : 'var(--green-alert)' }}>
                                        {analyzeResult.cough.label}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{analyzeResult.cough.confidence.toFixed(1)}% confidence</p>
                                </div>
                                {/* Eye Card */}
                                <div style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'var(--bg)', boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)' }}>
                                    <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>👁️ Eye Scan</p>
                                    <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: analyzeResult.eye.risk === 'red' ? 'var(--red-alert)' : 'var(--green-alert)' }}>
                                        {analyzeResult.eye.label}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{analyzeResult.eye.confidence.toFixed(1)}% confidence</p>
                                </div>
                            </div>
                        )}

                        {/* Overall Confidence bar */}
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Overall Confidence</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: riskLevel === 'red' ? 'var(--red-alert)' : riskLevel === 'yellow' ? '#f5a623' : 'var(--green-alert)' }}>{confidence}%</span>
                            </div>
                            <NeumorphicProgressBar value={parseFloat(confidence)} color={riskLevel === 'red' ? 'var(--red-alert)' : riskLevel === 'yellow' ? '#f5a623' : 'var(--green-alert)'} height={14} />
                        </div>
                    </NeumorphicCard>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={reset} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--bg)', boxShadow: '7px 7px 14px var(--shadow-dark), -7px -7px 14px var(--shadow-light)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                            🔄 New Triage
                        </button>
                        <button style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--bg)', boxShadow: '7px 7px 14px var(--shadow-dark), -7px -7px 14px var(--shadow-light)', color: 'var(--green-alert)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                            💾 Save & Sync
                        </button>
                    </div>
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
