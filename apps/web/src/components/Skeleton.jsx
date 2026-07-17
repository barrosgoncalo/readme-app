import styles from './Skeleton.module.css';

export default function Skeleton({ variant = 'text', width, height, className = '' }) {
    const style = {};
    if (width) style.width = width;
    if (height) style.height = height;

    return (
        <div
            className={`${styles.skeleton} ${styles[variant] || ''} ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
}

export function SkeletonGrid({ count = 6, variant = 'card' }) {
    return (
        <div className={styles.grid}>
            {Array.from({ length: count }, (_, i) => (
                <Skeleton key={i} variant={variant} />
            ))}
        </div>
    );
}

export function SkeletonList({ count = 4, variant = 'row' }) {
    return (
        <div className={styles.list}>
            {Array.from({ length: count }, (_, i) => (
                <Skeleton key={i} variant={variant} />
            ))}
        </div>
    );
}
