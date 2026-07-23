/**
 * PhoneInput — a type-safe, extensible international phone number input.
 * String-in / string-out: `value`/`onChange` deal only in a plain phone
 * string (E.164-ish, e.g. "+256701234567"). Country detection, splitting,
 * and formatting all happen internally.
 */

import { AngleDoubleDownSolid, CheckSolid, Search1Solid } from "@lineiconshq/free-icons";
import Lineicons from "@lineiconshq/react-lineicons";
import React, {
    useState,
    useRef,
    useEffect,
    useMemo,
    useCallback,
    forwardRef,
} from "react";

/* ------------------------------------------------------------------------------------------
 * 1. Base types — extend these, don't rewrite them
 * ---------------------------------------------------------------------------------------- */

export interface Country {
    iso2: string;
    name: string;
    dialCode: string;
    flag: string;
    maxLength?: number;
}

export interface CountryWithRegion extends Country {
    region: "Africa" | "Americas" | "Asia" | "Europe" | "Oceania" | "Middle East";
}

export interface PhoneInputProps<TCountry extends Country = Country> {
    countries?: TCountry[];
    /** Plain string value. Accepts "+2567...", "2567...", or bare national digits. */
    value?: string;
    /** Uncontrolled initial value, same format as `value`. */
    defaultValue?: string;
    defaultCountryIso2?: string;
    /** Fires with the new raw string value (E.164 formatted internally). */
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    name?: string;
    id?: string;
    renderCountryRow?: (country: TCountry, selected: boolean) => React.ReactNode;
    renderTrigger?: (country: TCountry) => React.ReactNode;
    className?: string;
    inputClassName?: string;
    autoFocus?: boolean;
}

/* ------------------------------------------------------------------------------------------
 * 2. Default country data
 * ---------------------------------------------------------------------------------------- */

export const DEFAULT_COUNTRIES: Country[] = [
    { iso2: "UG", name: "Uganda", dialCode: "256", flag: "🇺🇬", maxLength: 9 },
    { iso2: "US", name: "United States", dialCode: "1", flag: "🇺🇸", maxLength: 10 },
    { iso2: "GB", name: "United Kingdom", dialCode: "44", flag: "🇬🇧", maxLength: 10 },
    { iso2: "KE", name: "Kenya", dialCode: "254", flag: "🇰🇪", maxLength: 9 },
    { iso2: "TZ", name: "Tanzania", dialCode: "255", flag: "🇹🇿", maxLength: 9 },
    { iso2: "RW", name: "Rwanda", dialCode: "250", flag: "🇷🇼", maxLength: 9 },
    { iso2: "NG", name: "Nigeria", dialCode: "234", flag: "🇳🇬", maxLength: 10 },
    { iso2: "GH", name: "Ghana", dialCode: "233", flag: "🇬🇭", maxLength: 9 },
    { iso2: "ZA", name: "South Africa", dialCode: "27", flag: "🇿🇦", maxLength: 9 },
    { iso2: "EG", name: "Egypt", dialCode: "20", flag: "🇪🇬", maxLength: 10 },
    { iso2: "ET", name: "Ethiopia", dialCode: "251", flag: "🇪🇹", maxLength: 9 },
    { iso2: "IN", name: "India", dialCode: "91", flag: "🇮🇳", maxLength: 10 },
    { iso2: "PK", name: "Pakistan", dialCode: "92", flag: "🇵🇰", maxLength: 10 },
    { iso2: "CN", name: "China", dialCode: "86", flag: "🇨🇳", maxLength: 11 },
    { iso2: "JP", name: "Japan", dialCode: "81", flag: "🇯🇵", maxLength: 10 },
    { iso2: "KR", name: "South Korea", dialCode: "82", flag: "🇰🇷", maxLength: 10 },
    { iso2: "AE", name: "United Arab Emirates", dialCode: "971", flag: "🇦🇪", maxLength: 9 },
    { iso2: "SA", name: "Saudi Arabia", dialCode: "966", flag: "🇸🇦", maxLength: 9 },
    { iso2: "FR", name: "France", dialCode: "33", flag: "🇫🇷", maxLength: 9 },
    { iso2: "DE", name: "Germany", dialCode: "49", flag: "🇩🇪", maxLength: 11 },
    { iso2: "ES", name: "Spain", dialCode: "34", flag: "🇪🇸", maxLength: 9 },
    { iso2: "IT", name: "Italy", dialCode: "39", flag: "🇮🇹", maxLength: 10 },
    { iso2: "NL", name: "Netherlands", dialCode: "31", flag: "🇳🇱", maxLength: 9 },
    { iso2: "PT", name: "Portugal", dialCode: "351", flag: "🇵🇹", maxLength: 9 },
    { iso2: "SE", name: "Sweden", dialCode: "46", flag: "🇸🇪", maxLength: 9 },
    { iso2: "CH", name: "Switzerland", dialCode: "41", flag: "🇨🇭", maxLength: 9 },
    { iso2: "BR", name: "Brazil", dialCode: "55", flag: "🇧🇷", maxLength: 11 },
    { iso2: "MX", name: "Mexico", dialCode: "52", flag: "🇲🇽", maxLength: 10 },
    { iso2: "CA", name: "Canada", dialCode: "1", flag: "🇨🇦", maxLength: 10 },
    { iso2: "AU", name: "Australia", dialCode: "61", flag: "🇦🇺", maxLength: 9 },
    { iso2: "NZ", name: "New Zealand", dialCode: "64", flag: "🇳🇿", maxLength: 9 },
];

/* ------------------------------------------------------------------------------------------
 * 3. Internal string <-> {country, national} formatting
 * ---------------------------------------------------------------------------------------- */

/** Parse a raw string into {country, national}. Longest dialCode match wins. */
function parsePhoneString<TCountry extends Country>(
    raw: string,
    countries: TCountry[],
    fallback: TCountry
): { country: TCountry; national: string } {
    const digits = raw.replace(/[^\d]/g, "");
    if (!digits) return { country: fallback, national: "" };

    const hadPlus = raw.trim().startsWith("+");
    const candidates = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);

    if (hadPlus) {
        for (const c of candidates) {
            if (digits.startsWith(c.dialCode)) {
                return { country: c, national: digits.slice(c.dialCode.length) };
            }
        }
        return { country: fallback, national: digits };
    }

    // No leading '+': try matching dialCode prefix anyway (e.g. "256701...");
    // otherwise treat the whole thing as a national number under `fallback`.
    for (const c of candidates) {
        if (digits.startsWith(c.dialCode) && digits.length > c.dialCode.length) {
            return { country: c, national: digits.slice(c.dialCode.length) };
        }
    }
    return { country: fallback, national: digits };
}

function buildPhoneString(country: Country, national: string): string {
    const digits = national.replace(/\D/g, "");
    return digits ? `+${country.dialCode}${digits}` : "";
}

function useOutsideClick<T extends HTMLElement>(onOutside: () => void) {
    const ref = useRef<T>(null);
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onOutside]);
    return ref;
}

/* ------------------------------------------------------------------------------------------
 * 4. The base component — generic over TCountry, string in/out
 * ---------------------------------------------------------------------------------------- */

function PhoneInputInner<TCountry extends Country = Country>(
    {
        countries = DEFAULT_COUNTRIES as TCountry[],
        value,
        defaultValue,
        defaultCountryIso2 = "UG",
        onChange,
        placeholder = "Phone number",
        disabled = false,
        error,
        name,
        id,
        renderCountryRow,
        renderTrigger,
        className = "",
        inputClassName = "",
        autoFocus = false,
    }: PhoneInputProps<TCountry>,
    forwardedRef: React.Ref<HTMLInputElement>
) {
    const isControlled = value !== undefined;
    const fallbackCountry = useMemo(
        () =>
            countries.find((c) => c.iso2 === defaultCountryIso2) ??
            countries[0],
        [countries, defaultCountryIso2]
    );

    // Internal state always stores {country, national}; the public surface is a string.
    const initialParsed = parsePhoneString(defaultValue ?? "", countries, fallbackCountry);
    const [internalCountry, setInternalCountry] = useState<TCountry>(initialParsed.country);
    const [internalNational, setInternalNational] = useState<string>(initialParsed.national);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    // When controlled, re-derive country/national from the incoming string each render.
    useEffect(() => {
        if (!isControlled) return;

        const parsed = parsePhoneString(
            value ?? "",
            countries,
            fallbackCountry
        );

        setInternalCountry(parsed.country);
        setInternalNational(parsed.national);
    }, [value, countries, isControlled, fallbackCountry]);

    const country = internalCountry;
    const nationalNumber = internalNational;
    const containerRef = useOutsideClick<HTMLDivElement>(() => {
        setOpen(false);
        setQuery("");
    });

    const searchRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (open) searchRef.current?.focus();
    }, [open]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return countries;
        return countries.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.dialCode.includes(q) ||
                c.iso2.toLowerCase().includes(q)
        );
    }, [countries, query]);

    const emit = useCallback(
        (nextCountry: Country, nextNational: string) => {
            onChange?.(buildPhoneString(nextCountry, nextNational));
        },
        [onChange]
    );

    const selectCountry = (c: TCountry) => {
        // Always update the selected country immediately.
        setInternalCountry(c);

        setOpen(false);
        setQuery("");

        emit(c, nationalNumber);
    };

    const handleNumberChange = (raw: string) => {
        const cleaned = raw.replace(/[^\d\s-]/g, "");
        const capped = country.maxLength
            ? cleaned.slice(0, country.maxLength + Math.ceil(country.maxLength / 3))
            : cleaned;
        setInternalNational(capped);
        emit(country, capped);
    };

    return (
        <div className={`w-full ${className}`}>
            <div
                ref={containerRef}
                className={[
                    "relative flex items-stretch rounded border border-text/10 transition-colors",
                    error ? "border-red-400 " : "",
                    disabled ? "cursor-not-allowed opacity-70" : "",
                ].join(" ")}
            >
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    className={[
                        "flex shrink-0 items-center gap-1.5 rounded-l-xl px-3 py-2.5 h-14",
                        "disabled:hover:bg-transparent",
                        "border-r border-text/10 outline-none",
                    ].join(" ")}
                >
                    {renderTrigger ? (
                        renderTrigger(country)
                    ) : (
                        <>
                            <span className="text-lg leading-none">{country.flag}</span>
                            <span className="text-sm font-medium">+{country.dialCode}</span>
                        </>
                    )}
                    <Lineicons
                        icon={AngleDoubleDownSolid}
                        size={14}
                        className={`transition-transform ${open ? "rotate-180" : ""}`}
                    />
                </button>

                <input
                    ref={forwardedRef}
                    id={id}
                    name={name}
                    type="tel"
                    inputMode="tel"
                    autoFocus={autoFocus}
                    disabled={disabled}
                    placeholder={placeholder}
                    value={nationalNumber}
                    onChange={(e) => handleNumberChange(e.target.value)}
                    className={[
                        "w-full min-w-0 bg-transparent px-3 py-2.5 text-sm",
                        "placeholder: outline-none disabled:cursor-not-allowed",
                        inputClassName,
                    ].join(" ")}
                />

                {open && (
                    <div
                        role="listbox"
                        className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-72 w-72 overflow-hidden border border-text/10 bg-pale shadow-lg"
                    >
                        <div className="flex items-center gap-2 border-b border-text/10 px-3 py-2">
                            <Lineicons icon={Search1Solid} size={14} />
                            <input
                                ref={searchRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search country or code"
                                className="w-full bg-transparent text-sm outline-none"
                            />
                        </div>
                        <ul className="max-h-56 overflow-y-auto flex flex-col gap-1 py-1">
                            {filtered.length === 0 && (
                                <li className="px-3 py-4 text-center text-sm">No matches</li>
                            )}
                            {filtered.map((c) => {
                                const selected = c.iso2 === country.iso2;
                                return (
                                    <li key={c.iso2}>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={selected}
                                            onClick={() => selectCountry(c)}
                                            className={[
                                                "flex w-full items-center gap-2.5 px-3 py-2 text-left",
                                                "hover",
                                                selected ? "text-primary" : "",
                                            ].join(" ")}
                                        >
                                            {renderCountryRow ? (
                                                renderCountryRow(c, selected)
                                            ) : (
                                                <>
                                                    <span className="leading-none">{c.flag}</span>
                                                    <span className="flex-1 truncate">{c.name}</span>
                                                    <span className="text-xs">+{c.dialCode}</span>
                                                    {selected && (
                                                        <Lineicons icon={CheckSolid} size={14} className="text-indigo-500" />
                                                    )}
                                                </>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        </div>
    );
}

export const PhoneInput = forwardRef(PhoneInputInner) as <TCountry extends Country = Country>(
    props: PhoneInputProps<TCountry> & { ref?: React.Ref<HTMLInputElement> }
) => React.ReactElement;

/* ------------------------------------------------------------------------------------------
 * 5. Composed variants — still string-based
 * ---------------------------------------------------------------------------------------- */

export interface LabeledPhoneInputProps<TCountry extends Country = Country>
    extends PhoneInputProps<TCountry> {
    label: string;
    required?: boolean;
}

export function LabeledPhoneInput<TCountry extends Country = Country>({
    label,
    required,
    id,
    ...rest
}: LabeledPhoneInputProps<TCountry>) {
    const inputId = id ?? `phone-${label.replace(/\s+/g, "-").toLowerCase()}`;
    return (
        <div className="w-full">
            <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
                {label}
                {required && <span className="text-red-500"> *</span>}
            </label>
            <PhoneInput id={inputId} {...rest} />
        </div>
    );
}

export function CompactPhoneInput<TCountry extends Country = Country>(
    props: PhoneInputProps<TCountry>
) {
    return (
        <PhoneInput
            {...props}
            className={`max-w-xs ${props.className ?? ""}`}
            inputClassName={`py-1.5 text-xs ${props.inputClassName ?? ""}`}
        />
    );
}

export default PhoneInput;