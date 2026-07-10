import { DesignWorkspace } from "@/components/DesignWorkspace";

export default async function DesignPage({ searchParams }: { searchParams: Promise<{ prompt?: string }> }) {
  const { prompt = "" } = await searchParams;
  return <DesignWorkspace initialPrompt={prompt.trim()} />;
}
