import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type StepIndicatorVariant = "compact" | "default" | "desktop";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  /** Align the step badge + label row (default: end, matching HostRegistrationModal) */
  labelAlign?: "start" | "center" | "end";
  /** compact = mobile (progress only), default = tablet (dots), desktop = all labels + dots */
  variant?: StepIndicatorVariant;
  className?: string;
}

export default function StepIndicator({
  currentStep,
  totalSteps,
  stepLabels,
  labelAlign = "end",
  variant = "default",
  className,
}: StepIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;
  const currentLabel = stepLabels?.[currentStep - 1];
  const showDots = variant !== "compact";
  const showDesktopLabels = variant === "desktop" && stepLabels?.length;

  const labelRowAlign =
    labelAlign === "start"
      ? "justify-start"
      : labelAlign === "center"
        ? "justify-center"
        : "justify-end";

  return (
    <div className={cn("space-y-0", className)} data-testid="step-indicator">
      {showDesktopLabels && (
        <div
          className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mb-4 text-xs"
          data-testid="step-indicator-desktop-labels"
        >
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const isCurrent = stepNum === currentStep;
            const isComplete = stepNum < currentStep;
            return (
              <span
                key={label}
                className={cn(
                  "whitespace-nowrap",
                  isCurrent && "font-semibold text-primary",
                  isComplete && !isCurrent && "text-primary/70",
                  !isCurrent && !isComplete && "text-muted-foreground"
                )}
              >
                {stepNum}. {label}
              </span>
            );
          })}
        </div>
      )}

      {stepLabels && !showDesktopLabels && (
        <div className={cn("flex items-center gap-2 mb-3", labelRowAlign)}>
          <Badge variant="secondary">
            Step {currentStep} of {totalSteps}
          </Badge>
          {currentLabel && (
            <span className="text-sm text-muted-foreground">{currentLabel}</span>
          )}
        </div>
      )}

      {showDesktopLabels && (
        <div className={cn("flex items-center justify-center mb-3")}>
          <Badge variant="secondary">
            Step {currentStep} of {totalSteps}
          </Badge>
        </div>
      )}

      <Progress
        value={progress}
        className={cn(variant === "compact" ? "h-1" : "h-2")}
        data-testid="step-indicator-progress"
      />

      {showDots && (
        <div
          className="flex justify-center gap-2 mt-3"
          data-testid="step-indicator-dots"
        >
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className={cn(
                "h-2 rounded-full transition-all",
                i + 1 === currentStep
                  ? "w-6 bg-primary"
                  : i + 1 < currentStep
                    ? "w-2 bg-primary/60"
                    : "w-2 bg-border"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
