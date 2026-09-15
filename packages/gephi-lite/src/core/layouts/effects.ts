import { debounce } from "lodash";

import { EVENTS, emitter } from "../context/eventsContext";
import { sigmaGraphAtom } from "../graph/atom";
import { layoutActions } from "./actions";
import { gridEnabledAtom, layoutStateAtom } from "./atom";

layoutStateAtom.bindEffect((state) => {
  if (state.type !== "running") return;

  const fnRestart = debounce(layoutActions.restartLastLayout, 100, { leading: true, trailing: true, maxWait: 100 });
  emitter.on(EVENTS.nodesDragged, fnRestart);
  emitter.on(EVENTS.graphImported, fnRestart);
  return () => {
    emitter.off(EVENTS.nodesDragged, fnRestart);
    emitter.off(EVENTS.graphImported, fnRestart);
  };
});

gridEnabledAtom.bindEffect((connectedClosenessSettings) => {
  if (!connectedClosenessSettings.enabled) return;

  //Compute the layout quality metric when node's position changed
  const { computeLayoutQualityMetric } = layoutActions;
  const fn = debounce(computeLayoutQualityMetric, 300, { leading: true, maxWait: 300 });

  computeLayoutQualityMetric();
  const sigmaGraph = sigmaGraphAtom.get();
  // this event is triggered when a sync layout has been applied
  // this is a custom event
  emitter.on(EVENTS.graphImported, fn);

  // this event is triggered by user manually changing node positions by dragging node
  // this is a custom event
  emitter.on(EVENTS.nodesDragged, fn);

  // this event is triggered by async layout
  sigmaGraph.on("eachNodeAttributesUpdated", fn);

  return () => {
    emitter.off(EVENTS.graphImported, fn);
    emitter.off(EVENTS.nodesDragged, fn);
    sigmaGraph.off("eachNodeAttributesUpdated", fn);
  };
});
