type PipelineStepperProps = {
  hasFile: boolean;
  hasTrack: boolean;
  isExporting: boolean;
};

const STEPS = ["Upload", "Trim", "Transcribe", "Export"] as const;

function currentStepIndex({ hasFile, hasTrack, isExporting }: PipelineStepperProps): number {
  if (isExporting) return 3;
  if (hasTrack) return 3;
  if (hasFile) return 1;
  return 0;
}

export default function PipelineStepper(props: PipelineStepperProps) {
  const activeIndex = currentStepIndex(props);

  return (
    <ol className="flex items-center gap-2 text-xs text-[var(--text-3)]">
      {STEPS.map((step, i) => (
        <li key={step} className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 ${
              i === activeIndex
                ? "bg-[var(--gradient)] text-white"
                : i < activeIndex
                  ? "bg-white/10 text-[var(--text-2)]"
                  : "bg-white/5"
            }`}
            style={i === activeIndex ? { backgroundImage: "var(--gradient)" } : undefined}
          >
            {step}
          </span>
          {i < STEPS.length - 1 && <span className="text-[var(--text-3)]">→</span>}
        </li>
      ))}
    </ol>
  );
}
