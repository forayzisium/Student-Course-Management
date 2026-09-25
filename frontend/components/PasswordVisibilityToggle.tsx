"use client";

import EyeIcon from "./EyeIcon";

interface PasswordVisibilityToggleProps {
  visible: boolean;
  onChange: (visible: boolean) => void;
  label?: string;
}

export default function PasswordVisibilityToggle({
  visible,
  onChange,
  label = "Toggle password visibility",
}: PasswordVisibilityToggleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={visible}
      onClick={() => onChange(!visible)}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
    >
      <EyeIcon open={visible} />
    </button>
  );
}
