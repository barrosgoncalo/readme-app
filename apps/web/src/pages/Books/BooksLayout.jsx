import { useParams } from 'react-router-dom';
import Books from './index.jsx';
import BookDetail from './BookDetail.jsx';

export default function BooksLayout() {
    const { bookId } = useParams();

    if (bookId) {
        return <BookDetail />;
    }

    return <Books />;
}
