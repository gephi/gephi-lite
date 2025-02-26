declare module "*.svg?react" {
  import type { FunctionComponent, SVGProps } from "react";
  export const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
