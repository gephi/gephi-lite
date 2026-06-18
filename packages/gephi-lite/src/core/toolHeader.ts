import type { TFunction } from "i18next";

export type ToolHeaderToastType = "success" | "error" | "info";

type MaybePromise<T> = T | Promise<T>;

export interface ToolHeaderProjectMeta {
  id: string;
  name: string;
  app_name: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  storage_path?: string;
  thumbnail_path?: string | null;
  description?: string;
  isPublic?: boolean;
}

interface ToolHeaderDropdownItem {
  label: string;
  action: () => MaybePromise<void>;
}

type ToolHeaderButton =
  | {
      label: string;
      action: () => MaybePromise<void>;
      align?: "left" | "right";
      type?: undefined;
    }
  | {
      label: string;
      type: "dropdown";
      align?: "left" | "right";
      items: ToolHeaderDropdownItem[];
    };

interface ToolHeaderConfig {
  logo?: {
    type: "text";
    text: string;
    textClass?: string;
  };
  buttons?: ToolHeaderButton[];
}

interface ToolHeaderSaveModalOptions {
  name?: string;
  data: object;
  thumbnailDataUri?: string | null;
  existingProjectId?: string | null;
}

interface ToolHeaderProjectConfig {
  appName: string;
  apiBaseUrl?: string;
  onProjectLoad: (projectData: object) => MaybePromise<void>;
  onProjectSave?: (meta: ToolHeaderProjectMeta) => void;
  onProjectDelete?: (projectId: string) => void;
}

interface ToolHeaderSampleConfig {
  toolId: string;
  onSampleSelect: (detail: { url: string; format: string; name: string }) => MaybePromise<void>;
}

export type ToolHeaderElement = HTMLElement & {
  __dvzProcessingToastsInstalled?: "1";
  _currentSelectedProjectId?: string;
  showMessage?: (message: string, type?: ToolHeaderToastType, duration?: number) => void;
  showLoadModal?: () => unknown;
  showSaveModal?: (options: ToolHeaderSaveModalOptions) => unknown;
  loadProject?: (projectId: string) => MaybePromise<object | null>;
  saveProject?: (payload: ToolHeaderSaveModalOptions) => MaybePromise<ToolHeaderProjectMeta>;
  setConfig?: (config: ToolHeaderConfig) => void;
  setProjectConfig?: (config: ToolHeaderProjectConfig) => void;
  setSampleConfig?: (config: ToolHeaderSampleConfig) => void;
};

export function getToolHeader(): ToolHeaderElement | null {
  return document.querySelector("dataviz-tool-header") as ToolHeaderElement | null;
}

export function showToolHeaderMessage(message: string, type: ToolHeaderToastType = "info", duration?: number): boolean {
  const header = getToolHeader();
  if (!header || typeof header.showMessage !== "function") return false;

  header.showMessage(message, type, duration);
  return true;
}

export function showProcessingToast(message: string): void {
  showToolHeaderMessage(message, "info", 5000);
}

export function installHeaderProcessingToasts(header: ToolHeaderElement, t: TFunction): void {
  if (header.__dvzProcessingToastsInstalled === "1") return;

  if (typeof header.showLoadModal === "function") {
    const originalShowLoadModal = header.showLoadModal.bind(header);
    header.showLoadModal = () => {
      showProcessingToast(String(t("processing.projectList")));
      return originalShowLoadModal();
    };
  }

  if (typeof header.loadProject === "function") {
    const originalLoadProject = header.loadProject.bind(header);
    header.loadProject = (projectId: string) => {
      showProcessingToast(String(t("processing.projectLoad")));
      return originalLoadProject(projectId);
    };
  }

  if (typeof header.saveProject === "function") {
    const originalSaveProject = header.saveProject.bind(header);
    header.saveProject = (payload: ToolHeaderSaveModalOptions) => {
      showProcessingToast(String(t("processing.projectSave")));
      return originalSaveProject(payload);
    };
  }

  header.__dvzProcessingToastsInstalled = "1";
}
