import { cn } from "@/lib/utils";

interface ProgressStepProps {
  steps: Array<{
    id: number;
    title: string;
    icon?: string;
  }>;
  currentStep: number;
  className?: string;
}

export function ProgressSteps({ steps, currentStep, className }: ProgressStepProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center space-x-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              "progress-step",
              currentStep >= step.id ? "active" : "text-muted-foreground"
            )}>
              <div className="step-number">
                {step.id}
              </div>
              <span className="font-medium">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div className="w-8 border-t border-muted-foreground/30 ml-8" />
            )}
          </div>
        ))}
      </div>
      <div className="text-sm text-muted-foreground">
        <i className="fas fa-info-circle mr-2"></i>
        Follow the steps to build and test your trading strategy
      </div>
    </div>
  );
}
