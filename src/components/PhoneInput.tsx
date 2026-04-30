"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";

interface Country {
  name: string;
  dialCode: string;
  flag: string;
  code: string;
}

interface PhoneInputProps {
  value: string;           // full E.164 value like "+919876543210"
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  style?: React.CSSProperties;
}

// Fetch and normalise country list from restcountries
async function fetchCountries(): Promise<Country[]> {
  const res = await fetch(
    "https://restcountries.com/v3.1/all?fields=name,idd,flag,cca2",
    { next: { revalidate: 86400 } } as RequestInit
  );
  const data: Array<{
    name: { common: string };
    idd: { root?: string; suffixes?: string[] };
    flag: string;
    cca2: string;
  }> = await res.json();

  return data
    .filter((c) => c.idd?.root && c.idd?.suffixes?.length)
    .map((c) => {
      const suffix = c.idd.suffixes!.length === 1 ? c.idd.suffixes![0] : "";
      return {
        name: c.name.common,
        dialCode: `${c.idd.root}${suffix}`,
        flag: c.flag,
        code: c.cca2,
      };
    })
    .filter((c) => /^\+\d+$/.test(c.dialCode))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Detect default country from browser locale
function guessDialCode(countries: Country[]): Country {
  try {
    const locale = navigator.language || "en-IN";
    const region = locale.split("-")[1]?.toUpperCase();
    const match = countries.find((c) => c.code === region);
    if (match) return match;
  } catch {}
  return countries.find((c) => c.code === "IN") || countries[0];
}

const INDIA_DEFAULT: Country = { name: "India", dialCode: "+91", flag: "🇮🇳", code: "IN" };

export default function PhoneInput({
  value,
  onChange,
  placeholder = "Phone number",
  required,
  style,
}: PhoneInputProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selected, setSelected] = useState<Country | null>(INDIA_DEFAULT);
  const [localNumber, setLocalNumber] = useState("");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load country list once
  useEffect(() => {
    fetchCountries().then((list) => {
      setCountries(list);
      if (!selected) {
        const def = guessDialCode(list);
        setSelected(def);
        // If there's already a value, parse it
        if (value && value.startsWith("+")) {
          const match = list.find((c) => value.startsWith(c.dialCode));
          if (match) {
            setSelected(match);
            setLocalNumber(value.slice(match.dialCode.length).replace(/\s/g, ""));
          }
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Propagate combined value upward
  const emitChange = (country: Country, number: string) => {
    const digits = number.replace(/\D/g, "");
    onChange(digits ? `${country.dialCode}${digits}` : "");
  };

  const handleCountrySelect = (country: Country) => {
    setSelected(country);
    setOpen(false);
    setSearch("");
    emitChange(country, localNumber);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d\s\-]/g, "");
    setLocalNumber(raw);
    if (selected) emitChange(selected, raw);
  };

  const filtered = useMemo(
    () =>
      countries.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dialCode.includes(search)
      ),
    [countries, search]
  );

  const base: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    color: "#fafafa",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
    ...style,
  };

  return (
    <div style={{ display: "flex", gap: 8, position: "relative" }} ref={dropdownRef}>
      {/* Country dial-code selector */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...base,
          padding: "11px 10px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{selected?.flag ?? "🌐"}</span>
        <span style={{ color: "#a1a1aa", fontSize: 13 }}>{selected?.dialCode ?? "+"}</span>
        <ChevronDown size={13} color="#52525b" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 50,
            width: 280,
            maxHeight: 300,
            overflowY: "auto",
            background: "#18181b",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* Search */}
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              position: "sticky",
              top: 0,
              background: "#18181b",
            }}
          >
            <Search size={14} color="#52525b" />
            <input
              autoFocus
              type="text"
              placeholder="Search country or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "#fafafa",
                fontSize: 13,
                width: "100%",
              }}
            />
          </div>

          {/* Country list */}
          {filtered.length === 0 ? (
            <div style={{ padding: "12px 16px", color: "#52525b", fontSize: 13 }}>
              No results
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={`${c.code}-${c.dialCode}`}
                type="button"
                onClick={() => handleCountrySelect(c)}
                style={{
                  width: "100%",
                  padding: "9px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background:
                    selected?.code === c.code ? "rgba(124,58,237,0.15)" : "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 17 }}>{c.flag}</span>
                <span style={{ flex: 1, fontSize: 13, color: "#d4d4d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.name}
                </span>
                <span style={{ fontSize: 12, color: "#71717a", flexShrink: 0 }}>
                  {c.dialCode}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Number input */}
      <input
        type="tel"
        value={localNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        required={required}
        style={{ ...base, flex: 1, padding: "11px 14px", boxSizing: "border-box" }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(139,92,246,0.5)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
      />
    </div>
  );
}
