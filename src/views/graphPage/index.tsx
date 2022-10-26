import { ComponentType, FC, useState } from 'react';
import { BiNetworkChart } from 'react-icons/bi';
import { ImDatabase, ImStatsDots } from 'react-icons/im';
import { FaFilter, FaPaintBrush } from 'react-icons/fa';
import cx from 'classnames';

import { Layout } from '../layout';
import { GraphDataPanel } from './GraphDataPanel';
import { StatisticsPanel } from './StatisticsPanel';
import { AppearancePanel } from './AppearancePanel';
import { FiltersPanel } from './FiltersPanel';
import { LayoutPanel } from './LayoutPanel';
import { BsX } from 'react-icons/bs';

type Tool = { type: 'tool'; label: string; icon: ComponentType; panel: ComponentType };

const TOOLS: (Tool | { type: 'space' })[] = [
  { type: 'tool', label: 'Graph', icon: ImDatabase, panel: GraphDataPanel },
  { type: 'space' },
  { type: 'tool', label: 'Statistic', icon: ImStatsDots, panel: StatisticsPanel },
  { type: 'space' },
  { type: 'tool', label: 'Appearance', icon: FaPaintBrush, panel: AppearancePanel },
  { type: 'tool', label: 'Filters', icon: FaFilter, panel: FiltersPanel },
  { type: 'tool', label: 'Layout', icon: BiNetworkChart, panel: LayoutPanel },
];

export const GraphPage: FC = () => {
  const [tool, setTool] = useState<Tool | null>(null);

  return (
    <Layout>
      <div id="graph-page">
        <div className="stage"></div>
        <div className="toolbar d-flex flex-column border-end">
          {TOOLS.map((t, i) =>
            t.type === 'space' ? (
              <br key={i} className="my-3" />
            ) : (
              <button
                key={i}
                type="button"
                className={cx(
                  'btn btn-ico text-center text-muted text-capitalize m-1',
                  t === tool && 'active'
                )}
                onClick={() => (t === tool ? setTool(null) : setTool(t))}
              >
                <t.icon />
                <br />
                <small>{t.label}</small>
              </button>
            )
          )}
        </div>
        {tool && (
          <div className="left-panel border-end position-relative">
            <button
              className="btn btn-icon position-absolute top-0 end-0"
              aria-label="close panel"
              onClick={() => setTool(null)}
            >
              <BsX />
            </button>
            <tool.panel />
          </div>
        )}
        <div className="filler"></div>
        <div className="right-panel border-start"></div>
      </div>
    </Layout>
  );
};
