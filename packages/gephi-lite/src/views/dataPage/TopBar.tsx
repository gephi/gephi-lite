import { ItemType } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { capitalize, groupBy } from "lodash";
import { FC, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
  CloseIcon,
  EditIcon,
  OpenInGraphIcon,
  SearchIcon,
  TrashIcon,
  UnselectAllIcon,
} from "../../components/common-icons";
import { EditItemModal } from "../../components/data/EditItem";
import { EditMultipleItemsModal } from "../../components/data/EditMultipleItems";
import ConfirmModal from "../../components/modals/ConfirmModal";
import {
  useDataTable,
  useDataTableActions,
  useFilteredGraph,
  useGraphDataset,
  useGraphDatasetActions,
  useSelection,
  useSelectionActions,
} from "../../core/context/dataContexts";
import { EVENTS, useEventsContext } from "../../core/context/eventsContext";
import { useModal } from "../../core/modals";

const SearchForm: FC<{ type: ItemType; input: string; onChange: (input: string) => void }> = ({
  type,
  input,
  onChange,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState(input);

  useEffect(() => {
    setSearch(input);
  }, [input]);

  return (
    <form
      className="input-group"
      onSubmit={(e) => {
        e.preventDefault();
        if (search !== input) onChange(search);
      }}
    >
      <input
        type="text"
        className="form-control"
        placeholder={t(`search.${type}.placeholder`)}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <button className="btn btn-outline-secondary" type="button" onClick={() => onChange("")} disabled={!input}>
        <CloseIcon />
      </button>
      <button className="btn btn-outline-secondary" type="submit">
        <SearchIcon />
      </button>
    </form>
  );
};

export const TopBar: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { openModal } = useModal();
  const { type, search } = useDataTable();
  const { emitter } = useEventsContext();
  const { updateQuery } = useDataTableActions();
  const { fullGraph } = useGraphDataset();
  const filteredGraph = useFilteredGraph();
  const { emptySelection } = useSelectionActions();
  const { deleteItems } = useGraphDatasetActions();
  const { type: selectionType, items } = useSelection();
  const { nodeFields, edgeFields } = useGraphDataset();
  const matchingTypeSelectedCount = selectionType === type ? items.size : 0;
  const selectionActionDisabled = selectionType !== type || !items.size;

  // If nodes/edges has no data, multi edition can't be done
  const isMultiEditionPossible = useMemo(() => {
    if (selectionType === "edges" && edgeFields.length === 0) return false;
    if (selectionType === "nodes" && nodeFields.length === 0) return false;
    return true;
  }, [selectionType, nodeFields, edgeFields]);

  const { visible = [], hidden = [] } = useMemo(() => {
    if (selectionType !== type) return {};

    const isVisible =
      type === "nodes" ? filteredGraph.hasNode.bind(filteredGraph) : filteredGraph.hasEdge.bind(filteredGraph);
    return groupBy(Array.from(items), (item) => (isVisible(item) ? "visible" : "hidden"));
  }, [filteredGraph, items, selectionType, type]);

  return (
    <div className="menu-bar">
      <section className="d-flex align-items-center gl-gap-1 p-2 border-end">
        {["nodes", "edges"].map((itemType) => (
          <button
            key={itemType}
            className={cx("gl-btn", type === itemType && "gl-btn-fill")}
            onClick={() => navigate(`/data/${itemType}`)}
          >
            {capitalize(t(`graph.model.${itemType}`))}
          </button>
        ))}
      </section>
      <section className="flex-shrink-1 flex-grow-1 d-flex flex-row align-items-middle p-2 gap-1">
        <span className="gl-btnlike selection-title">
          <Trans i18nKey={`selection.${type}`} count={matchingTypeSelectedCount} />
          {!!hidden.length && (
            <>
              {" "}
              (
              <Trans i18nKey={`selection.visible`} count={visible.length} />,{" "}
              <Trans i18nKey={`selection.hidden`} count={hidden.length} />)
            </>
          )}
          {visible.length > 0 && t("common.colon")}
        </span>
        {selectionType === type && items.size > 0 && (
          <>
            <button
              className="gl-btn gl-btn-icon"
              disabled={selectionActionDisabled}
              title={t("selection.open_in_graph")}
              onClick={() => {
                navigate(`/`);
                emitter.once(EVENTS.sigmaMounted, () => {
                  emitter.emit(EVENTS.focusNodes, {
                    nodes:
                      type === "nodes"
                        ? items
                        : new Set(Array.from(items).flatMap((edgeId) => fullGraph.extremities(edgeId))),
                  });
                });
              }}
            >
              <OpenInGraphIcon />
            </button>
            {(items.size === 1 || isMultiEditionPossible) && (
              <button
                className="gl-btn gl-btn-icon"
                title={t(`edition.edit_selected_${type}`, { count: items.size })}
                disabled={selectionActionDisabled}
                onClick={() =>
                  items.size === 1
                    ? openModal({
                        component: EditItemModal,
                        arguments: {
                          type,
                          itemId: Array.from(items)[0],
                        },
                      })
                    : openModal({
                        component: EditMultipleItemsModal,
                        arguments: {
                          type,
                          items,
                        },
                      })
                }
              >
                <EditIcon />
              </button>
            )}
            <button
              className="gl-btn gl-btn-icon"
              title={t(`edition.delete_selected_${type}`, { count: items.size })}
              disabled={selectionActionDisabled}
              onClick={() =>
                openModal({
                  component: ConfirmModal,
                  arguments: {
                    title: t(`edition.delete_selected_${type}`),
                    message: t(`edition.confirm_delete_${type}`, { count: items.size }),
                    successMsg: t(`edition.delete_${type}_success`, { count: items.size }),
                  },
                  afterSubmit: () => {
                    deleteItems(type, Array.from(items));
                  },
                })
              }
            >
              <TrashIcon />
            </button>
            <button
              className="gl-btn gl-btn-icon"
              title={t(`selection.unselect_all`)}
              disabled={selectionActionDisabled}
              onClick={() => emptySelection()}
            >
              <UnselectAllIcon />
            </button>
          </>
        )}
      </section>
      <section className="d-flex align-items-center px-2">
        <SearchForm type={type} input={search} onChange={(query) => updateQuery({ query })} />
      </section>
    </div>
  );
};
