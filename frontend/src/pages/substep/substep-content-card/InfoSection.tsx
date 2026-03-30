// src/pages/substep/substep-content-card/InfoSection.tsx

interface InfoSectionProps {
  label: string;
  content: string | undefined;
  placeholder?: string;
}

export default function InfoSection({
  label,
  content,
  placeholder = "To be completed.",
}: InfoSectionProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-800">{label}</label>
      <p className="text-sm text-gray-600 whitespace-pre-wrap">
        {content || placeholder}
      </p>
    </div>
  );
}
