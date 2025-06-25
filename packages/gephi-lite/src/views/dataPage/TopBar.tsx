import { ItemType } from "@gephi/gephi-lite-sdk";
import { capitalize } from "lodash";
import { FC, useEffect, useState } from "react";
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
        placeholder={`Search for ${type}...`}
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
  const { openModal } = useModal();
  const { type, search } = useDataTable();
  const { updateQuery } = useDataTableActions();
  const { deleteItems } = useGraphDatasetActions();
  const { type: selectionType, items } = useSelection();
  const selectionActionDisabled = selectionType !== type || !items.size;

  return (
    <div className="menu-bar flex-shrink-0 d-flex flex-row align-items-baseline p-2">
      <section>{capitalize(type)}</section>
      <section className="flex-grow-1 d-flex flex-row align-items-baseline justify-content-center gap-1">
        <button className="btn" disabled={selectionActionDisabled} onClick={() => console.log("TODO")}>
          Edit selected {type}
        </button>
        <button className="btn" disabled={selectionActionDisabled} onClick={() => console.log("TODO")}>
          Merge selected {type}
        </button>
        <button
          className="btn"
          disabled={selectionActionDisabled}
          onClick={() =>
            openModal({
              component: ConfirmModal,
              arguments: {
                title: `Delete selected ${type}`,
                message: `Are you sure you want to delete the ${items.size} selected ${type}?`,
                successMsg: `The ${items.size} selected ${type} have successfully been deleted.`,
              },
              afterSubmit: () => {
                deleteItems(type, Array.from(items));
              },
            })
          }
        >
          Delete selected {type}
        </button>
      </section>
      <section>
        <SearchForm type={type} input={search} onChange={(query) => updateQuery({ query })} />
      </section>
    </div>
  );
};
