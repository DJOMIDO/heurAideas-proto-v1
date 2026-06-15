// frontend/src/pages/substep/substep-content-card/forms/subtask-1-4-a/OptionalTextInput.tsx
import { Input } from "@/components/ui/input";

interface OptionalTextInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  isReadOnly?: boolean;
}

export default function OptionalTextInput({
  placeholder,
  value,
  onChange,
  isReadOnly = false,
}: OptionalTextInputProps) {
  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isReadOnly}
      className="w-full h-10 text-sm bg-gray-50 border-gray-200 focus:bg-white"
    />
  );
}
