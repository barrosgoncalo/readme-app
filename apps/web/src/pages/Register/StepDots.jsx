import styles from './StepDots.module.css';

export default function StepDots({ total, current }) {
    return (
        <div className={styles.row} aria-label={`Step ${current} of ${total}`}>
            {Array.from({ length: total }).map((_, i) => (
                <span
                    key={i}
                    className={i + 1 === current ? styles.active : styles.dot}
                />
            ))}
        </div>
    );
}
