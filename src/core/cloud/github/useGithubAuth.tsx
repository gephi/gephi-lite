import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import { Octokit } from "@octokit/core";
import { request } from "@octokit/request";
import { useCallback, useMemo, useState } from "react";

import { config } from "../../../config";
import { useConnectedUser } from "../../user";
import { GithubProvider } from "./provider";

export function useGithubAuth() {
  // used when we ask github for the code & url
  const [loading, setLoading] = useState<boolean>(false);
  // used when the poll GH to see if the user did the validation
  const [waiting, setWaiting] = useState<boolean>(false);
  // url given by gh where the user need to validate the claim
  const [url, setUrl] = useState<string | null>(null);
  // code that the user has to fill on the validation form
  const [code, setCode] = useState<string | null>(null);
  // if there is an error during the process
  const [error, setError] = useState<string | null>(null);
  // the connected user
  const [user, setUser] = useConnectedUser();

  // Create the auth device object and rtrieve the code+url
  const auth = useMemo(() => {
    return createOAuthDeviceAuth({
      clientType: "oauth-app",
      clientId: config.github.client_id,
      scopes: config.github.scopes,
      onVerification: async (verification) => {
        setUrl(verification.verification_uri);
        setCode(verification.user_code);
        setLoading(false);
        return false;
      },
      request: request.defaults({
        baseUrl: config.github_proxy,
      }),
    });
  }, []);

  /**
   * Function that start the login process.
   */
  const login = useCallback(async () => {
    setLoading(true);
    setWaiting(false);
    setUser(null);
    setUrl(null);
    setCode(null);
    setError(null);

    // waiting the user's validation
    setWaiting(true);

    try {
      const { token } = await auth({
        type: "oauth",
        refresh: false,
      });

      const octokit = new Octokit({
        auth: token,
      });
      const response = await octokit.request("GET /user", {});
      setUser({
        id: response.data.login,
        name: response.data.name || response.data.login,
        avatar: response.data.avatar_url,
        provider: new GithubProvider(token),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWaiting(false);
      setLoading(false);
    }
  }, [auth, setUser]);

  return { login, url, code, loading, error, user, waiting };
}
