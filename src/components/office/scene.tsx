'use client';
import Scene from '@/components/journey/scene';
import type { StationId } from '@/lib/office/model';
interface Props {
  selected: StationId | null;
  counts: Record<StationId, number>;
  reset: number;
  tasks?: { id: string; stage: StationId; status: string }[];
  onSelect: (id: StationId) => void;
  onTask?: (id: string) => void;
  onError: () => void;
}
export default function OfficeScene({ selected, reset, tasks, onSelect, onTask, onError }: Props) {
  return (
    <div className="zo-canvas">
      <Scene
        mode="office"
        selected={selected ?? 'penerimaan'}
        tasks={tasks}
        reset={reset}
        onStation={onSelect}
        onTask={onTask}
        onError={onError}
      />
    </div>
  );
}
