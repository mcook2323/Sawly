import { generateTablePlan } from "./table";

const plan = generateTablePlan({
  length: 72,
  width: 36,
  height: 30,
  wood: "pine",
  style: "modern",
});

console.log(JSON.stringify(plan, null, 2));