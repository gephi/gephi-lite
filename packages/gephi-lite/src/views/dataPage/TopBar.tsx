import { ItemType } from "@gephi/gephi-lite-sdk";
import { FC, useEffect, useState } from "react";
import { PiMagnifyingGlass } from "react-icons/pi";

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
      <button className="btn btn-light" type="button">
        <PiMagnifyingGlass />
      </button>
    </form>
  );
};

export const TopBar: FC<{ type: ItemType; search: string; onSearchChange: (search: string) => void }> = ({
  type,
  search,
  onSearchChange,
}) => {
  return (
    <div className="menu-bar flex-shrink-0 d-flex flex-row align-items-baseline p-2">
      <section className="flex-grow-1">TODO</section>
      <section>
        <SearchForm type={type} input={search} onChange={onSearchChange} />
      </section>
    </div>
  );
};
