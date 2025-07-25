import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StrategyCard } from "@/components/ui/strategy-card";
import { useStrategies } from "@/hooks/use-strategies";
import { StrategyConfig } from "@/types/trading";
import { Cog, HelpCircle } from "lucide-react";

interface StrategyBuilderProps {
  selectedStrategies: StrategyConfig[];
  onStrategiesChange: (strategies: StrategyConfig[]) => void;
}

export function StrategyBuilder({ selectedStrategies, onStrategiesChange }: StrategyBuilderProps) {
  const [activeCategory, setActiveCategory] = useState("technical");
  const { data: availableStrategies = [] } = useStrategies();

  const categories = [
    { id: "technical", label: "Technical" },
    { id: "ml", label: "ML Models" },
    { id: "custom", label: "Custom" },
  ];

  const filteredStrategies = availableStrategies.filter(
    strategy => strategy.type === activeCategory
  );

  const handleStrategySelect = (strategy: StrategyConfig) => {
    // Check if strategy is already selected
    if (selectedStrategies.find(s => s.id === strategy.id)) {
      return;
    }

    // Add strategy to selected list
    onStrategiesChange([...selectedStrategies, strategy]);
  };

  const handleStrategyRemove = (strategyId: string) => {
    onStrategiesChange(selectedStrategies.filter(s => s.id !== strategyId));
  };

  const handleStrategyConfigure = (strategyId: string) => {
    // TODO: Open parameter configuration modal
    console.log("Configure strategy:", strategyId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="card-title">
            <Cog className="mr-2 h-5 w-5 text-warning" />
            Strategy Builder
          </h2>
          <div className="tooltip">
            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            <span className="tooltip-text">
              Drag strategies to build your trading system
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strategy Categories */}
        <div className="flex space-x-2 mb-4">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              className="btn-category"
              data-testid={`button-category-${category.id}`}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Available Strategies */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">Available Strategies</p>
          
          {filteredStrategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              onSelect={() => handleStrategySelect(strategy)}
            />
          ))}
        </div>

        {/* Active Strategy Stack */}
        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground mb-2">Active Strategy Stack</p>
          
          {selectedStrategies.length === 0 ? (
            <div className="strategy-dropzone">
              <p className="text-sm">Drop strategies here to start building</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedStrategies.map((strategy) => (
                <StrategyCard
                  key={`selected-${strategy.id}`}
                  strategy={strategy}
                  isSelected
                  onRemove={() => handleStrategyRemove(strategy.id)}
                  onConfigure={() => handleStrategyConfigure(strategy.id)}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
