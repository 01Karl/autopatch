import MachineShell from '../_components/MachineShell';
import { advisorHighlights, getMachineContext, MachinePageSearchParams } from '../_lib/machine-data';

type Props = {
  params: { machineName: string };
  searchParams?: MachinePageSearchParams;
};

export default function MachineAdvisorPage({ params, searchParams }: Props) {
  const context = getMachineContext(params.machineName, searchParams);

  return (
    <MachineShell activeSection="advisor-recommendations" {...context}>
      <section className="machine-card space-y-4">
        <div className="machine-section">
          <h2>Advisor recommendations</h2>
          <p className="text-sm text-slate-500">Actionable guidance tailored to this machine.</p>
        </div>
        <ul className="text-sm text-slate-700 list-disc pl-5 space-y-2">
          {advisorHighlights.map((item) => (<li key={item}>{item}</li>))}
        </ul>
      </section>
    </MachineShell>
  );
}
