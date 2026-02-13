import './InputFields.css'

interface InputFieldProps {
  label: string;
  type?: string;
  id: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
}

export default function InputField({
  label,
  type = "text",
  id,
  value,
  onChange,
  error,
  required = false,
}: InputFieldProps) {
  return (
    <div className="input-field-wrapper">
      <label htmlFor={id} className="input-label">
        {label}
      </label>
      <input
        type={type}
        id={id}
        className={`input-field ${error ? "input-field-error" : ""}`}
        value={value}
        onChange={onChange}
        required={required}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
