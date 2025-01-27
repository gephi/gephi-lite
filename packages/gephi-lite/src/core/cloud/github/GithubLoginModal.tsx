import copy from "copy-to-clipboard";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BsClipboard, BsGithub } from "react-icons/bs";

import { Loader, Spinner } from "../../../components/Loader";
import { Modal } from "../../../components/modals";
import { ModalProps } from "../../modals/types";
import { useNotifications } from "../../notifications";
import { useGithubAuth } from "./useGithubAuth";

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
      // TODO: SAVE USER IN THE CONTEXT
      submit({});
    }
  }, [user, submit]);

  return (
    <Modal
      title={
        <>
          <BsGithub className="me-1" />
          {t("cloud.github.auth.title")}
        </>
      }
      onClose={() => cancel()}
    >
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
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  copy(code);
                  notify({ type: "success", message: t("cloud.github.auth.copy_success").toString() });
                }}
              >
                <BsClipboard className="me-1" /> {t("common.copy")}
              </button>
            </div>
          </div>
        )}
      </>
      <>
        {!loading && url && code && (
          <button
            className="btn btn-primary"
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
      </>
    </Modal>
  );
};
