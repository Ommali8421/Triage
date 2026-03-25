import { HeartPulse } from 'lucide-react'

const TopHeader = ({ title }) => {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '480px',
                height: '72px',
                background: 'var(--bg)',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                boxShadow: '0 4px 12px rgba(163,177,198,0.4)',
                borderBottom: '2px solid transparent',
                backgroundImage: 'linear-gradient(var(--bg), var(--bg)), linear-gradient(90deg, #20c997 0%, #4facde 100%)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
            }}
        >
            {/* Left: Title */}
            <div>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {title}
                </h1>
            </div>

            {/* Right: Branded icon */}
            <div
                style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'var(--bg)',
                    boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <HeartPulse size={22} color="#20c997" strokeWidth={2} />
            </div>
        </div>
    )
}

export default TopHeader
