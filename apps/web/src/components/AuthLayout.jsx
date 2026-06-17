// Centered card layout used by every auth page (Login, Register, Forgot Password, Welcome).
import styles from './AuthLayout.module.css';

export default function AuthLayout({ title, subtitle, children, footer }) {
    return (
        <main className={styles.shell}>
            <div className={styles.card}>
                <h1 className={styles.title}>{title}</h1>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                <div className={styles.body}>{children}</div>
                {footer && <div className={styles.footer}>{footer}</div>}
            </div>
        </main>
    );
}
