import { StrategyConfig } from "@/types/trading";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StrategyCardProps {
  strategy: StrategyConfig;
  isSelected?: boolean;
  isDragging?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  onConfigure?: () => void;
  className?: string;
}

export function StrategyCard({ 
  strategy, 
  isSelected = false, 
  isDragging = false,
  onSelect,
  onRemove,
  onConfigure,
  className 
}: StrategyCardProps) {
  return (
    <Card 
      className={cn(
        "strategy-card",
        isSelected && "selected-strategy-card",
        isDragging && "opacity-50 rotate-2",
        className
      )}
      onClick={onSelect}
      data-testid={`strategy-card-${strategy.id}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-sm text-card-foreground">{strategy.name}</h4>
            <p className="text-xs text-muted-foreground">{strategy.description}</p>
            {isSelected && (
              <p className="text-xs text-muted-foreground mt-1">
                {Object.entries(strategy.parameters)
                  .slice(0, 2)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(", ")}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isSelected ? (
              <>
                {onConfigure && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfigure();
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`button-configure-${strategy.id}`}
                  >
                    <i className="fas fa-cog text-sm"></i>
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove();
                    }}
                    className="text-muted-foreground hover:text-danger transition-colors"
                    data-testid={`button-remove-${strategy.id}`}
                  >
                    <i className="fas fa-times text-sm"></i>
                  </button>
                )}
              </>
            ) : (
              <i className="fas fa-grip-vertical text-muted-foreground"></i>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
