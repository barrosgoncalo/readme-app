import { BookOpen } from 'lucide-react';

export default function BookCover({ coverUrl, imgClassName, placeholderClassName, iconSize = 24, alt = '' }) {
    if (coverUrl) {
        return <img src={coverUrl} alt={alt} className={imgClassName} />;
    }
    return (
        <div className={placeholderClassName} aria-hidden>
            <BookOpen size={iconSize} />
        </div>
    );
}
