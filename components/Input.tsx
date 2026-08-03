"use client";

import React, { forwardRef, useId } from "react";

interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            className = "",
            id,
            required,
            disabled,
            ...props
        },
        ref
    ) => {
        const generatedId = useId();
        const inputId = id || generatedId;

        return (
            <div className="w-full">
                {/* Label */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                        {label}

                        {required && (
                            <span className="ml-1 text-red-500">*</span>
                        )}
                    </label>
                )}

                {/* Input Container */}
                <div className="relative">
                    {/* Left Icon */}
                    {leftIcon && (
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                            {leftIcon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        required={required}
                        disabled={disabled}
                        className={`
              w-full rounded-xl border bg-white
              px-4 py-3 text-sm text-slate-900
              outline-none transition-all duration-300

              placeholder:text-slate-400

              ${error
                                ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                                : "border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                            }

              ${leftIcon ? "pl-11" : ""}
              ${rightIcon ? "pr-11" : ""}

              disabled:cursor-not-allowed
              disabled:bg-slate-100
              disabled:text-slate-500

              ${className}
            `}
                        {...props}
                    />

                    {/* Right Icon */}
                    {rightIcon && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                            {rightIcon}
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-500">
                        <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="12" cy="12" r="9" />

                            <path
                                strokeLinecap="round"
                                d="M12 8v5M12 16h.01"
                            />
                        </svg>

                        {error}
                    </div>
                )}

                {/* Helper Text */}
                {!error && helperText && (
                    <p className="mt-2 text-xs text-slate-400">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;