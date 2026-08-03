"use client";

import React from "react";

type ButtonVariant =
    | "primary"
    | "secondary"
    | "outline"
    | "danger"
    | "ghost";

type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

export default function Button({
    children,
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    icon,
    disabled,
    className = "",
    ...props
}: ButtonProps) {
    const baseStyles =
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50";

    const variants = {
        primary:
            "bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg focus:ring-indigo-100",

        secondary:
            "bg-slate-900 text-white shadow-md hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg focus:ring-slate-200",

        outline:
            "border border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 focus:ring-indigo-100",

        danger:
            "bg-red-500 text-white shadow-md shadow-red-100 hover:-translate-y-0.5 hover:bg-red-600 focus:ring-red-100",

        ghost:
            "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-indigo-600 focus:ring-slate-100",
    };

    const sizes = {
        sm: "px-3.5 py-2 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3.5 text-base",
    };

    return (
        <button
            disabled={disabled || loading}
            className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
            {...props}
        >
            {loading ? (
                <>
                    <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />

                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                    </svg>

                    Processing...
                </>
            ) : (
                <>
                    {children}

                    {icon && (
                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                            {icon}
                        </span>
                    )}
                </>
            )}
        </button>
    );
}