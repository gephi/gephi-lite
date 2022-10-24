import React, { FC, useEffect, useState } from 'react';
import { createOAuthAppAuth } from '@octokit/auth-oauth-app';

type IdleGistStatus = { type: 'idle' };
type DisconnectedGistStatus = { type: 'disconnected' };
type LoggedGistStatus = { type: 'connected'; token: string };
type ErrorGistStatus = { type: 'error'; error: Error | string };
type LoadingGistStatus = { type: 'loading' };
type GistStatus =
  | IdleGistStatus
  | DisconnectedGistStatus
  | LoggedGistStatus
  | ErrorGistStatus
  | LoadingGistStatus;

const GITHUB_APP_ID = 'Iv1.28614c853d9bb64a';

async function requestGitHubToken(): Promise<string> {
  const auth = createOAuthAppAuth({
    clientType: 'oauth-app',
    clientId: GITHUB_APP_ID,
    clientSecret: '123',
  });

  const appAuthentication = await auth({
    type: 'oauth-user',
    code: '29e7f3b6914bda441bf6',
    state: 'toto',
  });

  return appAuthentication.token;
}

const App: FC = () => {
  const [gistStatus, setGistStatus] = useState<GistStatus>({ type: 'idle' });

  const query = new URLSearchParams(window.location.search);
  const code = query.get('code');

  useEffect(() => {
    if (code) console.log('CODE', code);
  }, [code]);

  useEffect(() => {
    if (gistStatus.type === 'idle') {
      setGistStatus({ type: 'loading' });
      requestGitHubToken()
        .then((token) => {
          console.log('TOKEN', token);
        })
        .catch((e) => {
          console.log('ERROR', e);
        });
    }
  }, [gistStatus]);

  return (
    <div className="container">
      <div className="row">
        <p>
          Gist status: <strong>{gistStatus.type}</strong>
        </p>
      </div>
    </div>
  );
};

export default App;
