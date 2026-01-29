import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  defaultCountryCode?: string;
}

const commonCountries = [
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { name: "Ireland", code: "IE", dialCode: "+353", flag: "🇮🇪" },
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { name: "New Zealand", code: "NZ", dialCode: "+64", flag: "🇳🇿" },
];

function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function PhoneInput({
  value,
  onChange,
  disabled = false,
  placeholder = "Enter phone number",
  className,
  defaultCountryCode = "GB",
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [countries, setCountries] = useState<Country[]>(commonCountries);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasLoadedAll, setHasLoadedAll] = useState(false);

  const parseValue = useMemo(() => {
    if (!value) {
      const defaultCountry = countries.find(c => c.code === defaultCountryCode) || countries[0];
      return { countryCode: defaultCountry.code, dialCode: defaultCountry.dialCode, phoneNumber: "" };
    }
    
    const trimmedValue = value.trim();
    
    for (const country of [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length)) {
      if (trimmedValue.startsWith(country.dialCode)) {
        const phoneNumber = trimmedValue.slice(country.dialCode.length).trim();
        return { countryCode: country.code, dialCode: country.dialCode, phoneNumber };
      }
    }
    
    if (trimmedValue.startsWith('+')) {
      const dialCodeMatch = trimmedValue.match(/^\+\d+/);
      if (dialCodeMatch) {
        const dialCode = dialCodeMatch[0];
        const phoneNumber = trimmedValue.slice(dialCode.length).trim();
        return { countryCode: "", dialCode, phoneNumber };
      }
    }
    
    const defaultCountry = countries.find(c => c.code === defaultCountryCode) || countries[0];
    return { countryCode: defaultCountry.code, dialCode: defaultCountry.dialCode, phoneNumber: trimmedValue };
  }, [value, countries, defaultCountryCode]);

  const selectedCountry = useMemo(() => {
    return countries.find(c => c.code === parseValue.countryCode) || 
           countries.find(c => c.dialCode === parseValue.dialCode) ||
           countries.find(c => c.code === defaultCountryCode) || 
           countries[0];
  }, [parseValue, countries, defaultCountryCode]);

  const loadAllCountries = async () => {
    if (hasLoadedAll || loading) return;
    
    setLoading(true);
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd');
      const data = await response.json();
      
      const allCountries: Country[] = data
        .filter((country: any) => country.idd?.root)
        .map((country: any) => {
          const dialCode = country.idd.root + (country.idd.suffixes?.[0] || '');
          return {
            name: country.name.common,
            code: country.cca2,
            dialCode: dialCode,
            flag: getCountryFlag(country.cca2),
          };
        })
        .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
      
      setCountries(allCountries);
      setHasLoadedAll(true);
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !hasLoadedAll) {
      loadAllCountries();
    }
  }, [open, hasLoadedAll]);

  const handleCountrySelect = (country: Country) => {
    const newValue = `${country.dialCode} ${parseValue.phoneNumber}`.trim();
    onChange(newValue);
    setOpen(false);
    setSearchQuery("");
  };

  const handlePhoneChange = (phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/^\s+/, '');
    const newValue = `${selectedCountry.dialCode} ${cleanPhone}`.trim();
    onChange(newValue);
  };

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(
      c => c.name.toLowerCase().includes(query) || 
           c.dialCode.includes(query) ||
           c.code.toLowerCase().includes(query)
    );
  }, [countries, searchQuery]);

  return (
    <div className={cn("flex gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[100px] sm:w-[120px] justify-between px-2 sm:px-3 shrink-0"
            disabled={disabled}
            data-testid="select-country-code"
          >
            <span className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm truncate">
              <span className="text-base">{selectedCountry.flag}</span>
              <span className="font-medium">{selectedCountry.dialCode}</span>
            </span>
            <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search country..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
              data-testid="input-country-search"
            />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {filteredCountries.map((country) => (
                      <CommandItem
                        key={country.code}
                        value={`${country.name} ${country.dialCode} ${country.code}`}
                        onSelect={() => handleCountrySelect(country)}
                        className="cursor-pointer"
                        data-testid={`select-country-${country.code}`}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCountry.code === country.code ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="mr-2 text-base">{country.flag}</span>
                        <span className="flex-1 truncate">{country.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">{country.dialCode}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <Input
        type="tel"
        placeholder={placeholder}
        value={parseValue.phoneNumber}
        onChange={(e) => handlePhoneChange(e.target.value)}
        disabled={disabled}
        className={cn("flex-1", disabled && "bg-muted cursor-not-allowed")}
        data-testid="input-phone-number"
      />
    </div>
  );
}
