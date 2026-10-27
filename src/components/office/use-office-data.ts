'use client';
import { toOfficeTask } from '@/lib/office/workflow';
import { useOfficeWorkflow, type OfficeWorkflow } from './use-office-workflow';
import type { OfficeTask } from '@/lib/office/model';
export interface Fund {
  id: string;
  nama: string;
  totalMasuk: number;
  saldoTersedia: number;
  saldoDicadangkan: number;
  totalTersalurkan: number;
}
export interface OfficeData {
  tasks: OfficeTask[];
  funds: Fund[];
  receipts: number;
  ready: boolean;
  warning: string;
  workflow: OfficeWorkflow;
  refresh: () => void;
}
export function useOfficeData(): OfficeData & { refresh: () => void } {
  const workflow = useOfficeWorkflow();
  return {
    tasks: workflow.snapshot?.items.map(toOfficeTask) ?? [],
    funds: [],
    receipts: workflow.snapshot?.financial?.receiptCount ?? 0,
    ready: !!workflow.snapshot,
    warning: '',
    workflow,
    refresh: () => void workflow.refresh(),
  };
}
