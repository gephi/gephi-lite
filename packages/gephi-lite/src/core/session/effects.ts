import { sessionAtom } from "./atom";
import { serializeSession } from "./utils";

sessionAtom.bind((session) => {
  sessionStorage.setItem("session", serializeSession(session));
});
