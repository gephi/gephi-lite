import byteSize from "byte-size";
import cx from "classnames";
import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { CloudFile } from "../../../core/cloud/types";
import { useCloudProvider } from "../../../core/cloud/useCloudProvider";
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
}

export const OpenCloudFileForm: FC<OpenCloudFileFormProps> = ({ id, onStatusChange }) => {
  const [user] = useConnectedUser();
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { loading, error, getFiles, openFile, getThumbnail } = useCloudProvider();
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
          onStatusChange({ type: "error" });
          console.error(e);
          notify({
            type: "error",
            message: t("graph.open.github.error"),
            title: t("gephi-lite.title"),
          });
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
          {error && <p className="text-center text-danger">{t("graph.open.github.error")}</p>}

          {files.length > 0 && (
            <>
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col">{t("common.image")}</th>
                    <th scope="col">{t("common.filename").toString()}</th>
                    <th scope="col">{t("common.updated").toString()}</th>
                    <th scope="col">{t("common.size").toString()}</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <CloudFileRow
                      key={file.id}
                      file={file}
                      selected={selected?.id === file.id}
                      onClick={() => setSelected(selected && selected.id === file.id ? null : file)}
                      getThumbnail={getThumbnail}
                    />
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

interface CloudFileRowProps {
  file: Omit<CloudFile, "format">;
  selected: boolean;
  onClick: () => void;
  getThumbnail: (file: CloudFile) => Promise<string>;
}

const CloudFileRow: FC<CloudFileRowProps> = ({ file, selected, onClick, getThumbnail }) => {
  const { t } = useTranslation();
  const [thumbUrl, setThumbUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    getThumbnail(file as CloudFile).then((url) => {
      if (active && url) setThumbUrl(url);
    });
    return () => {
      active = false;
    };
  }, [file, getThumbnail]);

  return (
    <tr
      title={file.description}
      className={cx("cursor-pointer", selected && "table-active")}
      onClick={onClick}
    >
      <td className="align-middle">{!file.isPublic && <LockIcon />}</td>
      <td className="align-middle">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={file.filename}
            style={{ width: "60px", height: "40px", objectFit: "cover", borderRadius: "4px" }}
          />
        ) : (
          <div style={{ width: "60px", height: "40px", backgroundColor: "#eee", borderRadius: "4px" }} />
        )}
      </td>
      <td className="align-middle">
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
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLinkIcon />
        </a>
      </td>
      <td className="align-middle">{displayDateTime(file.updatedAt)}</td>
      <td className="align-middle">{`${byteSize(file.size)}`}</td>
    </tr>
  );
};
