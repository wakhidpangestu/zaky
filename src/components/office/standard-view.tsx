'use client';
import type { OfficeUser } from '@/lib/office/model';
import DashboardBoard from './dashboard-board';
export default function StandardView({ onSimulator }: { user: OfficeUser; onSimulator?: () => void }) {
  return (
    <div className="zo-standard">
      <DashboardBoard onSimulator={onSimulator} />
    </div>
  );
}
