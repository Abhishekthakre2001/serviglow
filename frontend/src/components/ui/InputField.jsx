"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  className = "",
  inputClassName = "",
  error,
  validator,
  minLength,
  maxLength,
  pattern,
  submitAttempted,
  ...props
}) {
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  // useEffect(() => {
  //   if (!touched && !submitAttempted) return;

  //   let err = "";

  //   if (required && !value) {
  //     err = `${label} is required`;
  //   }

  //   if (!err && minLength && value?.length < minLength) {
  //     err = `Minimum ${minLength} characters required`;
  //   }

  //   if (!err && maxLength && value?.length > maxLength) {
  //     err = `Maximum ${maxLength} characters allowed`;
  //   }

  //   if (!err && pattern && value && !pattern.test(value)) {
  //     err = `Invalid ${label}`;
  //   }

  //   if (!err && validator) {
  //     err = validator(value);
  //   }

  //   setInternalError(err || "");
  // }, [value, touched, submitAttempted]);

  useEffect(() => {
    let err = "";

    if (required && !value) {
      err = `${label} is required`;
    } else if (minLength && value?.length < minLength) {
      err = `Minimum ${minLength} characters required`;
    } else if (maxLength && value?.length > maxLength) {
      err = `Maximum ${maxLength} characters allowed`;
    } else if (pattern && value && !pattern.test(value)) {
      err = error || `Invalid ${label}`;
    } else if (validator) {
      err = validator(value);
    }

    setInternalError(err);
  }, [value]); // 👈 ONLY depend on value

  // const showError =
  //   (touched || submitAttempted) &&
  //   (internalError || error);

  const showError =
  (touched || submitAttempted) &&
  internalError;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block mb-1 text-sm font-medium">
          {label}
          {required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      )}

      <div className="relative">
        <input
          type={isPassword && showPassword ? "text" : type}
          name={name}
          value={value}
          min={type === "number" ? 0 : undefined}
          onChange={(e) => {
            setTouched(true);
            onChange?.(e);
          }}
          // ✅ allow typing, block only increment/decrement keys
          onKeyDown={(e) => {
            if (type !== "number") return;

            // block arrow increment/decrement + invalid number chars
            const blocked = ["ArrowUp", "ArrowDown", "e", "E", "+", "-"];
            if (blocked.includes(e.key)) {
              e.preventDefault();
            }
          }}

          // ✅ block mouse wheel increment/decrement (only when focused)
          onWheel={(e) => {
            if (type !== "number") return;

            // prevent scroll from changing value
            e.preventDefault();
            // optional: remove focus so even if browser tries, it won't change
            e.currentTarget.blur();
          }}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border rounded-lg outline-none transition
            pr-10
            ${showError
              ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-400"
              : "border-gray-300 focus:ring-2 focus:ring-blue-400"
            }
            ${inputClassName}
          `}
          {...props}
        />

        {/* 👁 Toggle Button */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {showError && (
        <p className="text-red-500 text-xs mt-1">
          {internalError || error}
        </p>
      )}
    </div>
  );
}
