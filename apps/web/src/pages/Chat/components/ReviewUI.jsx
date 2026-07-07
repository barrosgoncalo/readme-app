import { useState } from 'react';
import { Star } from 'lucide-react';
import ActionCard from './ActionCard.jsx';
import styles from './ReviewUI.module.css';

export default function ReviewUI({ onSubmit, busy }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    function handleSubmit() {
        if (rating === 0) return;
        onSubmit(rating, comment);
    }

    const canSubmit = rating > 0 && !busy;

    return (
        <ActionCard prompt="Rate this swap">
            <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <button
                        key={i}
                        className={styles.starBtn}
                        onClick={() => setRating(i)}
                        onMouseEnter={() => setHoverRating(i)}
                        onMouseLeave={() => setHoverRating(0)}
                        disabled={busy}
                        aria-label={`Rate ${i} stars`}
                    >
                        <Star
                            size={24}
                            fill={i <= (hoverRating || rating) ? 'currentColor' : 'none'}
                            className={i <= (hoverRating || rating) ? styles.filled : ''}
                        />
                    </button>
                ))}
            </div>

            <textarea
                placeholder="Add a comment (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={styles.comment}
                disabled={busy}
                rows={3}
            />

            <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={styles.submitBtn}
            >
                {busy ? 'Submitting...' : 'Submit Review'}
            </button>
        </ActionCard>
    );
}
