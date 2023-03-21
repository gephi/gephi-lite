import { FC, ReactNode } from "react";

export const NodeComponent: FC<{ label: ReactNode; color: string }> = ({ label, color }) => {
  return (
    <>
      <span className="circle" style={{ backgroundColor: color }} /> {label}
    </>
  );
};
