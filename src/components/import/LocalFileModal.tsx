import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFolderOpen } from "react-icons/fa";

import { ModalProps } from "../../core/modals/types";
import { useLoadGexf } from "../../core/graph/userLoadGexf";
import { Modal } from "../modals";
import { Loader } from "../Loader";
import { DropInput } from "../DropInput";

export const LocalFileModal: FC<ModalProps<{}>> = ({ cancel, submit }) => {
  const navigate = useNavigate();
  const { loading, error, loadFromFile } = useLoadGexf();
  const [file, setFile] = useState<File | null>(null);

  return (
    <Modal title={`Open a local file`} onClose={() => cancel()}>
      <>
        {error && (
          <p className="text-error">
            An error occured while opening the file. Please check your connectivity and that the file is a valid GEXF.
          </p>
        )}
        <DropInput
          value={file}
          onChange={(file) => setFile(file)}
          helpText={"Drag'n'drop a GEXF file"}
          accept={{ "application/graph": [".gexf"] }}
        />
        {loading && <Loader />}
      </>
      <>
        <button
          className="btn btn-primary"
          disabled={!file}
          title={file ? `Open file ${file.name}` : ""}
          onClick={async () => {
            if (file) {
              try {
                await loadFromFile(file);
                navigate("/graph");
                cancel();
              } catch (e) {
                console.error(e);
              }
            }
          }}
        >
          <FaFolderOpen className="me-1" />
          Open
        </button>
      </>
    </Modal>
  );
};
