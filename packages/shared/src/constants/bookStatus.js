// Reading-status vocabulary for a user's shelf (myBooks). Shared so the
// label a user sees is consistent between BookCard, BookDetail, and mobile.
export const BOOK_STATUS = {
    READING: 'reading',
    DONE: 'done',
    WANT: 'want',
};

export const BOOK_STATUS_LABELS = {
    [BOOK_STATUS.READING]: 'Reading',
    [BOOK_STATUS.DONE]: 'Finished',
    [BOOK_STATUS.WANT]: 'Want to read',
};
