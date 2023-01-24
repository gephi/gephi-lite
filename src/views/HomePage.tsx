import { FC } from "react";

import { Layout } from "./layout";

export const HomePage: FC = () => {
  return (
    <Layout>
      <div className="container">
        <div className="row">
          <div className="col-12">
            <h1>Hello World</h1>
          </div>
        </div>
      </div>
    </Layout>
  );
};
