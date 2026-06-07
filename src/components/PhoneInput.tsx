"use client";

import { useState } from "react";
import { formatPhone } from "@/lib/format";

interface PhoneInputProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function PhoneInput({ name, defaultValue = "", placeholder = "(11) 99999-9999", className = "input", style }: PhoneInputProps) {
  const [value, setValue] = useState(formatPhone(defaultValue));

  return (
    <input
      type="tel"
      name={name}
      className={className}
      placeholder={placeholder}
      value={value}
      style={style}
      onChange={(e) => setValue(formatPhone(e.target.value))}
    />
  );
}
