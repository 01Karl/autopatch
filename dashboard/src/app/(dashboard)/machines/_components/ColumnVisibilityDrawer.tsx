import { AppButton, AppButtonLink, AppLabelButton } from '@/app/_components/ui/AppButton';

export type ColumnKey =
  | 'hostname'
  | 'env'
  | 'cluster'
  | 'uuid'
  | 'role'
  | 'owner'
  | 'location'
  | 'criticality'
  | 'compliance'
  | 'osVersion'
  | 'patchWindow'
  | 'lastSeen';

export const COLUMN_OPTIONS: Array<{ key: ColumnKey; label: string }> = [
  { key: 'hostname', label: 'Hostname' },
  { key: 'env', label: 'Env' },
  { key: 'cluster', label: 'Cluster' },
  { key: 'uuid', label: 'UUID' },
  { key: 'role', label: 'Role' },
  { key: 'owner', label: 'Owner' },
  { key: 'location', label: 'Location' },
  { key: 'criticality', label: 'Criticality' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'osVersion', label: 'OS' },
  { key: 'patchWindow', label: 'Patch window' },
  { key: 'lastSeen', label: 'Last seen' },
];

type Props = {
  selectedEnv: string;
  selectedCriticality: string;
  selectedCompliance: string;
  selectedView: 'list' | 'grid';
  selectedColumnSet: Set<ColumnKey>;
};

export default function ColumnVisibilityDrawer({
  selectedEnv,
  selectedCriticality,
  selectedCompliance,
  selectedView,
  selectedColumnSet,
}: Props) {
  return (
    <>
      <label
        htmlFor="column-drawer-toggle"
        className="fixed inset-0 z-40 bg-slate-900/35 opacity-0 pointer-events-none transition-opacity peer-checked:opacity-100 peer-checked:pointer-events-auto"
        aria-label="Close column settings"
      />

      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-sm translate-x-full bg-white shadow-2xl transition-transform duration-300 peer-checked:translate-x-0">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Edit visible columns</h2>
            <p className="text-xs text-slate-500">Choose which fields to show in the machines table.</p>
          </div>
          <AppLabelButton htmlFor="column-drawer-toggle" className="cursor-pointer">Close</AppLabelButton>
        </div>

        <form method="get" action="/machines" className="flex h-[calc(100%-77px)] flex-col justify-between">
          <div className="space-y-2 overflow-y-auto p-4">
            {COLUMN_OPTIONS.map((column) => (
              <label key={column.key} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <input type="checkbox" name="cols" value={column.key} defaultChecked={selectedColumnSet.has(column.key)} />
                <span>{column.label}</span>
              </label>
            ))}
            <input type="hidden" name="env" value={selectedEnv} />
            <input type="hidden" name="criticality" value={selectedCriticality} />
            <input type="hidden" name="compliance" value={selectedCompliance} />
            <input type="hidden" name="view" value={selectedView} />
          </div>

          <div className="flex items-center gap-2 border-t border-slate-200 p-4">
            <AppButton type="submit" variant="primary">Save columns</AppButton>
            <AppButtonLink href={`/machines?env=${selectedEnv}&criticality=${selectedCriticality}&compliance=${selectedCompliance}&view=${selectedView}`}>Reset columns</AppButtonLink>
          </div>
        </form>
      </aside>
    </>
  );
}
