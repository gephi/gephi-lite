import { resolveDatavizLocale } from "./datavizLocale";

const SAMPLE_PICKER_TAG_NAME = "dataviz-sample-picker";
const SAMPLE_CATALOG_URL = "https://app.dataviz.jp/catalog.json";

const LOCAL_SAMPLES: SampleCatalogEntry[] = [
  {
    name: "Les Miserables",
    nameEn: "Les Miserables",
    description: "ローカルサンプルデータ",
    descriptionEn: "Local sample data",
    format: "json",
    fileUrl: `${import.meta.env.BASE_URL}samples/Les Miserables.json`,
    compatibleTools: ["gephi-lite"],
    category: "network",
  },
  {
    name: "Java",
    nameEn: "Java",
    description: "ローカルサンプルデータ",
    descriptionEn: "Local sample data",
    format: "gexf",
    fileUrl: `${import.meta.env.BASE_URL}samples/Java.gexf`,
    compatibleTools: ["gephi-lite"],
    category: "network",
  },
  {
    name: "Power Grid",
    nameEn: "Power Grid",
    description: "ローカルサンプルデータ",
    descriptionEn: "Local sample data",
    format: "gexf",
    fileUrl: `${import.meta.env.BASE_URL}samples/Power Grid.gexf`,
    compatibleTools: ["gephi-lite"],
    category: "network",
  },
];

const FORMAT_COLORS: Record<string, string> = {
  csv: "#4e79a7",
  tsv: "#f28e2b",
  json: "#e15759",
  geojson: "#76b7b2",
  gexf: "#edc948",
  graphml: "#b07aa1",
};

export interface SampleCatalogVariant {
  label: string;
  labelEn: string;
  fileUrl: string;
  fileUrlEn?: string;
  rowCount?: number;
}

export interface SampleCatalogEntry {
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  format: string;
  fileUrl: string;
  fileUrlEn?: string;
  rowCount?: number;
  compatibleTools?: string[];
  category?: string;
  tableShape?: string | null;
  variants?: SampleCatalogVariant[];
  extra?: unknown;
}

export interface SampleSelectDetail {
  url: string;
  format: string;
  name: string;
  nameEn?: string;
  extra?: unknown;
  compatibleTools?: string[];
  tableShape?: string | null;
}

function getLocale(): "ja" | "en" {
  return resolveDatavizLocale();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseCompatibleToolToken(token: string): { baseTool: string; chartKey: string | null } {
  const value = String(token || "").trim();
  const slashIndex = value.indexOf("/");

  if (slashIndex === -1) {
    return { baseTool: value, chartKey: null };
  }

  return {
    baseTool: value.slice(0, slashIndex),
    chartKey: value.slice(slashIndex + 1) || null,
  };
}

export function resolveSampleEntries(
  entries: SampleCatalogEntry[],
  toolId: string | null,
  chartKey: string | null = null,
): SampleCatalogEntry[] {
  if (!toolId) return [];

  return entries.filter((entry) =>
    (entry.compatibleTools || []).some((token) => {
      const parsedToken = parseCompatibleToolToken(token);
      if (chartKey) return token === `${toolId}/${chartKey}`;
      return parsedToken.baseTool === toolId;
    }),
  );
}

export function getSampleSelectDetail(
  entry: SampleCatalogEntry,
  locale: "ja" | "en",
  variant?: SampleCatalogVariant,
): SampleSelectDetail {
  const url = variant
    ? locale === "en" && variant.fileUrlEn
      ? variant.fileUrlEn
      : variant.fileUrl
    : locale === "en" && entry.fileUrlEn
      ? entry.fileUrlEn
      : entry.fileUrl;

  return {
    url,
    format: entry.format,
    name: variant ? (locale === "ja" ? variant.label : variant.labelEn) : locale === "ja" ? entry.name : entry.nameEn,
    nameEn: variant ? variant.labelEn : entry.nameEn,
    extra: entry.extra || null,
    compatibleTools: entry.compatibleTools || [],
    tableShape: entry.tableShape || null,
  };
}

async function fetchCatalogEntries(): Promise<SampleCatalogEntry[]> {
  const response = await fetch(SAMPLE_CATALOG_URL);
  if (!response.ok) throw new Error("Failed to fetch sample catalog");

  const data = (await response.json()) as { entries?: SampleCatalogEntry[] };
  return data.entries || [];
}

const SamplePickerBase: typeof HTMLElement =
  typeof HTMLElement === "undefined" ? (class {} as typeof HTMLElement) : HTMLElement;

class GephiLiteSamplePicker extends SamplePickerBase {
  private readonly root: ShadowRoot;
  private toolId: string | null = null;
  private chartKey: string | null = null;
  private isOpen = false;
  private entries: SampleCatalogEntry[] = [];
  private filteredEntries: SampleCatalogEntry[] = [];
  private searchQuery = "";
  private isLoading = false;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
  }

  setToolContext(toolId: string, chartKey: string | null = null): void {
    this.toolId = toolId;
    this.chartKey = chartKey;
  }

  async open(): Promise<void> {
    this.isOpen = true;
    this.isLoading = true;
    this.searchQuery = "";
    this.entries = [];
    this.filteredEntries = [];
    this.render();

    try {
      const catalogEntries = await fetchCatalogEntries();
      this.entries = resolveSampleEntries(catalogEntries, this.toolId, this.chartKey);
      if (!this.entries.length) this.entries = resolveSampleEntries(LOCAL_SAMPLES, this.toolId, this.chartKey);
    } catch (error) {
      console.error("Failed to load sample catalog", error);
      this.entries = resolveSampleEntries(LOCAL_SAMPLES, this.toolId, this.chartKey);
    }

    this.filteredEntries = this.entries;
    this.isLoading = false;
    this.render();
  }

  close(): void {
    this.isOpen = false;
    this.root.innerHTML = "";
  }

  private onSearch(query: string): void {
    this.searchQuery = query;
    const normalizedQuery = query.toLowerCase();
    this.filteredEntries = normalizedQuery
      ? this.entries.filter((entry) => {
          const tags = [entry.name, entry.nameEn, entry.description, entry.descriptionEn, entry.format];
          return tags.some((value) => value.toLowerCase().includes(normalizedQuery));
        })
      : this.entries;
    this.renderList();
  }

  private onSelect(entry: SampleCatalogEntry, variant?: SampleCatalogVariant): void {
    this.dispatchEvent(
      new CustomEvent<SampleSelectDetail>("sample-data-selected", {
        bubbles: true,
        composed: true,
        detail: getSampleSelectDetail(entry, getLocale(), variant),
      }),
    );
    this.close();
  }

  private render(): void {
    if (!this.isOpen) {
      this.root.innerHTML = "";
      return;
    }

    this.root.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="dv-picker-overlay">
        <div class="dv-picker-modal">
          <div class="dv-picker-header">
            <h2>${getLocale() === "ja" ? "サンプルデータ" : "Sample Data"}</h2>
            <button class="dv-picker-close" type="button">&times;</button>
          </div>
          <div class="dv-picker-search-wrap">
            <input
              type="text"
              class="dv-picker-search"
              placeholder="${getLocale() === "ja" ? "データを検索..." : "Search datasets..."}"
              value="${escapeHtml(this.searchQuery)}"
            />
          </div>
          <div class="dv-picker-list" id="dv-picker-list">
            ${this.isLoading ? `<div class="dv-picker-empty">${getLocale() === "ja" ? "読み込み中..." : "Loading..."}</div>` : this.getListHtml()}
          </div>
        </div>
      </div>
    `;

    this.root.querySelector(".dv-picker-close")?.addEventListener("click", () => this.close());
    this.root.querySelector(".dv-picker-overlay")?.addEventListener("click", (event) => {
      if ((event.target as Element).classList.contains("dv-picker-overlay")) this.close();
    });
    this.root.querySelector(".dv-picker-search")?.addEventListener("input", (event) => {
      this.onSearch((event.target as HTMLInputElement).value);
    });

    this.attachItemListeners();
  }

  private renderList(): void {
    const list = this.root.getElementById("dv-picker-list");
    if (!list) return;

    list.innerHTML = this.getListHtml();
    this.attachItemListeners();
  }

  private getListHtml(): string {
    const locale = getLocale();

    if (!this.filteredEntries.length) {
      const message =
        this.entries.length === 0
          ? locale === "ja"
            ? "利用できるサンプルデータがありません"
            : "No sample data available"
          : locale === "ja"
            ? "条件に一致するデータがありません"
            : "No matching datasets";
      return `<div class="dv-picker-empty">${message}</div>`;
    }

    return this.filteredEntries
      .map((entry, index) => {
        const name = escapeHtml(locale === "ja" ? entry.name : entry.nameEn);
        const description = escapeHtml(locale === "ja" ? entry.description : entry.descriptionEn);
        const format = escapeHtml(entry.format.toUpperCase());
        const color = FORMAT_COLORS[entry.format] || "#888";
        const rowInfo = entry.rowCount
          ? `<span class="dv-picker-item-rows">${entry.rowCount.toLocaleString()} ${locale === "ja" ? "行" : "rows"}</span>`
          : "";

        if (entry.variants?.length) {
          const options = entry.variants
            .map((variant, variantIndex) => {
              const label = escapeHtml(locale === "ja" ? variant.label : variant.labelEn);
              const rows = variant.rowCount ? ` (${variant.rowCount.toLocaleString()} ${locale === "ja" ? "行" : "rows"})` : "";
              return `<option value="${variantIndex}">${label}${rows}</option>`;
            })
            .join("");

          return `
            <div class="dv-picker-item dv-picker-item-variant">
              <div class="dv-picker-item-color" style="background:${color}"></div>
              <div class="dv-picker-item-body">
                <div class="dv-picker-item-title">${name}</div>
                <div class="dv-picker-item-desc">${description}</div>
                <select class="dv-picker-variant-select" data-entry-index="${index}">
                  <option value="">${locale === "ja" ? "-- 選択 --" : "-- Select --"}</option>
                  ${options}
                </select>
              </div>
            </div>
          `;
        }

        return `
          <button class="dv-picker-item" type="button" data-index="${index}">
            <div class="dv-picker-item-color" style="background:${color}"></div>
            <div class="dv-picker-item-body">
              <div class="dv-picker-item-title">${name}</div>
              <div class="dv-picker-item-desc">${description}</div>
              <div class="dv-picker-item-meta">
                <span class="dv-picker-item-format" style="color:${color}">${format}</span>
                ${rowInfo}
              </div>
            </div>
          </button>
        `;
      })
      .join("");
  }

  private attachItemListeners(): void {
    this.root.querySelectorAll<HTMLElement>(".dv-picker-item:not(.dv-picker-item-variant)").forEach((element) => {
      element.addEventListener("click", () => {
        const index = Number(element.dataset.index);
        const entry = this.filteredEntries[index];
        if (entry) this.onSelect(entry);
      });
    });

    this.root.querySelectorAll<HTMLSelectElement>(".dv-picker-variant-select").forEach((select) => {
      select.addEventListener("change", () => {
        const entryIndex = Number(select.dataset.entryIndex);
        const variantIndex = Number(select.value);
        const entry = this.filteredEntries[entryIndex];
        const variant = entry?.variants?.[variantIndex];
        if (entry && variant) this.onSelect(entry, variant);
      });
      select.addEventListener("click", (event) => event.stopPropagation());
    });
  }

  private getStyles(): string {
    return `
      .dv-picker-overlay {
        position: fixed; inset: 0; z-index: 100000;
        background: rgba(0,0,0,0.6);
        display: flex; align-items: flex-start; justify-content: center;
        padding-top: 10vh;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .dv-picker-modal {
        background: rgb(30,30,30); color: #ddd;
        border: 1px solid rgb(60,60,60);
        border-radius: 8px;
        width: 90vw; max-width: 560px;
        max-height: 70vh;
        display: flex; flex-direction: column;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      }
      .dv-picker-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 16px 20px 12px;
        border-bottom: 1px solid rgb(60,60,60);
      }
      .dv-picker-header h2 {
        margin: 0; font-size: 16px; font-weight: 600; color: #fff;
      }
      .dv-picker-close {
        background: none; border: none; color: #999; font-size: 24px;
        cursor: pointer; padding: 0 4px; line-height: 1;
      }
      .dv-picker-close:hover { color: #fff; }
      .dv-picker-search-wrap { padding: 12px 20px; }
      .dv-picker-search {
        width: 100%; box-sizing: border-box;
        background: rgb(45,45,45); border: 1px solid rgb(70,70,70);
        border-radius: 6px; padding: 8px 12px;
        color: #ddd; font-size: 14px; outline: none;
      }
      .dv-picker-search:focus { border-color: #4e79a7; }
      .dv-picker-search::placeholder { color: #777; }
      .dv-picker-list {
        flex: 1; overflow-y: auto; padding: 0 12px 12px;
      }
      .dv-picker-empty {
        text-align: center; color: #777; padding: 32px 16px; font-size: 14px;
      }
      .dv-picker-item {
        display: flex; align-items: stretch; gap: 0;
        width: 100%; text-align: left;
        background: rgb(38,38,38); border: 1px solid rgb(55,55,55);
        border-radius: 8px; margin-bottom: 8px;
        cursor: pointer; overflow: hidden;
        transition: border-color 0.15s, background 0.15s;
        padding: 0; font-family: inherit;
        color: inherit;
      }
      .dv-picker-item:hover {
        border-color: rgb(90,90,90);
        background: rgb(45,45,45);
      }
      .dv-picker-item-color { width: 6px; flex-shrink: 0; }
      .dv-picker-item-body { padding: 10px 14px; flex: 1; min-width: 0; }
      .dv-picker-item-title {
        font-size: 14px; font-weight: 600; color: #eee;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .dv-picker-item-desc {
        font-size: 12px; color: #999; margin-top: 2px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .dv-picker-item-meta {
        display: flex; gap: 8px; margin-top: 4px; font-size: 11px;
      }
      .dv-picker-item-format {
        font-weight: 700; text-transform: uppercase;
      }
      .dv-picker-item-rows { color: #777; }
      .dv-picker-item-variant { cursor: default; }
      .dv-picker-variant-select {
        width: 100%; box-sizing: border-box; margin-top: 6px;
        background: rgb(50,50,50); border: 1px solid rgb(70,70,70);
        border-radius: 4px; padding: 5px 8px;
        color: #ddd; font-size: 13px; cursor: pointer;
      }
      .dv-picker-variant-select:focus { border-color: #4e79a7; outline: none; }
    `;
  }
}

export function installGephiLiteSamplePicker(): void {
  if (typeof window === "undefined" || !window.customElements) return;

  if (!window.customElements.get(SAMPLE_PICKER_TAG_NAME)) {
    window.customElements.define(SAMPLE_PICKER_TAG_NAME, GephiLiteSamplePicker);
  }
}
