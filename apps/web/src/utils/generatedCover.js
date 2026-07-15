// Deterministic "cloth cover" color for books with no cover image, so the
// grid shows a typeset generated cover instead of a gray placeholder box.
// Colors are deep, on-brand tones that pair with light title text.
const COVER_COLORS = [
    '#3B3561', // quaternary (indigo)
    '#5C3D2E', // primary (brown)
    '#1D5B4C', // deep teal
    '#7A3B2E', // rust
    '#2C4A63', // slate blue
    '#5A3A5B', // plum
    '#4A5320', // olive
    '#6B4A1F', // ochre
];

export function coverColorFor(title = '') {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = (hash * 31 + title.charCodeAt(i)) | 0;
    }
    return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length];
}
