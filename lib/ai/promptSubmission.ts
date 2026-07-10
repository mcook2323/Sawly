export function shouldSubmitIdeaKey(key: string, shiftKey: boolean) {
  return key === "Enter" && !shiftKey;
}
