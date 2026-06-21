import styles from './Button.module.css';

export default function Button({ children, variant = 'primary', type = 'button', onClick, disabled, fullWidth = true }) {
    const className = [styles.btn, styles[variant], fullWidth ? styles.full : ''].join(' ');
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={className}>
            {children}
        </button>
    );
}
