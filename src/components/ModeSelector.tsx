import React from 'react';
import { Truck, Plane, Ship, Train } from 'lucide-react';

export type TransportMode = 'road' | 'air' | 'sea' | 'rail' | 'all';

interface ModeSelectorProps {
  activeMode: TransportMode;
  onChangeMode: (mode: TransportMode) => void;
}

const MODES: { id: TransportMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'road', label: 'Road FTL', icon: Truck },
  { id: 'air', label: 'Air Freight', icon: Plane },
  { id: 'sea', label: 'Sea FCL', icon: Ship },
  { id: 'rail', label: 'Rail Haulage', icon: Train },
  { id: 'all', label: 'Compare All', icon: Truck }, // Combined Comparison Mode
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onChangeMode }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6 bg-bg-elevated rounded-lg p-1 border border-border">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;
        return (
          <button
            type="button"
            key={mode.id}
            onClick={() => onChangeMode(mode.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
              isActive
                ? 'bg-accent text-white shadow-sm'
                : 'text-fg-muted hover:text-fg hover:bg-bg-elevated'
            }`}
          >
            <Icon className="w-4 h-4" />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
};
