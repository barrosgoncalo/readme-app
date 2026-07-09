import { useState } from 'react';
import Field from '../../../components/Field.jsx';
import Button from '../../../components/Button.jsx';
import ErrorAlert from '../../../components/ErrorAlert.jsx';
import DateTimePicker from '../../../components/DateTimePicker.jsx';
import styles from './CreateEventForm.module.css';

export default function CreateEventForm({ onSubmit, onCancel, submitting, error }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('reading');
    const [startsAt, setStartsAt] = useState('');
    const [locationLabel, setLocationLabel] = useState('');

    const canSubmit = title.trim() && description.trim() && startsAt && locationLabel.trim() && !submitting;

    function handleSubmit(e) {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({
            title: title.trim(),
            description: description.trim(),
            type,
            startsAt: new Date(startsAt).toISOString(),
            locationLabel: locationLabel.trim(),
        });
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <Field label="Title" value={title} onChange={setTitle} required />

            <label className={styles.fieldLabel}>
                <span className={styles.label}>Description</span>
                <textarea
                    className={styles.textarea}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this event about?"
                    required
                />
            </label>

            <label className={styles.fieldLabel}>
                <span className={styles.label}>Type</span>
                <select
                    className={styles.select}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                >
                    <option value="reading">Reading group</option>
                    <option value="lecture">Lecture</option>
                    <option value="roundtable">Roundtable</option>
                </select>
            </label>

            <label className={styles.fieldLabel}>
                <span className={styles.label}>Date & time</span>
                <DateTimePicker value={startsAt} onChange={setStartsAt} />
            </label>

            <Field label="Location" value={locationLabel} onChange={setLocationLabel} placeholder="Café Central, Porto" required />

            <ErrorAlert>{error}</ErrorAlert>

            <div className={styles.actions}>
                <Button variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button>
                <Button type="submit" disabled={!canSubmit}>
                    {submitting ? 'Creating…' : 'Create event'}
                </Button>
            </div>
        </form>
    );
}
