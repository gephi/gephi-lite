import byteSize from "byte-size";
import cx from "classnames";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { CloudFile } from "../../../core/cloud/types";
import { useCloudProvider } from "../../../core/cloud/useCloudProvider";
import { useFile } from "../../../core/context/dataContexts";
import { errorToString } from "../../../core/errors";
import { useNotifications } from "../../../core/notifications";
import { useConnectedUser } from "../../../core/user";
import { displayDateTime } from "../../../utils/date";
import type { AsyncStatus } from "../../../utils/promises";
import { Loader } from "../../Loader";
import { ExternalLinkIcon, LockIcon, SyncIcon } from "../../common-icons";
import { PleaseSignIn } from "../../user/PleaseSignIn";

const PAGINATION_SIZE = 12;

interface OpenCloudFileFormProps {
  id?: string;
  onStatusChange: (status: AsyncStatus) => void;
  status: AsyncStatus;
}

export const OpenCloudFileForm: FC<OpenCloudFileFormProps> = ({ id, onStatusChange, status }) => {
  const [user] = useConnectedUser();
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { loading, getFiles, openFile } = useCloudProvider();
  const { current } = useFile();
  // list files retrived from the cloud
  const [files, setFiles] = useState<Array<Omit<CloudFile, "format">>>([]);
  // the selected file by the user
  const [selected, setSelected] = useState<Omit<CloudFile, "format"> | null>(null);
  // for the pagination
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);

  /**
   * When component mount
   *  => load files
   */
  useEffect(() => {
    if (user) {
      getFiles(page * PAGINATION_SIZE, PAGINATION_SIZE).then((result) => {
        setFiles((files) => (page > 0 ? [...files, ...result] : result));
        setHasMore(result.length === PAGINATION_SIZE);
      });
    }
  }, [getFiles, page, user]);

  // Preselect the file currently open in the workspace, so it's immediately possible to hit "Open"
  // again without having to click it in the list first - it looked selected already (it's the file
  // you're working on), it should actually be. Only attempted once, right after the list first
  // loads: this must never override a choice the user makes while browsing afterwards.
  const triedPreselect = useRef(false);
  useEffect(() => {
    if (triedPreselect.current || files.length === 0) return;
    triedPreselect.current = true;
    if (current?.type === "cloud") {
      const currentInList = files.find((file) => file.id === current.id);
      if (currentInList) setSelected(currentInList);
    }
  }, [files, current]);

  const onSubmit = useCallback(
    async (selected: Omit<CloudFile, "format"> | null) => {
      if (selected) {
        try {
          onStatusChange({ type: "loading" });
          await openFile(selected);
          onStatusChange({ type: "success" });
          notify({
            type: "success",
            message: t("graph.open.github.success", { filename: selected.filename }).toString(),
          });
        } catch (e) {
          onStatusChange({ type: "error", message: errorToString(e) });
          console.error(e);
        }
      }
    },
    [openFile, notify, onStatusChange, t],
  );

  return (
    <>
      {user ? (
        <form
          id={id}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(selected);
          }}
        >
          {status.type === "error" && (
            <p className="text-center text-danger">{status.message || t("graph.open.github.error")}</p>
          )}

          {files.length > 0 && (
            <>
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col">{t("common.filename").toString()}</th>
                    <th scope="col">{t("common.updated").toString()}</th>
                    <th scope="col">{t("common.size").toString()}</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr
                      key={file.id}
                      title={file.description}
                      className={cx("cursor-pointer", selected && selected.id === file.id && "table-active")}
                      onClick={() => {
                        setSelected(selected && selected.id === file.id ? null : file);
                      }}
                    >
                      <td>{!file.isPublic && <LockIcon />}</td>
                      <td>
                        {file.filename}
                        <a
                          className="m-2"
                          href={file.webUrl}
                          title={t("graph.open.github.file-open-external", {
                            filename: file.filename,
                            provider: t(`providers.github`),
                          }).toString()}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLinkIcon />
                        </a>
                      </td>
                      <td>{displayDateTime(file.updatedAt)}</td>
                      <td>{`${byteSize(file.size)}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMore && (
                <div className="d-flex justify-content-center">
                  <button title="Load next page" className="gl-btn gl-btn-outline" onClick={() => setPage(page + 1)}>
                    <SyncIcon className="me-1" />
                    {t("common.load-more").toString()}
                  </button>
                </div>
              )}
            </>
          )}
          {!loading && files.length === 0 && (
            <p className="text-info">
              {t("graph.open.github.no-data", {
                provider: t(`providers.github`),
              }).toString()}
            </p>
          )}
          {loading && <Loader />}
        </form>
      ) : (
        <PleaseSignIn />
      )}
    </>
  );
};
