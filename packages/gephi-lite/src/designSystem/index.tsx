import { keys } from "lodash";
import { FC, createElement } from "react";
import { Link, useParams } from "react-router";

// ADD PAGES
import Buttons from "./Buttons.mdx";
import SearchBar from "./SearchBar.mdx";

const PARAM_2_PAGE: Record<string, (props: unknown) => JSX.Element> = {
  buttons: Buttons,
  "search-bar": SearchBar,
};
// END PAGES SECTION

const DesignSystemPage: FC = () => {
  const { page } = useParams();

  return (
    <div className="container gl-ds-container design-system-page d-flex flex-column gap-4">
      <h1>Gephi Lite Design System</h1>

      <ul className="d-flex flex-column">
        {keys(PARAM_2_PAGE).map((p) => (
          <Link key={p} to={`/design-system/${p}`}>
            {p}
          </Link>
        ))}
      </ul>

      {page && page in PARAM_2_PAGE && createElement(PARAM_2_PAGE[page])}
    </div>
  );
};

export default DesignSystemPage;
