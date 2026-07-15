import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import styles from './DateTimePicker.module.css';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(n) {
    return String(n).padStart(2, '0');
}

function buildCalendarDays(year, month) {
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
}

function sameDay(a, b) {
    return a && b && a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// value/onChange use the same "yyyy-MM-ddTHH:mm" shape as <input type="datetime-local">.
export default function DateTimePicker({ value, onChange }) {
    const selected = value ? new Date(value) : null;
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState((selected || new Date()).getFullYear());
    const [viewMonth, setViewMonth] = useState((selected || new Date()).getMonth());
    const [hour, setHour] = useState(selected ? selected.getHours() : 12);
    const [minute, setMinute] = useState(selected ? selected.getMinutes() : 0);
    const containerRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function commit(day, h, m) {
        const next = new Date(viewYear, viewMonth, day, h, m);
        const iso = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(h)}:${pad(m)}`;
        onChange(iso);
    }

    function handleDayClick(day) {
        if (!day) return;
        commit(day, hour, minute);
    }

    function handleHourChange(h) {
        setHour(h);
        if (selected) commit(selected.getDate(), h, minute);
    }

    function handleMinuteChange(m) {
        setMinute(m);
        if (selected) commit(selected.getDate(), hour, m);
    }

    function goToPrevMonth() {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(y => y - 1);
        } else {
            setViewMonth(m => m - 1);
        }
    }

    function goToNextMonth() {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(y => y + 1);
        } else {
            setViewMonth(m => m + 1);
        }
    }

    const days = buildCalendarDays(viewYear, viewMonth);
    const displayLabel = selected
        ? `${MONTH_NAMES[selected.getMonth()]} ${selected.getDate()}, ${selected.getFullYear()} · ${pad(selected.getHours())}:${pad(selected.getMinutes())}`
        : '';

    return (
        <div className={styles.wrapper} ref={containerRef}>
            <button
                type="button"
                className={styles.trigger}
                onClick={() => setOpen(o => !o)}
            >
                <Calendar size={16} className={styles.triggerIcon} />
                <span className={displayLabel ? styles.triggerValue : styles.triggerPlaceholder}>
                    {displayLabel || 'Select date & time'}
                </span>
            </button>

            {open && (
                <div className={styles.popover}>
                    <div className={styles.calendarHeader}>
                        <button type="button" className={styles.navBtn} onClick={goToPrevMonth} aria-label="Previous month">
                            <ChevronLeft size={16} />
                        </button>
                        <span className={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
                        <button type="button" className={styles.navBtn} onClick={goToNextMonth} aria-label="Next month">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className={styles.weekdayRow}>
                        {WEEKDAYS.map(w => (
                            <span key={w} className={styles.weekday}>{w}</span>
                        ))}
                    </div>

                    <div className={styles.dayGrid}>
                        {days.map((day, i) => {
                            const dayDate = day ? new Date(viewYear, viewMonth, day) : null;
                            const isSelected = day && sameDay(dayDate, selected);
                            const isToday = day && sameDay(dayDate, new Date());

                            return (
                                <button
                                    type="button"
                                    key={i}
                                    className={`${styles.day} ${!day ? styles.dayEmpty : ''} ${isSelected ? styles.daySelected : ''} ${isToday && !isSelected ? styles.dayToday : ''}`}
                                    disabled={!day}
                                    onClick={() => handleDayClick(day)}
                                >
                                    {day || ''}
                                </button>
                            );
                        })}
                    </div>

                    <div className={styles.timeRow}>
                        <select
                            className={styles.timeSelect}
                            value={hour}
                            onChange={(e) => handleHourChange(Number(e.target.value))}
                            aria-label="Hour"
                        >
                            {Array.from({ length: 24 }, (_, h) => (
                                <option key={h} value={h}>{pad(h)}</option>
                            ))}
                        </select>
                        <span className={styles.timeSeparator}>:</span>
                        <select
                            className={styles.timeSelect}
                            value={minute}
                            onChange={(e) => handleMinuteChange(Number(e.target.value))}
                            aria-label="Minute"
                        >
                            {Array.from({ length: 12 }, (_, i) => i * 5).map(m => (
                                <option key={m} value={m}>{pad(m)}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        className={styles.doneBtn}
                        onClick={() => setOpen(false)}
                        disabled={!selected}
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    );
}
