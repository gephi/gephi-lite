import { DOMParser } from "@xmldom/xmldom";

if (typeof globalThis.DOMParser === "undefined") {
  globalThis.DOMParser = DOMParser as typeof globalThis.DOMParser;
}

if (typeof globalThis.Document === "undefined") {
  const document = new DOMParser().parseFromString("<t></t>", "application/xml");
  globalThis.Document = document.constructor as typeof globalThis.Document;
}
