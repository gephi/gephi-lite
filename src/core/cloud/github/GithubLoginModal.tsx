import { FC, useEffect, useState } from "react";
import copy from "copy-to-clipboard";
import { BsGithub, BsClipboard } from "react-icons/bs";

import { ModalProps } from "../../modals/types";
import { Modal } from "../../../components/modals";
import { useNotifications } from "../../notifications";
import { Loader, Spinner } from "../../../components/Loader";
import { useGithubAuth } from "./useGithubAuth";

export const GithubLoginModal: FC<ModalProps<{}>> = ({ cancel, submit }) => {
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
          Github authentification
        </>
      }
      onClose={() => cancel()}
    >
      <>
        {/* Display the error*/}
        {error && <p className="text-danger">{error}</p>}

        {loading && (
          <div>
            <p>Asking github for device code</p>
            <Loader />
          </div>
        )}

        {!loading && url && code && (
          <div>
            <p className="text-center mb-3">
              Copy the code below, and click on "Open Github" button. It will opened a new tab, on which Github will ask
              you the code.
            </p>
            <div className="input-group mb-3">
              <input type="text" readOnly={true} className="form-control text-center" value={code} />
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  copy(code);
                  notify({ type: "success", message: "Code saved in clipboard" });
                }}
              >
                <BsClipboard className="me-1" /> Copy
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
            {(!hasBeenClick || !waiting) && <>Open github</>}
            {hasBeenClick && waiting && (
              <>
                Waiting validation <Spinner className="spinner-border-sm " />{" "}
              </>
            )}
          </button>
        )}
      </>
    </Modal>
  );
};
