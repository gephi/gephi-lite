import cx from "classnames";
import { type ComponentType, FC, useState } from "react";

import { GraphGraphAppearance, GraphItemAppearance } from "../../components/GraphAppearance";
import GraphFilters from "../../components/GraphFilters";
import { GraphSearchSelection } from "../../components/GraphSearchSelection";
import { GraphSummary } from "../../components/GraphSummary";
import { type MenuItem, SideMenu } from "../../components/SideMenu";
import {
  AppearanceIcon,
  AppearanceIconFill,
  FiltersIcon,
  FiltersIconFill,
  LayoutsIcon,
  LayoutsIconFill,
  StatisticsIcon,
  StatisticsIconFill,
} from "../../components/common-icons";
import { useSelection } from "../../core/context/dataContexts";
import { LAYOUTS } from "../../core/layouts/collection";
import { Layout } from "../layout";
import { GraphRendering } from "./GraphRendering";
import { Selection } from "./Selection";
import { StatisticsPanel } from "./panels/StatisticsPanel";
import { LayoutsPanel } from "./panels/layouts/LayoutPanel";

const MENU: MenuItem<{ panel?: ComponentType }>[] = [
  {
    id: "layout",
    i18nKey: "layouts.title",
    icon: { normal: LayoutsIcon, fill: LayoutsIconFill },
    children: LAYOUTS.map((layout) => ({
      id: `layout-${layout.id}`,
      i18nKey: `layouts.${layout.id}.title`,
      panel: () => <LayoutsPanel layout={layout} />,
    })),
  },
  {
    id: "appearance",
    i18nKey: "appearance.title",
    icon: { normal: AppearanceIcon, fill: AppearanceIconFill },
    children: [
      {
        id: "appearance-nodes",
        i18nKey: "appearance.menu.nodes",
        panel: () => <GraphItemAppearance itemType="nodes" />,
      },
      {
        id: "appearance-edges",
        i18nKey: "appearance.menu.edges",
        panel: () => <GraphItemAppearance itemType="edges" />,
      },
      {
        id: "appearance-labels",
        i18nKey: "appearance.menu.labels",
        panel: () => <div>TODO</div>,
      },
      {
        id: "appearance-background",
        i18nKey: "appearance.menu.background",
        panel: () => <GraphGraphAppearance />,
      },
    ],
  },
  {
    id: "filters",
    i18nKey: "filters.title",
    icon: { normal: FiltersIcon, fill: FiltersIconFill },
    panel: () => <GraphFilters />,
  },
  {
    id: "statistics",
    i18nKey: "statistics.title",
    icon: { normal: StatisticsIcon, fill: StatisticsIconFill },
    panel: StatisticsPanel,
  },
];

export const GraphPage: FC = () => {
  const [selectedTool, setSelectedTool] = useState<undefined | { id: string; panel: ComponentType }>(undefined);
  const { items } = useSelection();

  return (
    <Layout id="graph-page" className="panels-layout">
      {/* Menu panel on left*/}
      <div className="left-panel">
        <div className="panel-content gl-gap-lg d-flex flex-column">
          <GraphSummary />
          <GraphSearchSelection />
          <SideMenu
            menu={MENU}
            selected={selectedTool?.id}
            onSelectedChange={(item) =>
              setSelectedTool(
                item.panel
                  ? {
                      id: item.id,
                      panel: item.panel,
                    }
                  : undefined,
              )
            }
          />
        </div>
      </div>

      {/* Extended left panel */}
      <div className={cx("left-panel-wrapper", selectedTool && "deployed")}>
        {selectedTool && (
          <div className="panel-content">
            <button
              type="button"
              className="btn-close float-end"
              aria-label="Close"
              onClick={() => setSelectedTool(undefined)}
            ></button>
            <selectedTool.panel />
          </div>
        )}
      </div>

      {/* Graph viz */}
      <div className="filler">
        <GraphRendering />
      </div>

      {/* Right panel */}
      <div
        className={cx("gl-panel right-panel-wrapper gl-container-highest-bg gl-border ", items.size > 0 && "deployed")}
      >
        {items.size > 0 && <Selection className="gl-p-md" />}
      </div>
    </Layout>
  );
};
