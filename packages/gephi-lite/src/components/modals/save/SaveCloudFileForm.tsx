import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PiCloudArrowUp } from "react-icons/pi";

import { useCloudProvider } from "../../../core/cloud/useCloudProvider";
import { useFile, useFileActions } from "../../../core/context/dataContexts";
import { getFilename } from "../../../core/file/utils";
import { useNotifications } from "../../../core/notifications";
import { useConnectedUser } from "../../../core/user";
import type { AsyncStatus } from "../../../utils/promises";
import { Loader } from "../../Loader";
import { PleaseSignIn } from "../../user/PleaseSignIn";

interface SaveCloudFileFormProps {
  id?: string;
  onStatusChange: (status: AsyncStatus) => void;
}
export const SaveCloudFileForm: FC<SaveCloudFileFormProps> = ({ id, onStatusChange }) => {
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

  const onSubmit = useCallback(async () => {
    if (isValid) {
      onStatusChange({ type: "loading" });
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
          onStatusChange({ type: "success" });
          notify({ type: "success", message: t("graph.save.github.success", { filename }).toString() });
        } catch (e) {
          onStatusChange({ type: "error" });
          console.error(e);
        }
      });
    }
  }, [isValid, createFile, filename, description, isPublic, notify, t, exportAsGephiLite, onStatusChange]);

  return (
    <>
      {user ? (
        <form
          id={id}
          className="h-100 d-flex flex-column gl-gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {error && <p className="text-center text-danger">{t("graph.save.github.error").toString()}</p>}

          <label htmlFor="filename" className="form-label">
            {t("graph.save.github.field.filename").toString()}
          </label>
          <input
            id="filename"
            className="form-control mb-2"
            type="string"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            required={true}
          />

          <label htmlFor="description" className="form-label">
            {t("graph.save.github.field.description").toString()}
          </label>
          <textarea
            id="description"
            className="form-control mb-2 flex-grow-1"
            value={description}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="form-check mb-2">
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

          <div className="gl-gap-2 d-flex justify-content-end">
            <button form="saveForm" className="gl-btn gl-btn-outline" disabled={loading}>
              <PiCloudArrowUp /> {t("common.save").toString()}
            </button>
          </div>

          {loading && <Loader />}
        </form>
      ) : (
        <PleaseSignIn />
      )}
    </>
  );
};
