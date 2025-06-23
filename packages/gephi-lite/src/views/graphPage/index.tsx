import cx from "classnames";
import { type ComponentType, FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";

import { GraphGraphAppearance, GraphItemAppearance } from "../../components/GraphAppearance";
import GraphFilters from "../../components/GraphFilters";
import { GraphSearchSelection } from "../../components/GraphSearchSelection";
import { GraphSummary } from "../../components/GraphSummary";
import { type MenuItem, NavMenu } from "../../components/NavMenu";
import { AppearanceIcon, FiltersIcon, LayoutsIcon, StatisticsIcon } from "../../components/common-icons";
import { useSelection } from "../../core/context/dataContexts";
import { LAYOUTS } from "../../core/layouts/collection";
import { Layout } from "../layout";
import { GraphRendering } from "./GraphRendering";
import { Selection } from "./Selection";
import { StatisticsPanel } from "./panels/StatisticsPanel";
import { LayoutsPanel } from "./panels/layouts/LayoutPanel";

type ToolCommon = { id: string; i18nKey: string };
type ToolCommonWithIcon = ToolCommon & { icon: IconType };
type Tool = ToolCommon & { panel: ComponentType };
type ToolSection = ToolCommonWithIcon & ({ children: Tool[] } | { panel: ComponentType });

const TOOL_MENU: ToolSection[] = [
  {
    id: "layout",
    i18nKey: "layouts.title",
    icon: LayoutsIcon,
    children: LAYOUTS.map((layout) => ({
      id: `layout-${layout.id}`,
      i18nKey: `layouts.${layout.id}.title`,
      panel: () => <LayoutsPanel layout={layout} />,
    })),
  },
  {
    id: "appearance",
    i18nKey: "appearance.title",
    icon: AppearanceIcon,
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
    icon: FiltersIcon,
    panel: () => <GraphFilters />,
  },
  {
    id: "statistics",
    i18nKey: "statistics.title",
    icon: StatisticsIcon,
    panel: StatisticsPanel,
  },
];

export const GraphPage: FC = () => {
  const { t } = useTranslation();
  const [selectedTool, setSelectedTool] = useState<undefined | { id: string; panel: ComponentType }>(undefined);
  const { items } = useSelection();

  const toolsMenu = useMemo(
    () =>
      TOOL_MENU.map((item) => {
        if ("children" in item) {
          return {
            id: item.id,
            label: t(item.i18nKey),
            icon: item.icon,
            children: item.children.map((subItem) => ({
              id: subItem.id,
              label: t(subItem.i18nKey),
              onClick: () => setSelectedTool({ id: subItem.id, panel: subItem.panel }),
            })),
          };
        } else {
          return {
            id: item.id,
            label: t(item.i18nKey),
            icon: item.icon,
            onClick: () => setSelectedTool({ id: item.id, panel: item.panel }),
          };
        }
      }) as MenuItem[],
    [t],
  );

  return (
    <Layout>
      {/* Menu panel on left*/}
      <div className="left-panel">
        <GraphSummary className="px-3 mb-3" />
        <GraphSearchSelection className="mb-3 mx-1" />
        <NavMenu className="mx-2" menu={toolsMenu} selected={selectedTool?.id} />
      </div>

      {/* Extended left panel */}
      <div className={cx("left-panel-wrapper", selectedTool && "deployed")}>
        {selectedTool && (
          <>
            <button
              type="button"
              className="btn-close float-end"
              aria-label="Close"
              onClick={() => setSelectedTool(undefined)}
            ></button>
            <selectedTool.panel />
          </>
        )}
      </div>

      {/* Graph viz */}
      <div className="filler">
        <GraphRendering />
      </div>

      {/* Right panel */}
      <div className={cx("right-panel-wrapper p-3", items.size > 0 && "deployed")}>
        {items.size > 0 && <Selection />}
      </div>
    </Layout>
  );
};
