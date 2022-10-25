export interface Notification {
  title?: string;
  message: string | JSX.Element;
  type: "success" | "info" | "warning" | "error";
}

export type NotificationState = Notification & { id: number; createdAt: Date };
