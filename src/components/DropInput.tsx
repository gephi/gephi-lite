import cx from "classnames";
import React, { FC } from "react";
import { useDropzone, Accept } from "react-dropzone";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface DropInputProperties {
  value: File | null;
  onChange: (file: File | null) => void;
  helpText: string;
  accept: Accept;
}

export const DropInput: FC<DropInputProperties> = ({ value, onChange, accept, helpText }) => {
  const { t } = useTranslation();
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

      <p>{value ? value.name : helpText}</p>

      {value && (
        <button
          type="button"
          className={cx("btn btn-outline-dark", !value && "hidden")}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onChange(null);
          }}
        >
          <FaTimes /> {t("common.clear").toString()}
        </button>
      )}
    </div>
  );
};
