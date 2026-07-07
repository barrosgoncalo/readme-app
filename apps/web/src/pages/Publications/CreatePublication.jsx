import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@readme/shared/src/services/firebase.web';
import { createPublicationModel } from '@readme/shared/src/models/publication';
import { createPublication } from '@readme/shared/src/services/publications';
import { fetchUserProfile } from '@readme/shared/src/services/users';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Spinner from '../../components/Spinner.jsx';
import Button from '../../components/Button.jsx';
import { useToast } from '../../hooks/useToast';
import styles from './CreatePublication.module.css';

export default function CreatePublication() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [toast, showToast] = useToast(3000);

    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [condition, setCondition] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    if (!currentUser) return <Spinner center label="Loading" />;

    const canSubmit = title.trim() && selectedFiles.length > 0 && !loading;

    function handleFileChange(e) {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
    }

    function removeFile(index) {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!canSubmit) return;

        setLoading(true);
        try {
            const pubId = crypto.randomUUID();

            // Upload images to Firebase Storage
            const uploadedUrls = await Promise.all(
                selectedFiles.map(async (file, i) => {
                    const storageRef = ref(storage, `books/${pubId}/image_${i}`);
                    await uploadBytes(storageRef, file);
                    return getDownloadURL(storageRef);
                })
            );

            // Fetch current user profile for seller info
            const userProfile = await fetchUserProfile(currentUser.uid);

            // Create publication doc
            const pubData = createPublicationModel(
                currentUser.uid,
                userProfile?.username || currentUser.email || 'Anonymous Swapper',
                userProfile?.photoURL || null,
                {
                    title: title.trim(),
                    author: author.trim() || 'Unknown Author',
                    images: uploadedUrls,
                    bookId: crypto.randomUUID(),
                    condition: condition.trim(),
                    subject: subject.trim(),
                },
                description.trim()
            );

            await createPublication(pubId, pubData);
            showToast('Publication created!');
            navigate(`${WEB_ROUTES.MAP}?tab=books`);
        } catch (error) {
            showToast('Failed to create publication. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.page}>
            {toast && <div className={styles.toast}>{toast}</div>}

            <div className={styles.header}>
                <button
                    className={styles.backBtn}
                    onClick={() => navigate(-1)}
                    aria-label="Back"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className={styles.title}>New Publication</h1>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.section}>
                    <label className={styles.label}>Book Title *</label>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Enter book title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        disabled={loading}
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
                        disabled={loading}
                    />
                </div>

                <div className={styles.twoColumn}>
                    <div className={styles.section}>
                        <label className={styles.label}>Condition</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="e.g., Like new, Good"
                            value={condition}
                            onChange={e => setCondition(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className={styles.section}>
                        <label className={styles.label}>Subject</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="e.g., Fiction, Science"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Description</label>
                    <textarea
                        className={styles.textarea}
                        placeholder="Add details about the book..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        disabled={loading}
                        rows={4}
                    />
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Images * ({selectedFiles.length})</label>
                    <div className={styles.uploadBox}>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            disabled={loading}
                            id="file-input"
                            className={styles.fileInput}
                        />
                        <label htmlFor="file-input" className={styles.uploadLabel}>
                            <Upload size={24} />
                            <span>Click to select images</span>
                        </label>
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className={styles.fileList}>
                            {selectedFiles.map((file, i) => (
                                <div key={i} className={styles.fileItem}>
                                    <span className={styles.fileName}>{file.name}</span>
                                    <button
                                        type="button"
                                        className={styles.removeBtn}
                                        onClick={() => removeFile(i)}
                                        disabled={loading}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.actions}>
                    <Button
                        type="submit"
                        disabled={!canSubmit}
                    >
                        {loading ? 'Publishing...' : 'Publish'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
