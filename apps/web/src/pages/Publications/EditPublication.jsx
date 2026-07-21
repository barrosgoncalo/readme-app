import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, X, Trash2 } from 'lucide-react';
import { PublicationService } from '@readme/shared/src/services/publications';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { BOOK_CONDITIONS, BOOK_GENRES } from '@readme/shared/src/constants/bookOptions';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Spinner from '../../components/Spinner.jsx';
import Button from '../../components/Button.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { useToast } from '../../contexts/ToastContext';
import styles from './EditPublication.module.css';

export default function EditPublication() {
    const { pubId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [, showToast] = useToast(3000);

    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [pub, setPub] = useState(null);

    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [condition, setCondition] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');

    // Existing remote image URLs are tracked separately from newly picked
    // files, since only the new ones need to be uploaded on save.
    const [existingImages, setExistingImages] = useState([]);
    const [newFiles, setNewFiles] = useState([]);
    const [newPreviews, setNewPreviews] = useState([]);

    const [saving, setSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (!pubId) return;
        let cancelled = false;

        (async () => {
            try {
                const data = await PublicationService.fetchPublication(pubId);
                if (cancelled) return;
                if (!data) {
                    setNotFound(true);
                    return;
                }
                setPub(data);
                setTitle(data.book?.title || '');
                setAuthor(data.book?.author || '');
                setDescription(data.detailsText || '');
                setSubject(data.book?.subject || '');
                setCondition(data.book?.condition || '');
                setExistingImages(data.book?.images || []);
            } catch (err) {
                console.error('Error loading publication:', err);
                if (!cancelled) setNotFound(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [pubId]);

    // Build/revoke object URLs for previewing newly picked files.
    useEffect(() => {
        const urls = newFiles.map(file => URL.createObjectURL(file));
        setNewPreviews(urls);
        return () => urls.forEach(url => URL.revokeObjectURL(url));
    }, [newFiles]);

    if (loading) return <Spinner center label="Loading" />;

    if (notFound) {
        return (
            <div className={styles.page}>
                <PageHeader onBack={() => navigate(-1)} title="Edit Publication" />
                <p className={styles.notFound}>Publication not found.</p>
            </div>
        );
    }

    const isOwner = currentUser && pub && currentUser.uid === pub.uid;

    if (!isOwner) {
        return (
            <div className={styles.page}>
                <PageHeader onBack={() => navigate(-1)} title="Edit Publication" />
                <p className={styles.notFound}>You can only edit your own publications.</p>
            </div>
        );
    }

    const combinedCount = existingImages.length + newFiles.length;
    const canSubmit = title.trim() && combinedCount > 0 && !saving;

    function handleFileChange(e) {
        const files = Array.from(e.target.files || []);
        setNewFiles(prev => [...prev, ...files]);
    }

    function handleDragOver(e) {
        e.preventDefault();
        if (!saving) setIsDragging(true);
    }

    function handleDragLeave(e) {
        e.preventDefault();
        setIsDragging(false);
    }

    function handleDrop(e) {
        e.preventDefault();
        setIsDragging(false);
        if (saving) return;

        const files = Array.from(e.dataTransfer.files || []);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length !== files.length) {
            showToast('Some files were ignored because they are not images.');
        }

        setNewFiles(prev => [...prev, ...imageFiles]);
    }

    function removeExistingImage(index) {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    }

    function removeNewFile(index) {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!canSubmit) return;

        setSaving(true);
        try {
            await PublicationService.updatePublication(
                currentUser,
                pub.id,
                {
                    bookName: title.trim(),
                    authorName: author.trim() || 'Unknown Author',
                    condition: condition.trim(),
                    subject: subject.trim(),
                    description: description.trim(),
                },
                { existingImages, newImages: newFiles },
            );

            showToast('Publication updated!');
            navigate(WEB_ROUTES.publicationDetail(pub.id));
        } catch (error) {
            console.error(`${error.stage || 'Unknown'} Error:`, error);
            if (error.stage === 'storage') {
                showToast('Failed to upload images. Please try again.');
            } else if (error.stage === 'firestore') {
                showToast('Failed to save changes. Please try again.');
            } else {
                showToast('Failed to update publication. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        setDeleting(true);
        try {
            await PublicationService.deletePublication(currentUser, pub.id);
            showToast('Publication deleted');
            navigate(WEB_ROUTES.PROFILE_MY_BOOKS);
        } catch (error) {
            if (error.stage === 'validation') {
                showToast('You can only delete publications that are not currently in any trade.');
            } else {
                console.error(`${error.stage || 'Unknown'} Error:`, error);
                showToast('Something went wrong while deleting. Please try again.');
            }
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    }

    return (
        <div className={styles.page}>
            <ConfirmDialog
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete publication?"
                message="This cannot be undone."
                confirmLabel="Delete"
                danger
                busy={deleting}
            />

            <PageHeader onBack={() => navigate(-1)} title="Edit Publication" />

            <div className={styles.layout}>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.section}>
                        <label className={styles.label}>Book Title *</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Enter book title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            disabled={saving}
                            required
                        />
                    </div>

                    <div className={styles.section}>
                        <label className={styles.label}>Author</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Enter author name"
                            value={author}
                            onChange={e => setAuthor(e.target.value)}
                            disabled={saving}
                        />
                    </div>

                    <div className={styles.twoColumn}>
                        <div className={styles.section}>
                            <label className={styles.label}>Condition</label>
                            <select
                                className={styles.input}
                                value={condition}
                                onChange={e => setCondition(e.target.value)}
                                disabled={saving}
                            >
                                <option value="">Select condition</option>
                                {BOOK_CONDITIONS.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.section}>
                            <label className={styles.label}>Subject</label>
                            <select
                                className={styles.input}
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                disabled={saving}
                            >
                                <option value="">Select subject</option>
                                {BOOK_GENRES.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <label className={styles.label}>Description</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Add details about the book..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            disabled={saving}
                            rows={4}
                        />
                    </div>

                    <div className={styles.section}>
                        <label className={styles.label}>Images * ({combinedCount})</label>

                        {combinedCount > 0 && (
                            <div className={styles.photoGrid}>
                                {existingImages.map((url, i) => (
                                    <div key={`existing-${url}-${i}`} className={styles.photoThumb}>
                                        <img src={url} alt="" />
                                        <button
                                            type="button"
                                            className={styles.photoRemoveBtn}
                                            onClick={() => removeExistingImage(i)}
                                            disabled={saving}
                                            aria-label="Remove image"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {newPreviews.map((url, i) => (
                                    <div key={`new-${i}`} className={styles.photoThumb}>
                                        <img src={url} alt="" />
                                        <button
                                            type="button"
                                            className={styles.photoRemoveBtn}
                                            onClick={() => removeNewFile(i)}
                                            disabled={saving}
                                            aria-label="Remove image"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div
                            className={`${styles.uploadBox} ${isDragging ? styles.dragging : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                disabled={saving}
                                id="file-input"
                                className={styles.fileInput}
                            />
                            <label htmlFor="file-input" className={styles.uploadLabel}>
                                <Upload size={24} />
                                <span>Click or drag images here</span>
                            </label>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Button
                            type="submit"
                            disabled={!canSubmit}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>

                    <div className={styles.dangerZone}>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={saving || deleting}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center',
                                color: 'var(--error)',
                                borderColor: 'var(--error)',
                            }}
                        >
                            <Trash2 size={16} />
                            {deleting ? 'Deleting...' : 'Delete Publication'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}