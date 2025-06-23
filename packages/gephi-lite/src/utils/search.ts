import { FieldModel, ItemData } from "@gephi/gephi-lite-sdk";

export function normalize(str: string): string {
  return str.toLowerCase().trim();
}

export function doesItemMatch(
  id: string,
  label: string | null | undefined,
  data: ItemData,
  fields: FieldModel[],
  query: string,
): boolean {
  const normalizedQuery = normalize(query);

  return (
    normalize(id).includes(normalizedQuery) ||
    (label && normalize(label).includes(normalizedQuery)) ||
    fields.some(
      ({ qualitative, id }) =>
        !!qualitative && typeof data[id] === "string" && normalize(data[id]).includes(normalizedQuery),
    )
  );
}
