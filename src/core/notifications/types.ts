export interface NotificationData {
  title?: string;
  message: string | JSX.Element;
  type: "success" | "info" | "warning" | "error";
}

export type NotificationType = NotificationData & { id: number; createdAt: Date };

export interface NotificationsState {
  notifications: NotificationType[];
}
