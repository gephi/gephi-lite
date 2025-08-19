import type { ItemType } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { capitalize } from "lodash";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import TetherComponent from "react-tether";

import {
  useFilteredGraph,
  useFilters,
  useGraphDataset,
  useGraphDatasetActions,
  usePreferences,
} from "../core/context/dataContexts";
import { EditIcon, EditIconFill, FiltersIcon, FiltersIconFill } from "./common-icons";

const GraphStat: FC<{ className?: string; type: ItemType; current: number; total: number }> = ({
  className,
  type,
  current,
  total,
}) => {
  const { locale } = usePreferences();
  const { t } = useTranslation();

  const isFiltered = useMemo(() => current !== total, [current, total]);

  return (
    <div className={cx("d-flex flex-column", className)}>
      <div>{capitalize(t(`graph.model.${type}`))}</div>
      <div>
        <span>
          {current.toLocaleString(locale)}
          {isFiltered && <> ({((current / total) * 100).toFixed(1)}%)</>}
        </span>
        {isFiltered && <div className="text-muted">of {total.toLocaleString(locale)}</div>}
      </div>
    </div>
  );
};

const GraphTitleEditable: FC<{ title?: string; save: (title?: string) => void }> = ({ title, save }) => {
  const [tether, setTether] = useState<TetherComponent | null>(null);
  const [mode, setMode] = useState<"edit" | "read">("read");
  const [value, setValue] = useState(title);
  const [textareaRef, setTextareaRef] = useState<HTMLElement | null>(null);

  const submit = useCallback(() => {
    save(value);
    setMode("read");
  }, [value, save]);

  const cancel = useCallback(() => {
    setValue(title);
    setMode("read");
  }, [title]);

  useEffect(() => {
    setValue(title);
  }, [title]);

  useEffect(() => {
    textareaRef?.focus();
  }, [textareaRef]);

  // Handle interactions:
  useEffect(() => {
    const elementWrapper = tether?._elementNode;
    const targetWrapper = tether?._targetNode;
    const handleClickBody = (e: MouseEvent) => {
      if (!elementWrapper?.current || !targetWrapper?.current) return;

      const node = e.target as Node;
      if (!elementWrapper.current.contains(node) && !targetWrapper?.current.contains(node)) {
        cancel();
      }
    };

    setTimeout(() => {
      document.body.addEventListener("click", handleClickBody);
    }, 0);
    return () => {
      document.body.removeEventListener("click", handleClickBody);
    };
  }, [tether, cancel]);

  return (
    <div className="graph-title d-flex" style={{ alignItems: "baseline" }}>
      {mode === "read" ? (
        <span className="flex-grow-1 gl-px-2 gl-text-wrap-anywhere"> {title}</span>
      ) : (
        <TetherComponent
          ref={setTether}
          attachment="top left"
          targetAttachment="top left"
          id="graph-title-edition"
          constraints={[{ to: "scrollParent", attachment: "together", pin: true }]}
          renderTarget={(ref) => (
            <span ref={ref} className="flex-grow-1 gl-px-2 gl-text-wrap-anywhere">
              {title}
            </span>
          )}
          renderElement={(ref) => (
            <div
              ref={ref}
              style={{
                width: tether?._targetNode?.current?.clientWidth,
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                  if (e.key === "Escape") {
                    cancel();
                  }
                  // to be able to do tab/enter to save the form
                  if (e.key === "Tab") {
                    e.preventDefault();
                    document.getElementById("graph-title-btn")!.focus();
                  }
                }}
              >
                <textarea
                  ref={setTextareaRef}
                  className="form-control lh-1"
                  style={{ paddingTop: "9px" }}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </form>
            </div>
          )}
        />
      )}

      <button
        id="graph-title-btn"
        onClick={() => {
          if (mode === "read") setMode("edit");
          else submit();
        }}
        className={cx("gl-btn gl-btn-icon", mode === "edit" && "gl-btn-fill")}
      >
        {mode === "read" ? <EditIcon /> : <EditIconFill />}
      </button>
    </div>
  );
};

export const GraphSummary: FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation();
  const filterState = useFilters();
  const filteredGraph = useFilteredGraph();
  const { setGraphMeta } = useGraphDatasetActions();
  const { metadata, fullGraph } = useGraphDataset();

  const hasFilters = useMemo(
    () => filterState.future.length + filterState.past.length,
    [filterState.future, filterState.past],
  );

  const FiltersIco = useMemo(
    () => (filterState.past.length === 0 && filterState.future.length > 0 ? FiltersIcon : FiltersIconFill),
    [filterState.future, filterState.past],
  );

  const saveTitle = useCallback(
    (title: string) => {
      setGraphMeta({ ...metadata, title });
    },
    [setGraphMeta, metadata],
  );

  return (
    <div className={cx("graph-summary d-flex flex-column gl-gap-2", className)}>
      <GraphTitleEditable title={metadata.title} save={saveTitle} />
      <div className="gl-px-2 gl-gap-x-2 d-flex flex-column position-relative">
        <div className="d-flex flex-row flex-wrap gl-gap-x-3 gl-gap-y-3" style={{ lineHeight: 1.2 }}>
          <GraphStat type="nodes" current={filteredGraph.order} total={fullGraph.order} />
          <GraphStat type="edges" current={filteredGraph.size} total={fullGraph.size} />
        </div>
        <span>{t(`graph.model.${metadata.type || "mixed"}_graph`)}</span>

        {hasFilters > 0 && <FiltersIco style={{ left: "calc(100% - 1.5em)", top: 0, position: "absolute" }} />}
      </div>
    </div>
  );
};
