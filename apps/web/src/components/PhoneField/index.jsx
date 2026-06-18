import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { COUNTRIES } from './countryCodes.js';

const Flag = ({ code }) => (
    <img
        src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`}
        srcSet={`https://flagcdn.com/w40/${code.toLowerCase()}.png 2x`}
        width="20"
        height="15"
        alt={code}
        className={styles.flagImg}
    />
);
import styles from './PhoneField.module.css';

export default function PhoneField({ country, onCountryChange, value, onChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);

    const filtered = search.trim()
        ? COUNTRIES.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.dial.includes(search)
          )
        : COUNTRIES;

    useEffect(() => {
        if (open && searchRef.current) searchRef.current.focus();
    }, [open]);

    useEffect(() => {
        function onClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
                setSearch('');
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    function select(c) {
        onCountryChange(c);
        setOpen(false);
        setSearch('');
    }

    return (
        <div className={styles.wrap}>
            <label className={styles.label}>Phone number</label>
            <div className={styles.inputRow}>

                {/* Country picker trigger */}
                <div className={styles.pickerWrap} ref={dropdownRef}>
                    <button
                        type="button"
                        className={styles.pickerBtn}
                        onClick={() => setOpen(o => !o)}
                        aria-label="Select country code"
                    >
                        <Flag code={country.code} />
                        <span className={styles.dial}>{country.dial}</span>
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
                                            className={`${styles.option} ${c.code === country.code ? styles.optionActive : ''}`}
                                            onClick={() => select(c)}
                                        >
                                            <Flag code={c.code} />
                                            <span className={styles.optionName}>{c.name}</span>
                                            <span className={styles.optionDial}>{c.dial}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Number input */}
                <input
                    type="tel"
                    className={styles.numberInput}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder="912 345 678"
                />
            </div>
        </div>
    );
}
