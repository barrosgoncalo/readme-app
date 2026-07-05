import {useNavigate} from 'react-router-dom';
import styles from './TradeCard.module.css';
import {WEB_ROUTES} from '../../../constants/webRoutes';

export default function TradeCard({trade}) {
    const navigate = useNavigate();

    const {bookId, coverUrl, ownerUid, ownerUsername, ownerAvatar} = trade;

    const handleUserClick = (e) => {
        e.stopPropagation();

        navigate(WEB_ROUTES.userProfile(ownerUid));
    };

    const handleBookClick = () => {
        navigate(`${WEB_ROUTES.bookDetail(bookId)}?owner=${ownerUid}`);
    };

    return (
        <div className={styles.tradeCard}>

            {/* 1. Secção do Dono do Livro */}
            <div className={styles.userRow} onClick={handleUserClick}>
                {ownerAvatar ? (
                    <img src={ownerAvatar} alt={ownerUsername} className={styles.avatar}/>
                ) : (
                    <div className={styles.avatar}/>
                )}
                <span className={styles.username}>@{ownerUsername}</span>
            </div>

            {/* 2. Secção da Capa do Livro */}
            <div className={styles.bookCoverContainer} onClick={handleBookClick}>
                {coverUrl ? (
                    <img src={coverUrl} alt="Book cover" className={styles.bookCover}/>
                ) : (
                    <div className={styles.bookCover}/>
                )}
            </div>

        </div>
    );
}