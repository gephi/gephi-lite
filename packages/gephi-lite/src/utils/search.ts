import { FieldModel, ItemData } from "@gephi/gephi-lite-sdk";

export function normalize(str: string): string {
  return str.toLowerCase().trim();
}

const SEARCHABLE_TYPES = new Set<FieldModel["type"]>(["text", "category", "keywords"]);

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
      ({ type, id }) =>
        SEARCHABLE_TYPES.has(type) && typeof data[id] === "string" && normalize(data[id]).includes(normalizedQuery),
    )
  );
}
