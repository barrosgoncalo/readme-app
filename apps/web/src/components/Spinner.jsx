import styles from './Spinner.module.css';

export default function Spinner({ size = 20, label = 'Loading', center = false }) {
    const spinner = (
        <span
            role="status"
            className={styles.spinner}
            style={{ width: size, height: size }}
        >
            <span className={styles.srOnly}>{label}</span>
        </span>
    );

    if (center) {
        return <div className={styles.center}>{spinner}</div>;
    }
    return spinner;
}
