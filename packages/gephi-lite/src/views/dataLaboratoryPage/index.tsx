import type { FC } from "react";

import { Layout } from "../layout";

export const DataLaboratoryPage: FC = () => {
  return (
    <Layout>
      <div id="data-laboratory" className="container-fluid">
        <div className="row">
          <div className="col-12">
            <h1>Data Laboratory Page</h1>
            <p>This is the data laboratory page where you can manage your data.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
