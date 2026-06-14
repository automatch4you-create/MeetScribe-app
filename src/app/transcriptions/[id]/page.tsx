import { TranscriptionDetail } from "@/components/TranscriptionDetail";

export default async function TranscriptionPage({
  params,
}: PageProps<"/transcriptions/[id]">) {
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <TranscriptionDetail id={id} />
    </main>
  );
}
