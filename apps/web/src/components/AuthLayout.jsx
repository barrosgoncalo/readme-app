// Centered card layout used by every auth page (Login, Register, Forgot Password, Welcome).
import styles from './AuthLayout.module.css';

// Adicionámos a propriedade "bgImage" aos parâmetros
export default function AuthLayout({ title, subtitle, children, footer, bgImage }) {
    return (
        <main
            className={styles.shell}
            // Se houver uma bgImage, aplicamos no style. Caso contrário, fica só a cor base.
            style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}
        >
            <div className={styles.card}>
                <h1 className={styles.title}>{title}</h1>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                <div className={styles.body}>{children}</div>
                {footer && <div className={styles.footer}>{footer}</div>}
            </div>
        </main>
    );
}