import styles from './Splash.module.css';

export default function Splash() {
    return (
        <div className={styles.shell}>
            <h1 className={styles.title}>README</h1>
            <p className={styles.tagline}>A community for book lovers</p>
        </div>
    );
}
