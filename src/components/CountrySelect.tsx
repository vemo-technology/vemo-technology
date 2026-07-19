"use client";

import countriesRaw from "world-countries";

type CountrySelectProps = {
  label: string;
  value: string;
  onChange: (countryCode: string) => void;
  lang?: "fr" | "en";
};

type CountryOption = {
  name: string;
  code: string;
  flag: string;
};

function countryCodeToFlag(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}

const countries: CountryOption[] = countriesRaw
  .filter((country) => country.cca2 !== "EH")
  .map((country) => ({
    name: country.name.common,
    code: country.cca2,
    flag: country.flag || countryCodeToFlag(country.cca2),
  }))
  .sort((a, b) => {
    const priority = ["MA", "FR", "US", "CA", "GB", "ES", "IT", "DE", "AE", "SA"];
    const aIndex = priority.indexOf(a.code);
    const bIndex = priority.indexOf(b.code);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    return a.name.localeCompare(b.name);
  });

function findCountry(value: string) {
  return (
    countries.find((country) => country.code === value || country.name === value) ||
    countries.find((country) => country.code === "MA") ||
    countries[0]
  );
}

export default function CountrySelect({
  label,
  value,
  onChange,
}: CountrySelectProps) {
  const selected = findCountry(value || "MA");

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </span>

      <div className="relative">
        <select
          value={selected.code}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-4 pr-10 text-sm font-black outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
        >
          {countries.map((item) => (
            <option key={item.code} value={item.code}>
              {item.flag} {item.name}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
          ▼
        </span>
      </div>

      <p className="mt-2 text-xs font-black text-slate-500">
        {selected.flag} {selected.name}
      </p>
    </label>
  );
}
