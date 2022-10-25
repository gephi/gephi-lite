import { ComponentType, FC, useState } from 'react';
import { BiNetworkChart } from 'react-icons/bi';
import { ImDatabase, ImStatsDots } from 'react-icons/im';
import { FaFilter, FaPaintBrush } from 'react-icons/fa';
import cx from 'classnames';

import { Layout } from './layout';

type Tool = { type: 'tool'; label: string; icon: ComponentType; panel: ComponentType };
const TODO = () => <div>TODO</div>;

const TOOLS: (Tool | { type: 'space' })[] = [
  { type: 'tool', label: 'Graph', icon: ImDatabase, panel: TODO },
  { type: 'space' },
  { type: 'tool', label: 'Statistic', icon: ImStatsDots, panel: TODO },
  { type: 'space' },
  { type: 'tool', label: 'Appearance', icon: FaPaintBrush, panel: TODO },
  { type: 'tool', label: 'Filters', icon: FaFilter, panel: TODO },
  { type: 'tool', label: 'Layout', icon: BiNetworkChart, panel: TODO },
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
          <div className="left-panel border-end">
            <tool.panel />
          </div>
        )}
        <div className="filler"></div>
        <div className="right-panel border-start"></div>
      </div>
    </Layout>
  );
};
