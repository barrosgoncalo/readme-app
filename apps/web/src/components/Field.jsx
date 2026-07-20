import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Field.module.css';

export default function Field({ label, type = 'text', value, onChange, autoComplete, required, placeholder, name, max, min }) {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <label className={styles.field}>
            <span className={styles.label}>{label}</span>
            <div className={styles.inputWrapper}>
                <input
                    className={styles.input}
                    type={inputType}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoComplete={autoComplete}
                    required={required}
                    placeholder={placeholder}
                    max={max}
                    min={min}
                />

                {isPassword && (
                    <button
                        type="button"
                        className={styles.eyeButton}
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </label>
    );
}
