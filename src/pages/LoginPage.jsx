import { useState } from 'react'
import { User, Lock, Stethoscope } from 'lucide-react'
import NeumorphicCard from '../components/ui/NeumorphicCard'
import NeumorphicInput from '../components/ui/NeumorphicInput'
import NeumorphicButton from '../components/ui/NeumorphicButton'
import { useLanguage } from '../context/LanguageContext'

const LoginPage = ({ onLogin }) => {
    const { t } = useLanguage()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleLogin = (e) => {
        e.preventDefault()
        if (username.trim() !== '' && password.trim() !== '') {
            if (username.toLowerCase() === 'admin') {
                onLogin('admin', username)
            } else {
                onLogin('chw', username)
            }
        } else {
            setError(t('login.error'))
        }
    }

    const handleDemoAutofill = () => { setUsername('demo_chw_001'); setPassword('password123') }
    const handleAdminAutofill = () => { setUsername('admin'); setPassword('admin') }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100dvh',
            padding: '24px 20px',
            background: 'var(--bg)',
        }}>
            {/* Animated Logo Area */}
            <div style={{
                animation: 'loginFadeIn 0.5s ease forwards',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '32px',
            }}>
                <div style={{
                    position: 'relative',
                    width: '100px',
                    height: '100px',
                    marginBottom: '20px',
                }}>
                    {/* Outer ring */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #20c997, #4facde)',
                        padding: '3px',
                    }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: 'var(--bg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light)',
                        }}>
                            <Stethoscope size={44} color="#20c997" strokeWidth={1.5} />
                        </div>
                    </div>
                </div>

                <h1 style={{ margin: '0 0 6px', fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #20c997, #4facde)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    Triage-Zero
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
                    {t('login.subtitle')}
                </p>
            </div>

            {/* Form Card */}
            <div style={{ width: '100%', maxWidth: '340px', animation: 'loginFadeIn 0.5s 0.15s ease both' }}>
                <NeumorphicCard>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <NeumorphicInput
                            icon={<User size={16} color="var(--text-secondary)" />}
                            placeholder={t('login.username')}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <NeumorphicInput
                            icon={<Lock size={16} color="var(--text-secondary)" />}
                            type="password"
                            placeholder={t('login.password')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {error && (
                            <p style={{ color: 'var(--red-alert)', fontSize: '12px', margin: '0 4px', fontWeight: 600 }}>
                                {error}
                            </p>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                            {/* Main login button with gradient */}
                            <button
                                type="submit"
                                style={{
                                    padding: '16px',
                                    borderRadius: '16px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #20c997, #4facde)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    boxShadow: '4px 4px 12px rgba(32,201,151,0.4)',
                                    letterSpacing: '0.02em',
                                    transition: 'opacity 0.15s ease, transform 0.1s ease',
                                }}
                                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                {t('login.button')}
                            </button>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={handleDemoAutofill}
                                    style={{
                                        flex: 1, padding: '14px', borderRadius: '14px',
                                        border: '1.5px solid var(--shadow-dark)', background: 'transparent',
                                        color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '12px'
                                    }}
                                >{t('login.autofill_chw')}</button>

                                <button
                                    type="button"
                                    onClick={handleAdminAutofill}
                                    style={{
                                        flex: 1, padding: '14px', borderRadius: '14px',
                                        border: '1.5px solid rgba(255,107,107,0.4)', background: 'transparent',
                                        color: 'var(--red-alert)', fontWeight: 700, cursor: 'pointer', fontSize: '12px'
                                    }}
                                >{t('login.autofill_admin')}</button>
                            </div>
                        </div>
                    </form>
                </NeumorphicCard>
            </div>
        </div>
    )
}

export default LoginPage
