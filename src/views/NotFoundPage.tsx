import { FC } from "react";

import { Layout } from "./layout";

export const NotFoundPage: FC = () => {
  return (
    <Layout>
      <h1>Not Found</h1>
      <h2>The page you were looking for doesn't exist </h2>
      <p>You may have mistyped the address or the page may have moved.</p>
    </Layout>
  );
};
