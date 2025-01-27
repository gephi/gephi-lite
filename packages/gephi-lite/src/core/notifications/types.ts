import { ReactNode } from "react";

export interface NotificationData {
  title?: ReactNode;
  message: ReactNode;
  type: "success" | "info" | "warning" | "error";
}

export type NotificationType = NotificationData & { id: number; createdAt: Date };

export interface NotificationsState {
  notifications: NotificationType[];
}
