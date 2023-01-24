import { FC, useEffect, useState, useCallback } from "react";
import { FaSave, FaTimes } from "react-icons/fa";

import { ModalProps } from "../../core/modals/types";
import { useExportGexf } from "../../core/graph/useExportGexf";
import { useConnectedUser } from "../../core/user";
import { Modal } from "../modals";
import { Loader } from "../Loader";

export const SaveCloudFileModal: FC<ModalProps<{}>> = ({ cancel, submit }) => {
  const [user] = useConnectedUser();
  const { loading, error, exportAsGexf } = useExportGexf();
  const [filename, setFilename] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isValid, setIsValid] = useState<boolean>(false);

  useEffect(() => {
    setIsValid(filename.length > 0);
  }, [filename]);

  const save = useCallback(() => {
    const content = exportAsGexf();
    user?.provider.createFile({ filename: `${filename}.gexf`, description, isPublic }, content).then(() => cancel());
    cancel();
  }, [exportAsGexf, filename, description, isPublic, cancel, user?.provider]);

  return (
    <Modal title={`Save in ${user?.provider.type}`} onClose={() => cancel()} className="modal">
      <>
        {error && <p className="text-error">A technical error occured while generating the GEXF.</p>}

        <form className="row g-3" onSubmit={() => save()}>
          <div className="mb-3">
            <label htmlFor="filename" className="form-label">
              Filename
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
              Description
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
                Create a public gist
              </label>
            </div>
          </div>
        </form>
        {loading && <Loader />}
      </>
      <>
        <button title="Cancel" className="btn btn-outline-danger" onClick={() => cancel()}>
          <FaTimes className="me-1" />
          Cancel
        </button>
        <button title="Save the graph as a gist" className="btn btn-primary" disabled={!isValid} onClick={() => save()}>
          <FaSave className="me-1" />
          Save
        </button>
      </>
    </Modal>
  );
};
