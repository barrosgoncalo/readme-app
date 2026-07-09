import { toMillis } from './timestamp';

export function timeAgo(date) {
    const time = toMillis(date);
    if (!time) return '';

    const now = Date.now();
    const diffSecs = Math.floor((now - time) / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(time).toLocaleDateString();
}
