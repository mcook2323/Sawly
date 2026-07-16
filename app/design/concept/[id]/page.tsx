import { CustomConceptWorkspace } from "@/components/CustomConceptWorkspace";
import { resolveSawlyAIMode } from "@/lib/ai/mode";
export default async function ConceptPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <CustomConceptWorkspace id={id} aiMode={resolveSawlyAIMode(process.env.SAWLY_AI_MODE)} />; }
