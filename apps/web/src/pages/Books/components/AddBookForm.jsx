import { useState } from 'react';
import Field from '../../../components/Field.jsx';
import Button from '../../../components/Button.jsx';
import ErrorAlert from '../../../components/ErrorAlert.jsx';
import styles from './AddBookForm.module.css';

export default function AddBookForm({ onSubmit, onCancel, submitting, error }) {
    const [isbn, setIsbn] = useState('');
    const [title, setTitle] = useState('');
    const [authors, setAuthors] = useState('');
    const [coverUrl, setCoverUrl] = useState('');

    const canSubmit = title.trim() && authors.trim() && !submitting;

    function handleSubmit(e) {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({
            isbn: isbn.trim() || null,
            title: title.trim(),
            authors: authors.split(',').map((a) => a.trim()).filter(Boolean),
            coverUrl: coverUrl.trim() || null,
        });
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <Field label="ISBN (optional)" value={isbn} onChange={setIsbn} placeholder="9780000000000" />
            <p className={styles.hint}>Used as the book ID so duplicates merge. Leave blank if unknown.</p>
            <Field label="Title" value={title} onChange={setTitle} required />
            <Field label="Authors" value={authors} onChange={setAuthors} placeholder="Comma-separated" required />
            <Field label="Cover URL (optional)" value={coverUrl} onChange={setCoverUrl} placeholder="https://…" />
            <ErrorAlert>{error}</ErrorAlert>
            <div className={styles.actions}>
                <Button variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button>
                <Button type="submit" disabled={!canSubmit}>
                    {submitting ? 'Adding…' : 'Add book'}
                </Button>
            </div>
        </form>
    );
}
