import styles from './Pagination.module.css';

export default function Pagination({ page, totalPages, total, pageSize, onPageChange, onPageSizeChange }) {
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5);

    return (
        <div className={styles.pagination}>
            <span className={styles.summary}>
                Showing {from} to {to} of {total} reports
            </span>

            <div className={styles.controls}>
                <button
                    type="button"
                    className={styles.arrowBtn}
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    <IconLucideChevronLeft size={16} />
                </button>

                {pageNumbers.map((n) => (
                    <button
                        key={n}
                        type="button"
                        className={n === page ? `${styles.pageBtn} ${styles.pageBtnActive}` : styles.pageBtn}
                        onClick={() => onPageChange(n)}
                    >
                        {n}
                    </button>
                ))}

                <button
                    type="button"
                    className={styles.arrowBtn}
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    <IconLucideChevronRight size={16} />
                </button>

                <select
                    className={styles.pageSizeSelect}
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                >
                    {[10, 20, 50].map((size) => (
                        <option key={size} value={size}>
                            {size} / page
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}