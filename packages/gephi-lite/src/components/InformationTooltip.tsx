import { FC, PropsWithChildren } from "react";
import { IoInformationCircleOutline } from "react-icons/io5";

import Tooltip from "./Tooltip";

export const InformationTooltip: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Tooltip
      closeOnClickContent
      attachment="top middle"
      targetAttachment="bottom middle"
      targetClassName="d-block d-md-none align-self-start"
    >
      <IoInformationCircleOutline className="align-top cursor-pointer" />
      <div className=" dropdown-menu show over-modal position-relative p-2" style={{ width: "75vw" }}>
        {children}
      </div>
    </Tooltip>
  );
};
