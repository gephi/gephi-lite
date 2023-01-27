import React, { FC, PropsWithChildren } from "react";
import { BsQuestionCircleFill } from "react-icons/bs";
import cx from "classnames";
import { useTranslation } from "react-i18next";

import { Spinner } from "./Loader";
import { useModal } from "../core/modals";

interface Props {
  title?: string | JSX.Element;
  onClose?: () => void;
  showHeader?: boolean;
  footerAlignLeft?: boolean;
  className?: string;
  bodyClassName?: string;
  children: JSX.Element | [JSX.Element] | [JSX.Element, JSX.Element];
}

export const Modal: FC<PropsWithChildren<Props>> = ({
  onClose,
  title,
  children,
  showHeader = true,
  footerAlignLeft = false,
  className,
  bodyClassName,
}) => {
  const { t } = useTranslation();
  const childrenArray = Array.isArray(children) ? children : [children];
  const body = childrenArray[0];
  const footer = childrenArray[1];

  return (
    <>
      <div
        role="dialog"
        className="modal fade show"
        style={{ display: "block" }}
        onClick={(e) => {
          if (onClose && e.target === e.currentTarget) onClose();
        }}
      >
        <div
          role="document"
          className={cx("modal-dialog", "modal-dialog-centered", "modal-dialog-scrollable", className)}
        >
          <div className="modal-content">
            {showHeader && (
              <div className="modal-header">
                {title && <h5 className="modal-title d-flex align-items-center">{title}</h5>}
                <button
                  title={t("common.close").toString()}
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => onClose && onClose()}
                  disabled={!onClose}
                ></button>
              </div>
            )}
            {body && (
              <div id="modal-body" className={cx("modal-body", bodyClassName)}>
                {body}
              </div>
            )}
            {footer && (
              <div
                className="modal-footer"
                style={{
                  justifyContent: footerAlignLeft ? "left" : "flex-end",
                }}
              >
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export const ConfirmModal: FC<
  PropsWithChildren<{
    title?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
  }>
> = ({ title, onConfirm, onCancel, loading, children }) => {
  const { t } = useTranslation();
  return (
    <Modal
      title={
        <>
          <BsQuestionCircleFill className="text-info me-2" /> {title}
        </>
      }
      onClose={loading === true ? undefined : onCancel}
    >
      <>{children}</>
      <>
        <button
          title={t("common.cancel").toString()}
          className="btn btn-outline-secondary me-2"
          onClick={onCancel}
          disabled={loading === true}
        >
          {t("common.cancel")}
        </button>
        <button
          title={t("common.confirm").toString()}
          className="btn btn-primary"
          onClick={onConfirm}
          disabled={loading === true}
        >
          {t("common.confirm")}
          {loading && <Spinner className="ms-2 spinner-border-sm" />}
        </button>
      </>
    </Modal>
  );
};

export const Modals: FC = () => {
  const { modal, closeModal } = useModal();

  return modal
    ? React.createElement(modal.component, {
        arguments: modal.arguments,
        cancel: () => {
          if (modal.beforeCancel) modal.beforeCancel();
          closeModal();
          if (modal.afterCancel) modal.afterCancel();
        },
        submit: (args) => {
          if (modal.beforeSubmit) modal.beforeSubmit(args);
          closeModal();
          if (modal.afterSubmit) modal.afterSubmit(args);
        },
      })
    : null;
};
