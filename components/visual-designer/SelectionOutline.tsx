"use client";
import { Edges } from "@react-three/drei";
export function SelectionOutline({ selected, edited }: { selected: boolean; edited?: boolean }) { return selected || edited ? <Edges color={selected ? "#1e6650" : "#c36f4d"} lineWidth={selected ? 2.5 : 1.8} threshold={15} /> : null; }
