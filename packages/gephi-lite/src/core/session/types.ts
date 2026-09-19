export interface Session {
  // id of the last layout that was started, so it can be restarted without reopening the layouts panel
  lastLayoutId?: string;
  // for each layout, we save the parameters
  layoutsParameters: { [layout: string]: Record<string, unknown> };
  // for each metrics, we save the parameters
  metrics: {
    [metric: string]: {
      parameters: Record<string, unknown>;
      attributeNames: Record<string, string>;
    };
  };
}
