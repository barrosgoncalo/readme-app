import styles from './Dropdown.module.css';

export default function Dropdown({ value, onChange, options, allLabel = 'All' }) {
    return (
        <div className={styles.wrapper}>
            <select className={styles.select} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
                <option value="">{allLabel}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <IconLucideChevronDown size={14} className={styles.chevron} />
        </div>
    );
}
