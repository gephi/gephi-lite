import { FC, useEffect, useState } from "react";
import { isNil } from "lodash";
import { useNavigate } from "react-router-dom";
import { FaLock, FaFolderOpen, FaExternalLinkAlt } from "react-icons/fa";
import byteSize from "byte-size";

import { displayDateTime } from "../../utils/date";
import { ModalProps } from "../../core/modals/types";
import { useConnectedUser } from "../../core/user";
import { CloudFile } from "../../core/cloud/types";
import { useCloudFiles } from "../../core/cloud/useCloudFiles";
import { useLoadGexf } from "../../core/graph/userLoadGexf";
import { Modal } from "../modals";
import { Loader, Spinner } from "../Loader";

export const OpenFileModal: FC<ModalProps<{}>> = ({ cancel, submit }) => {
  const [user] = useConnectedUser();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<CloudFile | null>(null);
  const { loading, error, getFiles, getFile } = useCloudFiles();
  const { loading: ldGexf, error: errorGexf, load: loadGexf } = useLoadGexf();
  const [files, setFiles] = useState<Array<CloudFile>>([]);

  /**
   * When user change
   *  => if disconnected, close the modal
   */
  useEffect(() => {
    if (isNil(user)) cancel();
  }, [user, cancel]);

  /**
   * When component mount
   *  => load files
   */
  useEffect(() => {
    getFiles().then((files) => setFiles(files));
  }, [getFiles]);

  return (
    <Modal title={`Open a file from ${user?.provider.type}`} onClose={() => cancel()} className="modal-lg">
      <>
        {error && (
          <p className="text-error">
            A technical error occured while searching files on the provider. Please check your connectivity or try
            later.
          </p>
        )}
        {errorGexf && (
          <p className="text-error">
            An error occured while opening the file. Please check your connectivity and that the file is a valid GEXF.
          </p>
        )}

        {files.length > 0 && (
          <table className="table  table-hover">
            <thead>
              <tr>
                <th scope="col"></th>
                <th scope="col">Filename</th>
                <th scope="col">Created</th>
                <th scope="col">Updated</th>
                <th scope="col">Size</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr
                  key={file.id}
                  title={file.description}
                  className={selected && selected.id === file.id ? "table-active" : ""}
                  onClick={() => {
                    setSelected(selected && selected.id === file.id ? null : file);
                  }}
                >
                  <td>{!file.isPublic && <FaLock />}</td>
                  <td>
                    {file.filename}
                    <a
                      className="link-dark m-2"
                      href={file.webUrl}
                      title={`See the file on ${user?.provider.type}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FaExternalLinkAlt size="0.7em" />
                    </a>
                  </td>
                  <td>{displayDateTime(file.createdAt)}</td>
                  <td>{displayDateTime(file.updatedAt)}</td>
                  <td>{`${byteSize(file.size)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && files.length === 0 && (
          <p className="text-info">You have no GEXF file saved on {user?.provider.type}</p>
        )}
        {(loading || ldGexf) && <Loader />}
      </>
      <>
        <button
          className="btn btn-primary"
          disabled={!selected}
          title={selected ? `Open file ${selected.filename}` : "Select a file"}
          onClick={async () => {
            if (selected) {
              try {
                const content = await getFile(selected);
                if (content) {
                  await loadGexf(content);
                  navigate("/graph");
                  cancel();
                }
              } catch (e) {
                console.error(e);
              }
            }
          }}
        >
          {ldGexf ? <Spinner className="me-1" /> : <FaFolderOpen className="me-1" />}
          Open
        </button>
      </>
    </Modal>
  );
};
