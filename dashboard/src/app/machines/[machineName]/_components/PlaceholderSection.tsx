import MachineShell from './MachineShell';
import { getMachineContext, MachinePageSearchParams, MachineSection } from '../_lib/machine-data';

type Props = {
  params: { machineName: string };
  searchParams?: MachinePageSearchParams;
  section: MachineSection;
  title: string;
};

export default function PlaceholderSection({ params, searchParams, section, title }: Props) {
  const context = getMachineContext(params.machineName, searchParams);

  return (
    <MachineShell activeSection={section} {...context}>
      <section className="machine-card">
        <div className="machine-section">
          <h2>{title}</h2>
          <p className="text-sm text-slate-500">This section is prepared for future operational data integration.</p>
        </div>
      </section>
    </MachineShell>
  );
}
