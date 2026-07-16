import { DesignWorkspace } from "@/components/DesignWorkspace";
import { resolveSawlyAIMode } from "@/lib/ai/mode";

export default async function DesignPage({ searchParams }: { searchParams: Promise<{ prompt?: string }> }) {
  const { prompt = "" } = await searchParams;
  return <DesignWorkspace initialPrompt={prompt.trim()} aiMode={resolveSawlyAIMode(process.env.SAWLY_AI_MODE)} />;
}
