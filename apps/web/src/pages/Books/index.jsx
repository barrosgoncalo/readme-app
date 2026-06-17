export default function Books() {
    return (
        <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto', padding: 'var(--space-5) var(--space-4)' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)' }}>My Books</h1>
            <p style={{ color: 'var(--subtext)' }}>
                Your book catalog, trades, and reading list will live here. Scanning a barcode is a
                mobile-only feature for now — open the README app on your phone for that.
            </p>
        </div>
    );
}
