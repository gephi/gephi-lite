import cx from "classnames";
import { FC, PropsWithChildren, ReactElement } from "react";
import { Accept, useDropzone } from "react-dropzone";

import { CloseIcon } from "./common-icons";

export const DropInput: FC<
  PropsWithChildren<{
    value: File | null;
    onChange: (file: File | null) => void;
    helpElement: ReactElement;
    accept: Accept;
  }>
> = ({ value, onChange, accept, helpElement, children }) => {
  const { getRootProps, getInputProps } = useDropzone({
    maxFiles: 1,
    accept: accept,
    onDrop: (acceptedFiles) => {
      const value = acceptedFiles[0] || null;
      onChange(value);
    },
  });

  return (
    <div {...getRootProps()} className="dropzone flex-column d-flex justify-content-center align-items-center">
      <input {...getInputProps()} />

      {children}
      <p className="small d-flex align-items-center">
        {value ? (
          <>
            <button
              type="button"
              className={cx("gl-btn gl-btn-outline d-inline-flex ms-2", !value && "hidden")}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChange(null);
              }}
            >
              <span className="text-truncate">{value.name}</span>
              <CloseIcon />
            </button>
          </>
        ) : (
          helpElement
        )}
      </p>
    </div>
  );
};
