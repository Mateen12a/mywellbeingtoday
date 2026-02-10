import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";

const COUNTRIES = [
  { name: "Afghanistan", code: "AF" }, { name: "Albania", code: "AL" }, { name: "Algeria", code: "DZ" },
  { name: "Andorra", code: "AD" }, { name: "Angola", code: "AO" }, { name: "Argentina", code: "AR" },
  { name: "Armenia", code: "AM" }, { name: "Australia", code: "AU" }, { name: "Austria", code: "AT" },
  { name: "Azerbaijan", code: "AZ" }, { name: "Bahamas", code: "BS" }, { name: "Bahrain", code: "BH" },
  { name: "Bangladesh", code: "BD" }, { name: "Barbados", code: "BB" }, { name: "Belarus", code: "BY" },
  { name: "Belgium", code: "BE" }, { name: "Belize", code: "BZ" }, { name: "Benin", code: "BJ" },
  { name: "Bhutan", code: "BT" }, { name: "Bolivia", code: "BO" }, { name: "Bosnia and Herzegovina", code: "BA" },
  { name: "Botswana", code: "BW" }, { name: "Brazil", code: "BR" }, { name: "Brunei", code: "BN" },
  { name: "Bulgaria", code: "BG" }, { name: "Burkina Faso", code: "BF" }, { name: "Burundi", code: "BI" },
  { name: "Cambodia", code: "KH" }, { name: "Cameroon", code: "CM" }, { name: "Canada", code: "CA" },
  { name: "Cape Verde", code: "CV" }, { name: "Central African Republic", code: "CF" }, { name: "Chad", code: "TD" },
  { name: "Chile", code: "CL" }, { name: "China", code: "CN" }, { name: "Colombia", code: "CO" },
  { name: "Comoros", code: "KM" }, { name: "Congo", code: "CG" }, { name: "Costa Rica", code: "CR" },
  { name: "Croatia", code: "HR" }, { name: "Cuba", code: "CU" }, { name: "Cyprus", code: "CY" },
  { name: "Czech Republic", code: "CZ" }, { name: "Denmark", code: "DK" }, { name: "Djibouti", code: "DJ" },
  { name: "Dominican Republic", code: "DO" }, { name: "DR Congo", code: "CD" }, { name: "Ecuador", code: "EC" },
  { name: "Egypt", code: "EG" }, { name: "El Salvador", code: "SV" }, { name: "Equatorial Guinea", code: "GQ" },
  { name: "Eritrea", code: "ER" }, { name: "Estonia", code: "EE" }, { name: "Eswatini", code: "SZ" },
  { name: "Ethiopia", code: "ET" }, { name: "Fiji", code: "FJ" }, { name: "Finland", code: "FI" },
  { name: "France", code: "FR" }, { name: "Gabon", code: "GA" }, { name: "Gambia", code: "GM" },
  { name: "Georgia", code: "GE" }, { name: "Germany", code: "DE" }, { name: "Ghana", code: "GH" },
  { name: "Greece", code: "GR" }, { name: "Guatemala", code: "GT" }, { name: "Guinea", code: "GN" },
  { name: "Guinea-Bissau", code: "GW" }, { name: "Guyana", code: "GY" }, { name: "Haiti", code: "HT" },
  { name: "Honduras", code: "HN" }, { name: "Hungary", code: "HU" }, { name: "Iceland", code: "IS" },
  { name: "India", code: "IN" }, { name: "Indonesia", code: "ID" }, { name: "Iran", code: "IR" },
  { name: "Iraq", code: "IQ" }, { name: "Ireland", code: "IE" }, { name: "Israel", code: "IL" },
  { name: "Italy", code: "IT" }, { name: "Ivory Coast", code: "CI" }, { name: "Jamaica", code: "JM" },
  { name: "Japan", code: "JP" }, { name: "Jordan", code: "JO" }, { name: "Kazakhstan", code: "KZ" },
  { name: "Kenya", code: "KE" }, { name: "Kiribati", code: "KI" }, { name: "Kosovo", code: "XK" },
  { name: "Kuwait", code: "KW" }, { name: "Kyrgyzstan", code: "KG" }, { name: "Laos", code: "LA" },
  { name: "Latvia", code: "LV" }, { name: "Lebanon", code: "LB" }, { name: "Lesotho", code: "LS" },
  { name: "Liberia", code: "LR" }, { name: "Libya", code: "LY" }, { name: "Liechtenstein", code: "LI" },
  { name: "Lithuania", code: "LT" }, { name: "Luxembourg", code: "LU" }, { name: "Madagascar", code: "MG" },
  { name: "Malawi", code: "MW" }, { name: "Malaysia", code: "MY" }, { name: "Maldives", code: "MV" },
  { name: "Mali", code: "ML" }, { name: "Malta", code: "MT" }, { name: "Mauritania", code: "MR" },
  { name: "Mauritius", code: "MU" }, { name: "Mexico", code: "MX" }, { name: "Moldova", code: "MD" },
  { name: "Monaco", code: "MC" }, { name: "Mongolia", code: "MN" }, { name: "Montenegro", code: "ME" },
  { name: "Morocco", code: "MA" }, { name: "Mozambique", code: "MZ" }, { name: "Myanmar", code: "MM" },
  { name: "Namibia", code: "NA" }, { name: "Nepal", code: "NP" }, { name: "Netherlands", code: "NL" },
  { name: "New Zealand", code: "NZ" }, { name: "Nicaragua", code: "NI" }, { name: "Niger", code: "NE" },
  { name: "Nigeria", code: "NG" }, { name: "North Korea", code: "KP" }, { name: "North Macedonia", code: "MK" },
  { name: "Norway", code: "NO" }, { name: "Oman", code: "OM" }, { name: "Pakistan", code: "PK" },
  { name: "Palestine", code: "PS" }, { name: "Panama", code: "PA" }, { name: "Papua New Guinea", code: "PG" },
  { name: "Paraguay", code: "PY" }, { name: "Peru", code: "PE" }, { name: "Philippines", code: "PH" },
  { name: "Poland", code: "PL" }, { name: "Portugal", code: "PT" }, { name: "Qatar", code: "QA" },
  { name: "Romania", code: "RO" }, { name: "Russia", code: "RU" }, { name: "Rwanda", code: "RW" },
  { name: "Saudi Arabia", code: "SA" }, { name: "Senegal", code: "SN" }, { name: "Serbia", code: "RS" },
  { name: "Sierra Leone", code: "SL" }, { name: "Singapore", code: "SG" }, { name: "Slovakia", code: "SK" },
  { name: "Slovenia", code: "SI" }, { name: "Somalia", code: "SO" }, { name: "South Africa", code: "ZA" },
  { name: "South Korea", code: "KR" }, { name: "South Sudan", code: "SS" }, { name: "Spain", code: "ES" },
  { name: "Sri Lanka", code: "LK" }, { name: "Sudan", code: "SD" }, { name: "Suriname", code: "SR" },
  { name: "Sweden", code: "SE" }, { name: "Switzerland", code: "CH" }, { name: "Syria", code: "SY" },
  { name: "Taiwan", code: "TW" }, { name: "Tajikistan", code: "TJ" }, { name: "Tanzania", code: "TZ" },
  { name: "Thailand", code: "TH" }, { name: "Timor-Leste", code: "TL" }, { name: "Togo", code: "TG" },
  { name: "Trinidad and Tobago", code: "TT" }, { name: "Tunisia", code: "TN" }, { name: "Turkey", code: "TR" },
  { name: "Turkmenistan", code: "TM" }, { name: "Uganda", code: "UG" }, { name: "Ukraine", code: "UA" },
  { name: "United Arab Emirates", code: "AE" }, { name: "United Kingdom", code: "GB" }, { name: "United States", code: "US" },
  { name: "Uruguay", code: "UY" }, { name: "Uzbekistan", code: "UZ" }, { name: "Venezuela", code: "VE" },
  { name: "Vietnam", code: "VN" }, { name: "Yemen", code: "YE" }, { name: "Zambia", code: "ZM" },
  { name: "Zimbabwe", code: "ZW" }
];

export default function CountrySelect({ value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search) return COUNTRIES;
    const lower = search.toLowerCase();
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(lower) || c.code.toLowerCase().includes(lower));
  }, [search]);

  const selected = COUNTRIES.find(c => c.name === value);
  const flagUrl = (code) => `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border transition-colors ${
          disabled
            ? "bg-[var(--color-bg-secondary)] cursor-not-allowed border-[var(--color-border)]"
            : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary-light)]"
        }`}
      >
        {selected ? (
          <span className="flex items-center gap-2 text-[var(--color-text)]">
            <img src={flagUrl(selected.code)} alt="" className="w-6 h-4 object-cover rounded-sm" />
            {selected.name}
          </span>
        ) : (
          <span className="text-[var(--color-text-muted)]">Select country</span>
        )}
        <ChevronDown size={18} className={`text-[var(--color-text-secondary)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl max-h-80 overflow-hidden animate-scale-in">
          <div className="sticky top-0 bg-[var(--color-surface)] p-2 border-b border-[var(--color-border)]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search countries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-[var(--color-bg-secondary)] border-none text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          
          <ul className="overflow-y-auto max-h-60 py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-center text-[var(--color-text-muted)]">No countries found</li>
            ) : (
              filtered.map((country) => (
                <li
                  key={country.code}
                  onClick={() => {
                    onChange(country.name);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                    country.name === value
                      ? "bg-[var(--color-primary-light)]/10 text-[var(--color-primary-light)]"
                      : "text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]"
                  }`}
                >
                  <img src={flagUrl(country.code)} alt="" className="w-6 h-4 object-cover rounded-sm" />
                  <span className="font-medium">{country.name}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
