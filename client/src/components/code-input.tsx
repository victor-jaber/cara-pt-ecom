import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";

interface CodeInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    error?: boolean;
}

export function CodeInput({
    length = 6,
    value,
    onChange,
    onComplete,
    error = false
}: CodeInputProps) {
    const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Sync value with digits
    useEffect(() => {
        const newDigits = Array(length).fill("");
        const chars = value.split("");
        for (let i = 0; i < Math.min(chars.length, length); i++) {
            newDigits[i] = chars[i];
        }
        setDigits(newDigits);
    }, [value, length]);

    const handleChange = (index: number, digit: string) => {
        if (!/^\d*$/.test(digit)) return; // Only allow digits

        const newDigits = [...digits];
        newDigits[index] = digit;
        setDigits(newDigits);

        const newValue = newDigits.join("");
        onChange(newValue);

        // Auto focus next input
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Call on complete
        if (newValue.replace(/\s/g, '').length === length && onComplete) {
            onComplete(newValue.replace(/\s/g, ''));
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text/plain");
        const pastedDigits = pastedData.replace(/\D/g, "").slice(0, length);

        if (pastedDigits.length === length) {
            setDigits(pastedDigits.split(""));
            onChange(pastedDigits);
            if (onComplete) {
                onComplete(pastedDigits);
            }
            inputRefs.current[length - 1]?.focus();
        }
    };

    return (
        <div className="flex gap-2 justify-center">
            {digits.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-md border ${error ? "border-red-500" : "border-input"
                        } bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                    autoFocus={index === 0}
                />
            ))}
        </div>
    );
}
