import { toNumber } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { fromPairs, isNil, omit, pick } from "lodash";
import { FC, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { BsFillTrashFill } from "react-icons/bs";
import { FaTimes } from "react-icons/fa";

import { Modal } from "../../../../components/modals";
import { useGraphDataset, useGraphDatasetActions, useSelectionActions } from "../../../../core/context/dataContexts";
import { FieldModel, NodeRenderingData } from "../../../../core/graph/types";
import { ModalProps } from "../../../../core/modals/types";
import { useNotifications } from "../../../../core/notifications";
import { Scalar } from "../../../../core/types";

interface UpdatedNodeState extends Omit<NodeRenderingData, "rawSize"> {
  id?: string;
  attributes: ({ key: string; value: Scalar } & Partial<Pick<FieldModel<"nodes">, "qualitative" | "quantitative">>)[];
}

const UpdateNodeModal: FC<ModalProps<{ nodeId?: string }>> = ({ cancel, submit, arguments: { nodeId } }) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { createNode, updateNode } = useGraphDatasetActions();
  const { nodeData, nodeRenderingData, nodeFields } = useGraphDataset();
  const { select } = useSelectionActions();

  const isNew = typeof nodeId === "undefined";
  const defaultValues = useMemo(() => {
    if (isNew)
      return {
        x: 0,
        y: 0,
        attributes: nodeFields.map((nf) => ({
          key: nf.id,
          value: undefined,
          ...pick(nf, ["qualitative", "quantitative"]),
        })),
      };

    return {
      id: nodeId,
      ...omit(nodeRenderingData[nodeId], "rawSize"),
      attributes: nodeFields.map((nf) => ({
        key: nf.id,
        value: nodeData[nodeId][nf.id],
        ...pick(nf, ["qualitative", "quantitative"]),
      })),
    };
  }, [isNew, nodeId, nodeRenderingData, nodeData, nodeFields]);
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<UpdatedNodeState>({
    defaultValues,
  });
  const attributes = watch("attributes");
  return (
    <Modal
      title={(isNew ? t("edition.create_nodes") : t("edition.update_nodes")) as string}
      onClose={() => cancel()}
      className="modal-lg"
      onSubmit={handleSubmit((data) => {
        // generate id if not present
        const id: string = data.id || crypto.randomUUID();

        if (!id) {
          setValue("id", id);
          if (nodeData[id])
            notify({
              type: "error",
              title: t("edition.update_nodes"),
              message: t("error.unknown"),
            });
          return;
        }

        const allAttributes = {
          ...fromPairs(
            data.attributes
              .filter(({ value }) => value !== "" || value === undefined)
              .map(({ key, value }) => {
                // value are all string because input are all text whatever the data model
                // for now we cast value as number if they are number to help downstream algo to create appropriate data model
                const valueAsNumber = toNumber(value);
                return [key, valueAsNumber ? valueAsNumber : value];
              }),
          ),
          ...pick(data, "label", "color", "size", "x", "y"),
        };

        // Create new node:
        if (isNew) {
          try {
            createNode(id, allAttributes);
            select({ type: "nodes", items: new Set([id]), replace: true });
            notify({
              type: "success",
              title: t("edition.create_nodes"),
              message: t("edition.create_nodes_success"),
            });
            submit({});
          } catch (e) {
            notify({
              type: "error",
              title: t("edition.create_nodes"),
              message: (e as Error).message || t("error.unknown"),
            });
          }
        }
        // Update existing node:
        else {
          try {
            updateNode(id, allAttributes);
            select({ type: "nodes", items: new Set([id]), replace: true });
            notify({
              type: "success",
              title: t("edition.update_nodes"),
              message: t("edition.update_nodes_success"),
            });
            submit({});
          } catch (e) {
            notify({
              type: "error",
              title: t("edition.update_nodes"),
              message: (e as Error).message || t("error.unknown"),
            });
          }
        }
      })}
    >
      <div className="row g-3">
        <div className="col-12">
          <label htmlFor="updateNode-id" className="form-label">
            {t("graph.model.nodes-data.id")}
          </label>
          <input
            type="text"
            id="updateNode-id"
            className={cx("form-control", errors.id && "is-invalid")}
            disabled={!isNew}
            {...register("id", {
              required: !isNew,
              validate: (value) => !isNew || (!!value && !nodeData[value]) || (!value && isNew),
            })}
          />
          {errors.id && (
            <div className="invalid-feedback">
              {t(`error.form.${errors.id.type === "validate" ? "unique" : errors.id.type}`)}
            </div>
          )}
        </div>

        {/* Rendering attributes */}
        <div className="col-md-12 d-flex flex-row align-items-center">
          <label htmlFor="updateNode-label" className="form-label mb-0 flex-grow-1 flex-shrink-0">
            {t("graph.model.nodes-data.label")}
          </label>
          <input
            type="text"
            id="updateNode-label"
            className={cx("form-control flex-grow-1 ms-2", errors.label && "is-invalid")}
            min={0}
            {...register("label")}
          />
          <button
            type="button"
            className="btn btn-sm btn-outline-dark flex-shrink-0 ms-2"
            onClick={() => setValue("label", undefined)}
          >
            <FaTimes />
          </button>
        </div>
        <div className="col-md-6 d-flex flex-row align-items-center">
          <label htmlFor="updateNode-x" className="form-label mb-0 flex-shrink-0">
            {t("graph.model.nodes-data.x")}
          </label>
          <input
            type="number"
            id="updateNode-x"
            className={cx("form-control flex-grow-1 ms-2", errors.x && "is-invalid")}
            step="any"
            {...register("x")}
          />
        </div>
        <div className="col-md-6 d-flex flex-row align-items-center">
          <label htmlFor="updateNode-y" className="form-label mb-0 flex-shrink-0">
            {t("graph.model.nodes-data.y")}
          </label>
          <input
            type="number"
            id="updateNode-y"
            className={cx("form-control flex-grow-1 ms-2", errors.y && "is-invalid")}
            step="any"
            {...register("y")}
          />
        </div>

        {/* Other attributes */}
        <div className="fs-5">{t("graph.model.nodes-data.attributes")}</div>
        {attributes.map((field, i) => (
          <div key={i} className="col-12 d-flex flex-row">
            <div className="flex-grow-1 me-2">
              <input
                type="text"
                className={cx("form-control", (errors.attributes || [])[i]?.key && "is-invalid")}
                placeholder={t("graph.model.nodes-data.attribute-name") as string}
                {...register(`attributes.${i}.key`, {
                  required: "true",
                  validate: (value, formValues) => !formValues.attributes.some((v, j) => j !== i && value === v.key),
                })}
              />
              {(errors.attributes || [])[i]?.key && (
                <div className="invalid-feedback">
                  {t(
                    `error.form.${
                      (errors.attributes || [])[i]?.key?.type === "validate"
                        ? "unique"
                        : (errors.attributes || [])[i]?.key?.type
                    }`,
                  )}
                </div>
              )}
            </div>
            <div className="flex-grow-1 me-2">
              <input
                type={isNil(field.qualitative) && !isNil(field.quantitative) ? "number" : "text"}
                className={cx("form-control flex-grow-1 me-2", (errors.attributes || [])[i]?.value && "is-invalid")}
                placeholder={t("graph.model.nodes-data.attribute-value") as string}
                {...register(`attributes.${i}.value`)}
              />
              {(errors.attributes || [])[i]?.value && (
                <div className="invalid-feedback">{t(`error.form.${(errors.attributes || [])[i]?.value?.type}`)}</div>
              )}
            </div>
            <button
              type="button"
              className="btn btn-sm btn-danger flex-shrink-0"
              title={t("edition.delete_nodes_attributes", { name: field.key })}
              onClick={() =>
                setValue(
                  "attributes",
                  getValues("attributes").filter((_, j) => j !== i),
                )
              }
            >
              <BsFillTrashFill />
            </button>
          </div>
        ))}
        <div className="col-12">
          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={() => setValue("attributes", getValues("attributes").concat({ key: "", value: "" }))}
          >
            <AiOutlinePlusCircle className="me-2" /> {t("graph.model.nodes-data.new-attribute")}
          </button>
        </div>
      </div>

      <>
        <button type="button" className="btn btn-outline-dark" onClick={() => cancel()}>
          {t("common.cancel")}
        </button>
        <button type="submit" className="btn btn-primary">
          {isNew ? t("edition.create_nodes") : t("edition.update_nodes")}
        </button>
      </>
    </Modal>
  );
};

export default UpdateNodeModal;
