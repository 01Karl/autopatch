import PlaceholderSection from '../_components/PlaceholderSection';
import { MachinePageSearchParams } from '../_lib/machine-data';

type Props = {
  params: { machineName: string };
  searchParams?: MachinePageSearchParams;
};

export default function Page({ params, searchParams }: Props) {
  return <PlaceholderSection params={params} searchParams={searchParams} section="identity" title="Identity" />;
}
