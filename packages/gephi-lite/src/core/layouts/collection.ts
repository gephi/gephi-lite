import { CirclePackLayout } from "./collection/circlePack";
import { CircularLayout } from "./collection/circular";
import { ForceLayout } from "./collection/force";
import { ForceAtlas2Layout } from "./collection/forceAtlas2";
import { GeographicLayout } from "./collection/geographic";
import { NoverlapLayout } from "./collection/noverlap";
import { RandomLayout } from "./collection/random";
import { ScriptLayout } from "./collection/script";
import { Layout } from "./types";

/**
 * List of available layouts
 */
export const LAYOUTS: Array<Layout> = [
  RandomLayout,
  CircularLayout,
  CirclePackLayout,
  GeographicLayout,
  ForceAtlas2Layout,
  ForceLayout,
  NoverlapLayout,
  ScriptLayout,
];
