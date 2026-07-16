import styles from './Button.module.css';

export default function Button({ children, variant = 'primary', type = 'button', onClick, disabled, fullWidth = true, className, ...rest }) {
    const computedClassName = [styles.btn, styles[variant], fullWidth ? styles.full : '', className || ''].join(' ');
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={computedClassName} {...rest}>
            {children}
        </button>
    );
}
