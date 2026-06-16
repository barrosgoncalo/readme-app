export default function BooksScan() {
    return (
        <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto', padding: 'var(--space-5) var(--space-4)' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)' }}>Scan a book</h1>
            <p style={{ color: 'var(--subtext)' }}>
                Barcode scanning needs a camera and is only available in the mobile app. Open README on
                your phone to scan a book's barcode.
            </p>
        </div>
    );
}
