import {useNavigate} from 'react-router-dom';
import styles from './TradeCard.module.css';
import {WEB_ROUTES} from '../../../constants/webRoutes';

export default function TradeCard({trade}) {
    const navigate = useNavigate();

    const {
        bookId, coverUrl, ownerUid, ownerUsername, ownerAvatar,
        title, authors, pages
    } = trade;

    const handleUserClick = (e) => {
        e.stopPropagation();

        navigate(WEB_ROUTES.userProfile(ownerUid));
    };

    const handleCardClick = () => {
        navigate(`${WEB_ROUTES.bookDetail(bookId)}?owner=${ownerUid}`);
    };

    return (
        <div className={styles.tradeCard} onClick={handleCardClick}>

            {/* Lado esquerdo: Capa do Livro */}
            <div className={styles.coverContainer}>
                {coverUrl ? (
                    <img src={coverUrl} alt={title} className={styles.cover}/>
                ) : (
                    <div className={styles.coverPlaceholder}/>
                )}
            </div>

            {/* Lado direito: Informações */}
            <div className={styles.infoContainer}>

                {/* Info do Livro */}
                <div className={styles.bookInfo}>
                    <h3 className={styles.title} title={title}>Title: {title}</h3>
                    <div className={styles.metaRow}>
                        <span className={styles.author} title={authors}>Author: {authors}</span>
                        <span className={styles.pages}>Pages: {pages}</span>
                    </div>
                </div>

                {/* Info do User */}
                <div className={styles.tradeInfo}>
                    <div className={styles.swapRow} onClick={handleUserClick}>
                        <span className={styles.swapText}>Swap by: {ownerUsername}</span>
                        {ownerAvatar ? (
                            <img src={ownerAvatar} alt={ownerUsername} className={styles.avatar}/>
                        ) : (
                            <div className={styles.avatarFallback}>
                                {ownerUsername?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}