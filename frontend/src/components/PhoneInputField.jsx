import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Phone } from 'lucide-react';

export const COUNTRIES = [
  { code: 'BR', name: 'Brasil', ddi: '+55', flag: '🇧🇷', placeholder: '(11) 99999-9999' },
  { code: 'US', name: 'Estados Unidos', ddi: '+1', flag: '🇺🇸', placeholder: '(555) 000-0000' },
  { code: 'PT', name: 'Portugal', ddi: '+351', flag: '🇵🇹', placeholder: '912 345 678' },
  { code: 'ES', name: 'Espanha', ddi: '+34', flag: '🇪🇸', placeholder: '612 34 56 78' },
  { code: 'GB', name: 'Reino Unido', ddi: '+44', flag: '🇬🇧', placeholder: '7911 123456' },
  { code: 'AR', name: 'Argentina', ddi: '+54', flag: '🇦🇷', placeholder: '9 11 1234-5678' },
  { code: 'FR', name: 'França', ddi: '+33', flag: '🇫🇷', placeholder: '06 12 34 56 78' },
  { code: 'DE', name: 'Alemanha', ddi: '+49', flag: '🇩🇪', placeholder: '0151 1234567' },
  { code: 'IT', name: 'Itália', ddi: '+39', flag: '🇮🇹', placeholder: '312 345 6789' },
  { code: 'MX', name: 'México', ddi: '+52', flag: '🇲🇽', placeholder: '55 1234 5678' },
  { code: 'CL', name: 'Chile', ddi: '+56', flag: '🇨🇱', placeholder: '9 1234 5678' },
  { code: 'CO', name: 'Colômbia', ddi: '+57', flag: '🇨🇴', placeholder: '300 123 4567' },
  { code: 'UY', name: 'Uruguai', ddi: '+598', flag: '🇺🇾', placeholder: '99 123 456' },
  { code: 'PY', name: 'Paraguai', ddi: '+595', flag: '🇵🇾', placeholder: '981 123 456' },
  { code: 'JP', name: 'Japão', ddi: '+81', flag: '🇯🇵', placeholder: '90 1234 5678' },
  { code: 'AU', name: 'Austrália', ddi: '+61', flag: '🇦🇺', placeholder: '412 345 678' },
];

export default function PhoneInputField({
  value = '',
  onChange,
  label = 'WhatsApp',
  required = false,
  testId = 'phone-input-field',
}) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Brasil padrão
  const [localNumber, setLocalNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formatação para máscara brasileira
  const formatPhone = (val, countryCode) => {
    const numbers = val.replace(/\D/g, '');
    if (countryCode === 'BR') {
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      if (numbers.length <= 10) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
      }
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
    return val;
  };

  const handleNumberChange = (e) => {
    const raw = e.target.value;
    const formatted = formatPhone(raw, selectedCountry.code);
    setLocalNumber(formatted);
    if (onChange) {
      const full = formatted.trim() ? `${selectedCountry.ddi} ${formatted.trim()}` : '';
      onChange(full);
    }
  };

  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch('');
    if (onChange && localNumber) {
      onChange(`${country.ddi} ${localNumber.trim()}`);
    }
  };

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.ddi.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }} ref={containerRef} data-testid={testId}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginBottom: 8,
            fontWeight: 500,
          }}
        >
          {label} {required && <span style={{ color: 'var(--color-secondary)' }}>*</span>}
        </label>
      )}

      <div style={{ display: 'flex', position: 'relative' }}>
        {/* Botão Dropdown DDI com Bandeira */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '12px 14px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            borderRight: 'none',
            borderTopLeftRadius: 'var(--radius-md)',
            borderBottomLeftRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
            transition: 'var(--transition-smooth)',
            flexShrink: 0,
          }}
          data-testid="ddi-dropdown-trigger"
          aria-label="Selecionar país do WhatsApp"
        >
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }} data-testid="selected-flag">
            {selectedCountry.flag}
          </span>
          <span data-testid="selected-ddi">{selectedCountry.ddi}</span>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        </button>

        {/* Input do Número de Telefone */}
        <div style={{ position: 'relative', flex: 1 }}>
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              display: 'flex',
            }}
          >
            <Phone size={15} />
          </span>
          <input
            type="tel"
            name="invite_admin_whatsapp"
            autoComplete="off"
            value={localNumber}
            onChange={handleNumberChange}
            placeholder={selectedCountry.placeholder}
            className="input-field"
            style={{
              paddingLeft: 36,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              animation: 'none',
              transition: 'none',
            }}
            data-testid="input-whatsapp-number"
            required={required}
          />
        </div>
      </div>

      {/* Menu Dropdown de Seleção de Países */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '280px',
            maxHeight: '260px',
            background: '#0d111c',
            border: '1px solid var(--border-color-glow)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8)',
            zIndex: 200,
            overflowY: 'auto',
            padding: '8px',
          }}
          data-testid="ddi-dropdown-menu"
        >
          {/* Busca de País */}
          <div style={{ marginBottom: 6, padding: '2px 4px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar país ou DDI..."
              style={{
                width: '100%',
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                outline: 'none',
              }}
              autoFocus
              data-testid="ddi-search-input"
            />
          </div>

          {filteredCountries.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleSelectCountry(c)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: selectedCountry.code === c.code ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                textAlign: 'left',
                transition: 'background 0.2s',
              }}
              data-testid={`country-option-${c.code.toLowerCase()}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.1rem' }}>{c.flag}</span>
                <span>{c.name}</span>
              </div>
              <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{c.ddi}</span>
            </button>
          ))}

          {filteredCountries.length === 0 && (
            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Nenhum país encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}
