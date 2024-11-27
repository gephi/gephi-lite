import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TypeGuardError, assert } from "typia";

import { useNotifications } from "../notifications";
import { broadcastActions } from "./actions";
import { BroadcastMessage } from "./types";

const MESSAGE_READY = "ready";
const MESSAGE_ACTION_ENDED = "action-ended";

export function useBroadcast(broadcastID?: string | null) {
  const { t } = useTranslation();
  const { notify } = useNotifications();

  useEffect(() => {
    if (!broadcastID) return;

    const channel = new BroadcastChannel(broadcastID);
    channel.onmessage = ({ isTrusted, data }) => {
      if (!isTrusted) {
        notify({
          type: "warning",
          title: t("broadcast.title", { id: broadcastID }),
          message: t("broadcast.untrusted_message"),
        });
      }

      // Validate data type:
      try {
        const { action, payload } = assert<BroadcastMessage>(data);
        switch (action) {
          case "importGraph":
            broadcastActions
              .importGraph(payload.graph, payload.title)
              .then(() => {
                channel.postMessage({ message: MESSAGE_ACTION_ENDED, action });
              })
              .catch(() => {
                notify({
                  type: "error",
                  title: t("broadcast.title", { id: broadcastID }),
                  message: t("error.unknown"),
                });
              });
            break;
          case "updateAppearance":
            broadcastActions.updateAppearance(payload);
            channel.postMessage({ message: MESSAGE_ACTION_ENDED, action });
            break;
          default:
            notify({
              type: "warning",
              title: t("broadcast.title", { id: broadcastID }),
              message: t("broadcast.unimplemented_message", { type: action }),
            });
        }
      } catch (e) {
        if (e instanceof TypeGuardError)
          notify({
            type: "error",
            title: t("broadcast.title", { id: broadcastID }),
            message: (
              <>
                {t("broadcast.wrongly_shaped_message")}
                <br />
                {e + ""}
              </>
            ),
          });
      }
    };
    channel.postMessage({ message: MESSAGE_READY });

    return () => {
      channel.close();
    };
  }, [broadcastID, notify, t]);
}
