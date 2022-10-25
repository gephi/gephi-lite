import { useContext } from "react";

import { AppContextType, AppContextSetter, AppContext } from "../core/context";

export function useAppContext(): [AppContextType, AppContextSetter] {
  const appContext = useContext(AppContext);
  if (!appContext) {
    throw new Error("There is no context");
  }
  return [appContext.context, appContext.setContext];
}
