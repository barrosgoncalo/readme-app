// Canonical storage format is ISO (YYYY-MM-DD), matching the web app's
// <input type="date">. These are the only functions that should parse or
// produce that format — all screens (Register, EditProfile, etc.) should
// import from here rather than reimplementing.

export const isoToDate = (isoStr) => {
    if (!isoStr) return new Date(2000, 0, 1);
    const [y, m, d] = isoStr.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d));
};

export const dateToIso = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Display-only formatting (DD/MM/YYYY), never sent to Firestore.
export const formatDisplayDob = (isoStr) => {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-');
    if (!y || !m || !d) return '';
    return `${d}/${m}/${y}`;
};
