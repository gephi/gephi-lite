import fileSaver from "file-saver";
import { FC, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAppearance, useSigmaAtom } from "../../../core/context/dataContexts";
import { ModalProps } from "../../../core/modals/types";
import { useNotifications } from "../../../core/notifications";
import { getGraphSnapshot } from "../../../utils/sigma";
import { Modal } from "../../modals";

export const ExportPNGModal: FC<ModalProps<unknown>> = ({ cancel }) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const sigma = useSigmaAtom();
  const { backgroundColor } = useAppearance();

  const [data, setData] = useState<{
    width: number;
    height: number;
    preserve_camera: boolean;
    filename: string;
  }>({
    width: sigma.getContainer().offsetWidth,
    height: sigma.getContainer().offsetHeight,
    preserve_camera: false,
    filename: "gephi-lite-export.png",
  });

  const handleSubmit = useCallback(async () => {
    const blob = await getGraphSnapshot(sigma.getGraph(), sigma.getSettings(), {
      width: data.width,
      height: data.height,
      backgroundColor,
      cameraState: data.preserve_camera ? sigma.getCamera().getState() : undefined,
      ratio: 1,
    });

    fileSaver(blob, data.filename);

    notify({
      type: "success",
      message: t("graph.export.png.success").toString(),
    });
    cancel();
  }, [cancel, data.filename, data.height, data.preserve_camera, data.width, notify, sigma, t, backgroundColor]);

  return (
    <Modal
      title={t("graph.export.png.title").toString()}
      onClose={() => cancel()}
      onSubmit={handleSubmit}
      doNotPreserveData
      className="modal"
    >
      <>
        <div className="mb-3">
          <label htmlFor="filename" className="form-label">
            {t("graph.export.png.fields.filename").toString()}
          </label>
          <input
            id="filename"
            className="form-control"
            type="string"
            value={data.filename}
            onChange={(e) => setData((d) => ({ ...d, filename: e.target.value }))}
            required={true}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="width" className="form-label">
            {t("graph.export.png.fields.width").toString()}
          </label>
          <input
            id="width"
            className="form-control"
            type="number"
            min={1}
            value={data.width}
            onChange={(e) => setData((d) => ({ ...d, width: +e.target.value }))}
            required={true}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="height" className="form-label">
            {t("graph.export.png.fields.height").toString()}
          </label>
          <input
            id="width"
            className="form-control"
            type="number"
            min={1}
            value={data.height}
            onChange={(e) => setData((d) => ({ ...d, height: +e.target.value }))}
            required={true}
          />
        </div>

        <div className="mb-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="isPublic"
              checked={data.preserve_camera}
              onChange={(e) => setData((d) => ({ ...d, preserve_camera: e.target.checked }))}
            />
            <label className="form-check-label" htmlFor="isPublic">
              {t("graph.export.png.fields.preserve_camera").toString()}
            </label>
          </div>
        </div>
      </>

      <div className="gl-gap-2 d-flex">
        <button
          type="reset"
          title={t("common.cancel").toString()}
          className="gl-btn gl-btn-outline"
          onClick={() => cancel()}
        >
          {t("common.cancel").toString()}
        </button>
        <button type="submit" title={t("common.save").toString()} className="gl-btn gl-btn-fill">
          {t("common.save").toString()}
        </button>
      </div>
    </Modal>
  );
};
