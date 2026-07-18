"use client";
import { Edges } from "@react-three/drei";
export function SelectionOutline({ selected }: { selected: boolean }) { return selected ? <Edges color="#1e6650" lineWidth={2.5} threshold={15} /> : null; }
