import { useState, useRef, useEffect } from 'react';
import { searchAddresses } from '../utils/location';

export default function AddressAutocomplete({ value, onChange, inputStyle, placeholder, required }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const confirmedRef = useRef(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleChange(e) {
    confirmedRef.current = false;
    onChange(e.target.value);
    clearTimeout(debounceRef.current);
    if (!e.target.value.trim()) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchAddresses(e.target.value);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 400);
  }

  function handleSelect(item) {
    confirmedRef.current = true;
    onChange(item.label);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder || 'Start typing an address…'}
        style={inputStyle}
        autoComplete="off"
        spellCheck={false}
        required={required}
      />
      {open && suggestions.length > 0 && (
        <div style={styles.dropdown}>
          {suggestions.map((item, i) => (
            <div
              key={`${item.lat},${item.lng}`}
              onMouseDown={() => handleSelect(item)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(-1)}
              style={{ ...styles.item, background: hoveredIndex === i ? '#f5f3ff' : 'white' }}
            >
              <span style={styles.primary}>{item.short}</span>
              <span style={styles.secondary}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'white',
    border: '1px solid #dde3ea',
    borderTop: 'none',
    zIndex: 9999,
    boxShadow: '0 6px 24px rgba(0,0,0,0.10)',
    maxHeight: '280px',
    overflowY: 'auto',
  },
  item: {
    padding: '10px 14px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    borderBottom: '1px solid #f5f5f5',
    transition: 'background 0.1s',
  },
  primary: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1a1a2e',
    fontFamily: "'Poppins', sans-serif",
  },
  secondary: {
    fontSize: '11px',
    color: '#aaa',
    fontFamily: "'Poppins', sans-serif",
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};
