import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { COUNTRIES } from './PhoneField/countryCodes.js';
import styles from './CountryField.module.css';

const Flag = ({ code }) => (
    <img
        src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`}
        srcSet={`https://flagcdn.com/w40/${code.toLowerCase()}.png 2x`}
        width="20"
        height="15"
        alt=""
        className={styles.flagImg}
    />
);

export default function CountryField({ label = 'Country', value, onChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapRef = useRef(null);
    const searchRef = useRef(null);

    const selected = COUNTRIES.find(c => c.name === value);

    const filtered = search.trim()
        ? COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        : COUNTRIES;

    useEffect(() => {
        if (open && searchRef.current) searchRef.current.focus();
    }, [open]);

    useEffect(() => {
        function onClickOutside(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
                setSearch('');
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    function select(c) {
        onChange(c.name);
        setOpen(false);
        setSearch('');
    }

    return (
        <div className={styles.field}>
            <span className={styles.label}>{label}</span>
            <div className={styles.wrap} ref={wrapRef}>
                <button
                    type="button"
                    className={styles.trigger}
                    onClick={() => setOpen(o => !o)}
                    aria-label="Select country"
                >
                    {selected ? (
                        <>
                            <Flag code={selected.code} />
                            <span className={styles.name}>{selected.name}</span>
                        </>
                    ) : (
                        <span className={styles.placeholder}>Select country</span>
                    )}
                    <ChevronDown size={14} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
                </button>

                {open && (
                    <div className={styles.dropdown}>
                        <div className={styles.searchWrap}>
                            <input
                                ref={searchRef}
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search country…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <ul className={styles.list}>
                            {filtered.length === 0 && (
                                <li className={styles.empty}>No results</li>
                            )}
                            {filtered.map(c => (
                                <li key={c.code}>
                                    <button
                                        type="button"
                                        className={`${styles.option} ${c.name === value ? styles.optionActive : ''}`}
                                        onClick={() => select(c)}
                                    >
                                        <Flag code={c.code} />
                                        <span className={styles.optionName}>{c.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
