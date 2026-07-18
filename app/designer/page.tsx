import { AIProjectDesigner } from "@/components/AIProjectDesigner";

export default async function AIProjectDesignerPage({ searchParams }: { searchParams: Promise<{ prompt?: string }> }) {
  const { prompt = "" } = await searchParams;
  return <AIProjectDesigner initialPrompt={prompt.trim()} />;
}
