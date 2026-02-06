export interface Session {
  // for each layout, we save the parameters
  lastLayoutUsed?: string;
  layoutsParameters: { [layout: string]: Record<string, unknown> };
  // for each metrics, we save the parameters
  metrics: {
    [metric: string]: {
      parameters: Record<string, unknown>;
      attributeNames: Record<string, string>;
    };
  };
}
