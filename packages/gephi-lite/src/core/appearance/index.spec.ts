import { getEmptyAppearanceState } from "@gephi/gephi-lite-sdk";
import { describe, expect, it } from "vitest";

import { appearanceActions, appearanceAtom } from "./index";
import { AppearanceState } from "./types";

describe("setFullState", () => {
  it("should fill missing keys with defaults", () => {
    const { backgroundLayer: _, ...legacy } = getEmptyAppearanceState();
    appearanceActions.setFullState({ ...legacy, backgroundColor: "#123456" } as AppearanceState);
    expect(appearanceAtom.get()).toEqual({ ...getEmptyAppearanceState(), backgroundColor: "#123456" });
  });
});
