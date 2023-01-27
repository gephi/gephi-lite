import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaLock, FaFolderOpen, FaExternalLinkAlt, FaSync, FaTimes } from "react-icons/fa";
import byteSize from "byte-size";

import { displayDateTime } from "../../../../utils/date";
import { ModalProps } from "../../../../core/modals/types";
import { useConnectedUser } from "../../../../core/user";
import { CloudFile } from "../../../../core/cloud/types";
import { useCloudProvider } from "../../../../core/cloud/useCloudProvider";
import { Modal } from "../../../../components/modals";
import { Loader } from "../../../../components/Loader";

const PAGINATION_SIZE = 10;

export const CloudFileModal: FC<ModalProps<{}>> = ({ cancel, submit }) => {
  const [user] = useConnectedUser();
  const { t } = useTranslation();
  const { loading, error, getFiles, openFile } = useCloudProvider();
  // list files retrived from the cloud
  const [files, setFiles] = useState<Array<CloudFile>>([]);
  // the selected file by the user
  const [selected, setSelected] = useState<CloudFile | null>(null);
  // for the pagination
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);

  /**
   * When component mount
   *  => load files
   */
  useEffect(() => {
    getFiles(page * PAGINATION_SIZE, PAGINATION_SIZE).then((result) => {
      setFiles((files) => (page > 0 ? [...files, ...result] : result));
      setHasMore(result.length === PAGINATION_SIZE);
    });
  }, [getFiles, page]);

  return (
    <Modal
      title={t("graph.open.cloud.title", { provider: user?.provider.type || "" }).toString()}
      onClose={() => cancel()}
      className="modal-lg"
    >
      <>
        {error && <p className="text-center text-danger">{t("graph.open.cloud.error")}</p>}

        {files.length > 0 && (
          <>
            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col"></th>
                  <th scope="col">{t("common.filename").toString()}</th>
                  <th scope="col">{t("common.created").toString()}</th>
                  <th scope="col">{t("common.updated").toString()}</th>
                  <th scope="col">{t("common.size").toString()}</th>
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
                        title={t("graph.open.cloud.file-open-external", {
                          filename: file.filename,
                          provider: user?.provider.type || "",
                        }).toString()}
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
            {hasMore && (
              <div className="d-flex justify-content-center">
                <button title="Load next page" className="btn btn-primary btn-sm" onClick={() => setPage(page + 1)}>
                  <FaSync className="me-1" />
                  {t("common.load-more").toString()}
                </button>
              </div>
            )}
          </>
        )}
        {!loading && files.length === 0 && (
          <p className="text-info">
            {t("graph.open.cloud.no-data", { provider: user?.provider.type || "" }).toString()}
          </p>
        )}
        {loading && <Loader />}
      </>
      <>
        <button title="Cancel" className="btn btn-outline-danger" onClick={() => cancel()}>
          <FaTimes className="me-1" />
          {t("common.cancel").toString()}
        </button>
        <button
          className="btn btn-primary"
          disabled={!selected}
          title={
            selected
              ? t("common.open_file", { filename: selected.filename }).toString()
              : t("graph.open.cloud.select-file").toString()
          }
          onClick={async () => {
            if (selected) {
              try {
                await openFile(selected);
                cancel();
              } catch (e) {
                console.error(e);
              }
            }
          }}
        >
          <FaFolderOpen className="me-1" />
          {t("common.open").toString()}
        </button>
      </>
    </Modal>
  );
};
