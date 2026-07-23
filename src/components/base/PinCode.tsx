import { useState, useCallback } from "react";

export interface PinInputProps {
    value?: string;
    onChange?: (value: string) => void;
    maxLength?: number;
    disabled?: boolean;
}

export function PinInput({
    value,
    onChange,
    maxLength = 4,
    disabled = false,
}: PinInputProps) {
    const [internalValue, setInternalValue] = useState(value ?? "");

    const updateValue = useCallback((newValue: string) => {
        const capped = newValue.slice(0, maxLength);
        setInternalValue(capped);
        onChange?.(capped);
    }, [maxLength, onChange]);

    const handleKeypadPress = (key: string) => {
        if (disabled) return;

        if (key === "⌫") {
            updateValue(internalValue.slice(0, -1));
        } else if (key === "Clear") {
            updateValue("");
        } else {
            updateValue(internalValue + key);
        }
    };

    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "⌫",];

    return (
        <div className="flex flex-col items-center gap-6 p-6 bg-pale rounded-2xl w-full  ">
            {/* Display Area */}
            <div className="flex gap-2">
                {[...Array(maxLength)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-12 h-14 border-b-4 flex items-center justify-center text-2xl  transition-all
                        ${internalValue[i] ? "border-primary" : ""}`}
                    >
                        {internalValue[i] ? "●" : ""}
                    </div>
                ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full">
                {keys.map((key) => (
                    <button
                        key={key}
                        onClick={() => handleKeypadPress(key)}
                        disabled={disabled}
                        className={`
                            h-14 rounded-lg active:border-primary text-lg font-medium transition-all border border-text/10 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {key}
                    </button>
                ))}
            </div>
        </div >
    );
}