import { CustomConceptWorkspace } from "@/components/CustomConceptWorkspace";
export default async function ConceptPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <CustomConceptWorkspace id={id} />; }
