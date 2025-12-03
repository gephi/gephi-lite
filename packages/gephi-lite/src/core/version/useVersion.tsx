import { head } from "lodash";
import { useEffect, useState } from "react";
import { compareBuild } from "semver";

import { config } from "../../config";

type Version = { version: string; url: string };
type StateVersion = ({ type: "version" } & Version) | { type: "loading" } | { type: "idle" };

export function useVersion() {
  const [latest, setLatest] = useState<StateVersion>({ type: "idle" });

  useEffect(() => {
    const fn = async () => {
      if (config.version.checkForNewVersion && config.version.versionsUrl) {
        setLatest({ type: "loading" });
        const resp = await fetch(config.version.versionsUrl);
        const versions: Array<Version> = await resp.json();
        versions.sort((a, b) => -1 * compareBuild(a.version, b.version));
        const last = head(versions);
        if (last) {
          setLatest({ type: "version", ...last });
        }
      }
    };

    fn().catch((e) => {
      console.error(e);
      setLatest({ type: "idle" });
    });
  }, []);

  return {
    current: config.version.current,
    latest,
  };
}
