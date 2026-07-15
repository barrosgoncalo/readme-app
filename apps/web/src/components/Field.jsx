// Reusable labeled input.
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Field.module.css';

export default function Field({ label, type = 'text', value, onChange, autoComplete, required, placeholder, name, max, min }) {
    // Estado para controlar se a password está visível ou não
    const [showPassword, setShowPassword] = useState(false);

    // Verificamos se este campo é do tipo password
    const isPassword = type === 'password';

    // Se for password e quisermos mostrar, mudamos o input para 'text'
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

                {/* Se for um campo de password, desenhamos o nosso botão de visualização */}
                {isPassword && (
                    <button
                        type="button"
                        className={styles.eyeButton}
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1" // Impede que a tecla TAB foque neste botão
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </label>
    );
}
