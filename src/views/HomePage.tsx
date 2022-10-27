import { FC } from "react";
import { Link } from "react-router-dom";

import { Layout } from "./layout";

export const HomePage: FC = () => {
  return (
    <Layout>
      <div className="container">
        <div className="row">
          <h1>Hello World</h1>
          <Link to="graph">graph page</Link>
        </div>
      </div>
    </Layout>
  );
};
