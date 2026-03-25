import { useState } from 'react'
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

    const handleDemoAutofill = () => {
        setUsername('demo_chw_001')
        setPassword('password123')
    }

    const handleAdminAutofill = () => {
        setUsername('admin')
        setPassword('admin')
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100dvh',
            padding: '20px',
            background: 'var(--bg)',
        }}>
            {/* Logo area */}
            <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'var(--bg)',
                boxShadow: '9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                marginBottom: '24px'
            }}>
                💊
            </div>

            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center' }}>
                Triage-Zero
            </h1>
            <p style={{ margin: '0 0 32px', fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                {t('login.subtitle')}
            </p>

            <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <NeumorphicInput
                    icon="👤"
                    placeholder={t('login.username')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                
                <NeumorphicInput
                    icon="🔒"
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

                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <NeumorphicButton type="submit">
                        {t('login.button')}
                    </NeumorphicButton>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={handleDemoAutofill}
                            style={{
                                flex: 1,
                                padding: '16px',
                                borderRadius: '16px',
                                border: '1px solid var(--shadow-dark)',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            {t('login.autofill_chw')}
                        </button>

                        <button
                            type="button"
                            onClick={handleAdminAutofill}
                            style={{
                                flex: 1,
                                padding: '16px',
                                borderRadius: '16px',
                                border: '1px solid var(--shadow-dark)',
                                background: 'transparent',
                                color: 'var(--red-alert)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            {t('login.autofill_admin')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default LoginPage
