import cx from "classnames";
import React, { FC, PropsWithChildren, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useModal } from "../core/modals";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { CloseIcon } from "./common-icons";

interface Props {
  title?: ReactNode;
  onClose?: () => void;
  onSubmit?: () => void; // if set echap and click outside the modal does not close it
  doNotPreserveData?: boolean; // if set, even if a onSubmit is set it's possible to close the modal by escape/click outside to cancel
  showHeader?: boolean;
  footerAlignLeft?: boolean;
  className?: string;
  bodyClassName?: string;
  contentClassName?: string;
  children: JSX.Element | [JSX.Element] | [JSX.Element, JSX.Element];
}

export const Modal: FC<PropsWithChildren<Props>> = ({
  onClose,
  onSubmit,
  doNotPreserveData,
  title,
  children,
  showHeader = true,
  footerAlignLeft = false,
  className,
  bodyClassName,
  contentClassName,
}) => {
  const { t } = useTranslation();
  const childrenArray = Array.isArray(children) ? children : [children];
  const body = childrenArray[0];
  const footer = childrenArray[1];
  useKeyboardShortcuts([
    {
      code: "Escape",
      handler: () => {
        // don't close the modal on click outside if there is a form in it to avoid data loss
        if (onClose && (doNotPreserveData || !onSubmit)) onClose();
      },
    },
  ]);

  const content = (
    <>
      {showHeader && (
        <div className="modal-header">
          {title && <h5 className="gl-heading-2 d-flex align-items-center flex-grow-1 gl-my-0">{title}</h5>}
          <button
            type="button"
            title={t("common.close").toString()}
            className="gl-btn gl-btn-icon"
            aria-label="Close"
            onClick={() => onClose && onClose()}
            disabled={!onClose}
          >
            <CloseIcon />
          </button>
        </div>
      )}
      {body && (
        <div id="modal-body" className={cx("modal-body", bodyClassName)}>
          {!showHeader && (
            <div className="text-end">
              <button
                type="button"
                title={t("common.close").toString()}
                className="gl-btn gl-btn-icon d-inline-flex"
                aria-label="Close"
                onClick={() => onClose && onClose()}
                disabled={!onClose}
              >
                <CloseIcon />
              </button>
            </div>
          )}
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
    </>
  );

  return (
    <>
      <div
        role="dialog"
        className="modal fade show"
        style={{ display: "block" }}
        onClick={(e) => {
          // don't close the modal on click outside if there is a form in it to avoid data loss
          // we could do better bu tracking changes but there are already a cancel AND a x icon to close the modal
          if (onClose && (doNotPreserveData || !onSubmit) && e.target === e.currentTarget) onClose();
        }}
      >
        <div
          role="document"
          className={cx("modal-dialog", "modal-dialog-centered", "modal-dialog-scrollable", className)}
        >
          {onSubmit ? (
            <form
              className={cx("modal-content", contentClassName)}
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}
            >
              {content}
            </form>
          ) : (
            <div className={cx("modal-content", contentClassName)}>{content}</div>
          )}
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
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
