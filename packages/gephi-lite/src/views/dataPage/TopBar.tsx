import { ItemType } from "@gephi/gephi-lite-sdk";
import { FC, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { PiMagnifyingGlass, PiX } from "react-icons/pi";

import ConfirmModal from "../../components/modals/ConfirmModal";
import {
  useDataTable,
  useDataTableActions,
  useGraphDatasetActions,
  useSelection,
} from "../../core/context/dataContexts";
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
      <button className="btn btn-outline-dark" type="button" onClick={() => onChange("")} disabled={!input}>
        <PiX />
      </button>
      <button className="btn btn-outline-dark" type="submit">
        <PiMagnifyingGlass />
      </button>
    </form>
  );
};

export const TopBar: FC = () => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const { type, search } = useDataTable();
  const { updateQuery } = useDataTableActions();
  const { deleteItems } = useGraphDatasetActions();
  const { type: selectionType, items } = useSelection();
  const selectionActionDisabled = selectionType !== type || !items.size;

  return (
    <div className="menu-bar flex-shrink-0 d-flex flex-row align-items-baseline p-2 gap-1">
      <section className="flex-shrink-1 flex-grow-1 d-flex flex-row align-items-baseline gap-1">
        <Trans i18nKey={`selection.${type}`} count={items.size} />
        <button className="btn" disabled={true /*selectionActionDisabled*/} onClick={() => console.log("TODO")}>
          {t(`edition.edit_selected_${type}`)}
        </button>
        {type === "nodes" && (
          <button className="btn" disabled={true /*selectionActionDisabled*/} onClick={() => console.log("TODO")}>
            {t(`edition.merge_selected_nodes`)}
          </button>
        )}
        <button
          className="btn"
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
          {t(`edition.delete_selected_${type}`)}
        </button>
      </section>
      <section>
        <SearchForm type={type} input={search} onChange={(query) => updateQuery({ query })} />
      </section>
    </div>
  );
};
