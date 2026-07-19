import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { PublicationService } from '@readme/shared/src/services/publications';
import { UsersService } from '@readme/shared/src/services/users';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { BOOK_CONDITIONS, BOOK_GENRES } from '@readme/shared/src/constants/bookOptions';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Spinner from '../../components/Spinner.jsx';
import Button from '../../components/Button.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useToast } from '../../contexts/ToastContext';
import styles from './CreatePublication.module.css';

export default function CreatePublication() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [, showToast] = useToast(3000);

    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [condition, setCondition] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    if (!currentUser) return <Spinner center label="Loading" />;

    const canSubmit = title.trim() && author.trim() && selectedFiles.length > 0 && !loading;

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
            // PublicationService.createPublication reads seller name/avatar off
            // the passed user object via UsersService.getDisplayName/getAvatarUrl,
            // which look for .username/.fullName/.photoURL — fields that live on
            // the Firestore profile, not the raw Firebase Auth user, so merge them in.
            const userProfile = await UsersService.fetchUserProfile(currentUser.uid).catch(() => null);
            const sellerUser = { ...currentUser, ...userProfile };

            await PublicationService.createPublication(
                sellerUser,
                {
                    bookName: title.trim(),
                    authorName: author.trim() || 'Unknown Author',
                    condition: condition.trim(),
                    subject: subject.trim(),
                    description: description.trim(),
                },
                selectedFiles,
            );

            showToast('Publication created!');
            navigate(`${WEB_ROUTES.EXPLORE}?tab=books`);
        } catch (error) {
            showToast('Failed to create publication. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.page}>

            <PageHeader onBack={() => navigate(-1)} title="New Publication" />

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
                        <select
                            className={styles.input}
                            value={condition}
                            onChange={e => setCondition(e.target.value)}
                            disabled={loading}
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
                            disabled={loading}
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
        </div>
    );
}
