import { FC } from "react";
import { GraphAppearance } from "../../components/GraphAppearance";

export const AppearancePanel: FC = () => {
  return (
    <div>
      <h2>Appearance</h2>
      <GraphAppearance />
      <p>CAPTION?</p>
    </div>
  );
};
