import { redirect } from 'next/navigation';
import { DEFAULT_BASE_PATH, ENV_OPTIONS, MachinePageSearchParams } from './_lib/machine-data';

type Props = {
  params: { machineName: string };
  searchParams?: MachinePageSearchParams;
};

export default function MachineIndexPage({ params, searchParams }: Props) {
  const selectedEnv = ENV_OPTIONS.includes(searchParams?.env as (typeof ENV_OPTIONS)[number])
    ? (searchParams?.env as (typeof ENV_OPTIONS)[number])
    : 'prod';
  const selectedBasePath = searchParams?.basePath || DEFAULT_BASE_PATH;

  redirect(`/machines/${encodeURIComponent(decodeURIComponent(params.machineName))}/overview?env=${selectedEnv}&basePath=${selectedBasePath}`);
}
