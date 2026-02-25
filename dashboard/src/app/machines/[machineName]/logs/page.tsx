import MachineShell from '../_components/MachineShell';
import { getMachineContext, linuxLogCategories, linuxLogFiles, logInsights, MachinePageSearchParams } from '../_lib/machine-data';
import LogsWorkbench from './_components/LogsWorkbench';

type Props = {
  params: { machineName: string };
  searchParams?: MachinePageSearchParams;
};

export default function MachineLogsPage({ params, searchParams }: Props) {
  const context = getMachineContext(params.machineName, searchParams);

  return (
    <MachineShell activeSection="logs" {...context}>
      <section className="machine-card space-y-4">
        <div className="machine-section">
          <h2>Linux logs & signals</h2>
          <p className="text-sm text-slate-500">Välj loggtyp, öppna hela loggfiler och markera rader som sticker ut. Täcker boot, secure/auth, chrony, cups, httpd, journal och lastlog.</p>
        </div>

        <LogsWorkbench view={context.logView} categories={linuxLogCategories.map((category) => ({ ...category }))} files={linuxLogFiles.map((file) => ({ ...file }))} insights={logInsights.map((insight) => ({ ...insight }))} />
      </section>
    </MachineShell>
  );
}
