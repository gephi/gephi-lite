import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useCloudProvider } from "../../../core/cloud/useCloudProvider";
import { useFile, useFileActions } from "../../../core/context/dataContexts";
import { getFilename } from "../../../core/file/utils";
import { ModalProps } from "../../../core/modals/types";
import { useNotifications } from "../../../core/notifications";
import { useConnectedUser } from "../../../core/user";
import { Loader } from "../../Loader";
import { Modal } from "../../modals";

export const SaveCloudFileModal: FC<ModalProps<unknown>> = ({ cancel }) => {
  const { t } = useTranslation();
  const [user] = useConnectedUser();
  const { loading, error, createFile } = useCloudProvider();
  const { notify } = useNotifications();
  const { exportAsGephiLite } = useFileActions();
  const { current } = useFile();

  const [filename, setFilename] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isValid, setIsValid] = useState<boolean>(false);

  useEffect(() => {
    setIsValid(filename.length > 0);
  }, [filename]);

  useEffect(() => {
    setFilename(getFilename(current?.filename || "", "gephi-lite"));
  }, [current]);

  const save = useCallback(async () => {
    if (isValid) {
      await exportAsGephiLite(async (content) => {
        try {
          await createFile(
            {
              filename,
              description,
              isPublic,
              format: "gephi-lite",
            },
            content,
          );
          cancel();
          notify({ type: "success", message: t("graph.save.github.success", { filename }).toString() });
        } catch (e) {
          console.error(e);
        }
      });
    }
  }, [isValid, createFile, filename, description, isPublic, cancel, notify, t, exportAsGephiLite]);

  return (
    <Modal
      title={t("graph.save.github.title", {
        provider: user?.provider.type ? t(`providers.${user.provider.type}`) : null,
      }).toString()}
      onClose={() => cancel()}
      onSubmit={() => save()}
      className="modal"
    >
      <>
        {error && <p className="text-center text-danger">{t("graph.save.github.error").toString()}</p>}

        <div className="mb-3">
          <label htmlFor="filename" className="form-label">
            {t("graph.save.github.field.filename").toString()}
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
            {t("graph.save.github.field.description").toString()}
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
              {t("graph.save.github.field.isPublic").toString()}
            </label>
          </div>
        </div>

        {loading && <Loader />}
      </>

      <div className="gl-gap-sm d-flex">
        <button
          type="reset"
          title={t("common.cancel").toString()}
          className="gl-btn gl-btn-outline"
          onClick={() => cancel()}
        >
          {t("common.cancel").toString()}
        </button>

        <button
          type="submit"
          title={t("common.save").toString()}
          className="gl-btn gl-btn-fill"
          disabled={!isValid || loading}
          onClick={() => save()}
        >
          {t("common.save").toString()}
        </button>
      </div>
    </Modal>
  );
};
