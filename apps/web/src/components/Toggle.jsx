import styles from './Toggle.module.css';

export default function Toggle({ checked, onChange, disabled }) {
    return (
        <label className={styles.toggle} onClick={e => e.stopPropagation()}>
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} />
            <span className={styles.toggleTrack} />
        </label>
    );
}
