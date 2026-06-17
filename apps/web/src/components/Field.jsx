// Reusable labeled input.
import styles from './Field.module.css';

export default function Field({ label, type = 'text', value, onChange, autoComplete, required, placeholder, name }) {
    return (
        <label className={styles.field}>
            <span className={styles.label}>{label}</span>
            <input
                className={styles.input}
                type={type}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoComplete={autoComplete}
                required={required}
                placeholder={placeholder}
            />
        </label>
    );
}
