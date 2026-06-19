// Centered card layout used by every auth page (Login, Register, Forgot Password, Welcome).
// Pass `heroBg` (imported image) to show a full-bleed background behind the card.
import styles from './AuthLayout.module.css';

export default function AuthLayout({ title, subtitle, children, footer, heroBg }) {
    return (
        <main
            className={`${styles.shell} ${heroBg ? styles.shellHero : ''}`}
            style={heroBg ? {
                backgroundImage: `url(${heroBg})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#2B1C10',
            } : undefined}
        >
            <div className={heroBg ? `${styles.card} ${styles.cardOverlay}` : styles.card}>
                <h1 className={styles.title}>{title}</h1>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                <div className={styles.body}>{children}</div>
                {footer && <div className={styles.footer}>{footer}</div>}
            </div>
        </main>
    );
}
