import copy from "copy-to-clipboard";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGithubAuth } from "../../core/cloud/github/useGithubAuth";
import { ModalProps } from "../../core/modals/types";
import { useNotifications } from "../../core/notifications";
import { Loader, Spinner } from "../Loader";
import { ClipboardIcon } from "../common-icons";
import { Modal } from "../modals";

export const GithubLoginModal: FC<ModalProps<unknown>> = ({ cancel, submit }) => {
  const { t } = useTranslation();
  const [hasBeenClick, setHasBeenClick] = useState<boolean>(false);
  const { code, loading, url, login, user, error, waiting } = useGithubAuth();
  const { notify } = useNotifications();

  useEffect(() => {
    const id = setTimeout(() => login(), 0);
    return () => {
      clearTimeout(id);
    };
  }, [login]);

  useEffect(() => {
    if (user) {
      submit({});
    }
  }, [user, submit]);

  return (
    <Modal title={t("cloud.github.auth.title")} onClose={() => cancel()}>
      <>
        {/* Display the error*/}
        {error && <p className="text-danger">{error}</p>}

        {loading && (
          <div>
            <p>{t("cloud.github.auth.asking_for_device_code")}</p>
            <Loader />
          </div>
        )}

        {!loading && url && code && (
          <div>
            <p className="text-center mb-3">{t("cloud.github.auth.copy_code")}</p>
            <div className="input-group mb-3">
              <input type="text" readOnly={true} className="form-control text-center" value={code} />
              <button
                className="gl-btn gl-btn-outline"
                type="button"
                onClick={() => {
                  copy(code);
                  notify({ type: "success", message: t("cloud.github.auth.copy_success").toString() });
                }}
              >
                <ClipboardIcon className="me-1" /> {t("common.copy")}
              </button>
            </div>
          </div>
        )}
      </>
      <div className="gl-gap-2 d-flex">
        {!loading && url && code && (
          <button
            className="gl-btn gl-btn-fill"
            type="button"
            disabled={hasBeenClick && waiting}
            onClick={() => {
              setHasBeenClick(true);
              window.open(url, "_blank", "popup");
            }}
          >
            {(!hasBeenClick || !waiting) && <>Open GitHub</>}
            {hasBeenClick && waiting && (
              <>
                {t("cloud.github.auth.waiting_validation")} <Spinner className="spinner-border-sm " />{" "}
              </>
            )}
          </button>
        )}
      </div>
    </Modal>
  );
};
