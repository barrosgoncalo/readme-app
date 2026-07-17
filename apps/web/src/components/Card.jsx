import styles from './Card.module.css';

export default function Card({ children, interactive = false, className = '', onClick, as: Tag = 'div', ...rest }) {
    const classNames = [
        styles.card,
        interactive ? styles.interactive : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <Tag
            className={classNames}
            onClick={interactive ? onClick : undefined}
            role={interactive && onClick ? 'button' : undefined}
            tabIndex={interactive && onClick ? 0 : undefined}
            onKeyDown={interactive && onClick ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(e);
                }
            } : undefined}
            {...rest}
        >
            {children}
        </Tag>
    );
}
