import React, { FC, PropsWithChildren, useCallback } from "react";
import cx from "classnames";
import { BsQuestionCircleFill } from "react-icons/bs";

import { useAppContext } from "../../hooks/useAppContext";
import { Spinner } from "../../components/Loader";

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
  const childrenArray = Array.isArray(children) ? children : [children];
  const body = childrenArray[0];
  const footer = childrenArray[1];

  return (
    <>
      <div
        role="dialog"
        className="modal fade show"
        style={{ display: "block" }}
      >
        <div
          role="document"
          className={cx(
            "modal-dialog",
            "modal-dialog-centered",
            "modal-dialog-scrollable",
            className
          )}
        >
          <div className="modal-content">
            {showHeader && (
              <div className="modal-header">
                {title && (
                  <h5 className="modal-title d-flex align-items-center">
                    {title}
                  </h5>
                )}
                <button
                  type="button"
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
          type="button"
          className="btn btn-outline-secondary me-2"
          onClick={onCancel}
          disabled={loading === true}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          onClick={onConfirm}
          disabled={loading === true}
        >
          Confirm
          {loading && <Spinner className="ms-2 spinner-border-sm" />}
        </button>
      </>
    </Modal>
  );
};

export const Modals: FC = () => {
  const [{ modal }, setContext] = useAppContext();

  const closeModal = useCallback(() => {
    setContext((prev) => ({ ...prev, modal: undefined }));
  }, [setContext]);

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
