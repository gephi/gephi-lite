import { FC, useEffect, useState, useCallback } from "react";
import { FaSave, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { ModalProps } from "../../../../core/modals/types";
import { useCloudProvider } from "../../../../core/cloud/useCloudProvider";
import { useConnectedUser } from "../../../../core/user";
import { useNotifications } from "../../../../core/notifications";
import { Modal } from "../../../../components/modals";
import { Loader } from "../../../../components/Loader";

export const SaveCloudFileModal: FC<ModalProps<{}>> = ({ cancel, submit }) => {
  const { t } = useTranslation();
  const [user] = useConnectedUser();
  const { loading, error, createFile } = useCloudProvider();
  const { notify } = useNotifications();

  const [filename, setFilename] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isValid, setIsValid] = useState<boolean>(false);

  useEffect(() => {
    setIsValid(filename.length > 0);
  }, [filename]);

  const save = useCallback(async () => {
    if (isValid) {
      try {
        await createFile({
          filename,
          description,
          isPublic,
        });
        cancel();
        notify({ type: "success", message: t("graph.save.cloud.success", { filename }).toString() });
      } catch (e) {
        console.error(e);
      }
    }
  }, [isValid, createFile, filename, description, isPublic, cancel, notify, t]);

  return (
    <Modal
      title={t("graph.save.cloud.title", {
        provider: user?.provider.type ? t(`providers.${user.provider.type}`) : null,
      }).toString()}
      onClose={() => cancel()}
      className="modal"
    >
      <>
        {error && <p className="text-center text-danger">{t("graph.save.cloud.error").toString()}</p>}

        <form className="row g-3" onSubmit={() => save()}>
          <div className="mb-3">
            <label htmlFor="filename" className="form-label">
              {t("graph.save.cloud.field.filename").toString()}
            </label>
            <input
              id="filename"
              className="form-control"
              type="string"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              required={true}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="description" className="form-label">
              {t("graph.save.cloud.field.description").toString()}
            </label>
            <textarea
              id="description"
              className="form-control"
              value={description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="isPublic">
                {t("graph.save.cloud.field.isPublic").toString()}
              </label>
            </div>
          </div>
        </form>
        {loading && <Loader />}
      </>
      <>
        <button title={t("common.cancel").toString()} className="btn btn-outline-danger" onClick={() => cancel()}>
          <FaTimes className="me-1" />
          {t("common.cancel").toString()}
        </button>
        <button
          title={t("common.save").toString()}
          className="btn btn-primary"
          disabled={!isValid || loading}
          onClick={() => save()}
        >
          <FaSave className="me-1" />
          {t("common.save").toString()}
        </button>
      </>
    </Modal>
  );
};
