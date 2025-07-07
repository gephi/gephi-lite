import { ReactNode } from "react";

import { STATUS_ICONS } from "../../components/common-icons";

export interface NotificationData {
  title?: ReactNode;
  message: ReactNode;
  type: keyof typeof STATUS_ICONS;
}

export type NotificationType = NotificationData & { id: number; createdAt: Date };

export interface NotificationsState {
  notifications: NotificationType[];
}
