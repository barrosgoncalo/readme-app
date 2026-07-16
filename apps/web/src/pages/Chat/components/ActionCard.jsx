import styles from './ActionCard.module.css';

export default function ActionCard({ prompt, children }) {
    return (
        <div className={styles.card}>
            <p className={styles.prompt}>{prompt}</p>
            {children}
        </div>
    );
}
