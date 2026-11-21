export function withoutSourceReference(notes: string): string {
  // Hide legacy generated citations only; keep prose and stored notes unchanged.
  return notes
    .replace(
      /[ \t]*Sumber:\s*(?:https?:\/\/\S+|(?:XL-)?(?:PR|BN|CK)-\d+)(?=\s|$)/g,
      ""
    )
    .trim();
}
