import { FC, useEffect, useState } from "react";
import { isNil } from "lodash";
import { useNavigate } from "react-router-dom";

import { ModalProps } from "../../core/modals/types";
import { useConnectedUser } from "../../core/user";
import { CloudFile } from "../../core/cloud/types";
import { useCloudFiles } from "../../core/cloud/useCloudFiles";
import { useLoadGexf } from "../../core/graph/userLoadGexf";
import { Modal } from "../modals";
import { Loader } from "../Loader";

export const OpenFileModal: FC<ModalProps<{}>> = ({ cancel, submit }) => {
  const [user] = useConnectedUser();
  const navigate = useNavigate();
  const { loading, error, getFiles, getFile } = useCloudFiles();
  const { loading: ldGexf, load: loadGexf, error: errorGexf } = useLoadGexf();
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

  // log errors
  if (error) console.error(error);
  if (errorGexf) console.error(errorGexf);

  return (
    <Modal title={"Open a graph"} onClose={() => cancel()}>
      <>
        {files && (
          <ul>
            {files.map((file) => (
              <li key={file.id}>
                <button
                  className="btn btn-link"
                  onClick={async () => {
                    try {
                      const content = await getFile(file);
                      if (content) {
                        await loadGexf(content);
                        navigate("/graph");
                        cancel();
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  {file.filename}
                </button>
              </li>
            ))}
          </ul>
        )}
        {(loading || ldGexf) && <Loader />}
      </>
    </Modal>
  );
};
