import cx from "classnames";
import React, {
  FC,
  PropsWithChildren,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { useModal } from "../core/modals";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { CloseIcon } from "./common-icons";

/**
 * The open modal's "please close" entry point, so that every way of closing it - the header cross,
 * the form footer's cancel button, Escape, a click outside, the Android back button - goes through
 * the very same code, and in particular through the unsaved-input confirmation below. Null outside
 * of a modal: the node/edge forms are also rendered in a side panel, where there is nothing to
 * close.
 */
const ModalCloseContext = createContext<(() => void) | null>(null);

/**
 * Button closing the modal it is rendered in, falling back to `onCancel` when there is no modal
 * around (see ModalCloseContext).
 */
export const CloseModalButton: FC<PropsWithChildren<{ onCancel: () => void; className?: string; title?: string }>> = ({
  onCancel,
  className,
  title,
  children,
}) => {
  const requestClose = useContext(ModalCloseContext);
  return (
    <button type="button" className={className} title={title} onClick={() => (requestClose || onCancel)()}>
      {children}
    </button>
  );
};

interface Props {
  title?: ReactNode;
  onClose?: () => void;
  onSubmit?: () => void; // if set echap and click outside the modal does not close it
  doNotPreserveData?: boolean; // if set, even if a onSubmit is set it's possible to close the modal by escape/click outside to cancel
  showHeader?: boolean;
  footerAlignLeft?: boolean;
  // When set (together with onSubmit), a submit button with this label is shown in the header,
  // left of the close button: on mobile, the on-screen keyboard can cover the footer's own submit
  // button while a field is focused, so this copy always stays reachable.
  submitLabel?: ReactNode;
  // Set while the modal holds user input that closing would discard. Every close that is not an
  // explicit click on the close/cancel buttons - the Android back button, Escape, a click outside -
  // then goes through a confirmation whose default answer is to keep editing, so a stray press
  // cannot wipe a form that was being filled in.
  hasUnsavedInput?: boolean;
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
  submitLabel,
  hasUnsavedInput,
  className,
  bodyClassName,
  contentClassName,
}) => {
  const { t } = useTranslation();
  const { closeRequestId, setUnsavedInput } = useModal();
  const childrenArray = Array.isArray(children) ? children : [children];
  const body = childrenArray[0];
  const footer = childrenArray[1];

  // Let a close request coming from outside (the Android back button, see Initialize) know that
  // this modal has something to lose. Cleared on unmount, so the next modal starts fresh.
  useEffect(() => {
    setUnsavedInput(!!hasUnsavedInput);
  }, [hasUnsavedInput, setUnsavedInput]);
  useEffect(() => () => setUnsavedInput(false), [setUnsavedInput]);

  const [confirmingClose, setConfirmingClose] = useState(false);
  const requestClose = useCallback(() => {
    if (!onClose) return;
    if (hasUnsavedInput) setConfirmingClose(true);
    else onClose();
  }, [onClose, hasUnsavedInput]);

  // The back button asks through the modal state rather than closing directly, so the confirmation
  // above can happen. The first render is not a request, hence the remembered token.
  const lastCloseRequestId = useRef(closeRequestId);
  useEffect(() => {
    if (closeRequestId === lastCloseRequestId.current) return;
    lastCloseRequestId.current = closeRequestId;
    requestClose();
  }, [closeRequestId, requestClose]);

  useKeyboardShortcuts([
    {
      code: "Escape",
      handler: () => {
        // While confirming, Escape means "no, keep editing":
        if (confirmingClose) {
          setConfirmingClose(false);
          return;
        }
        // don't close the modal on click outside if there is a form in it to avoid data loss
        if (onClose && (doNotPreserveData || !onSubmit)) requestClose();
      },
    },
  ]);

  const content = (
    <ModalCloseContext.Provider value={onClose ? requestClose : null}>
      {showHeader && (
        <div className="modal-header">
          {title && <h5 className="gl-heading-2 d-flex align-items-center flex-grow-1 gl-my-0">{title}</h5>}
          <div className="d-flex align-items-center gl-gap-2">
            {submitLabel && onSubmit && (
              <button type="submit" className="gl-btn gl-btn-fill">
                {submitLabel}
              </button>
            )}
            <button
              type="button"
              title={t("common.close").toString()}
              className="gl-btn gl-btn-icon"
              aria-label="Close"
              onClick={requestClose}
              disabled={!onClose}
            >
              <CloseIcon />
            </button>
          </div>
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
                onClick={requestClose}
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
    </ModalCloseContext.Provider>
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
          if (onClose && (doNotPreserveData || !onSubmit) && e.target === e.currentTarget) requestClose();
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

      {confirmingClose && (
        <>
          <div role="dialog" className="modal fade show stacked-modal" style={{ display: "block" }}>
            <div role="document" className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="gl-heading-2 gl-my-0">{t("common.discard_input.title")}</h5>
                </div>
                <div className="modal-body">{t("common.discard_input.message")}</div>
                <div className="modal-footer">
                  <div className="gl-actions">
                    {/* Keeping the input is the default: first, filled, and focused. */}
                    <button
                      type="button"
                      autoFocus
                      className="gl-btn gl-btn-fill"
                      onClick={() => setConfirmingClose(false)}
                    >
                      {t("common.discard_input.keep")}
                    </button>
                    <button
                      type="button"
                      className="gl-btn gl-btn-outline"
                      onClick={() => {
                        setConfirmingClose(false);
                        if (onClose) onClose();
                      }}
                    >
                      {t("common.discard_input.discard")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show stacked-modal-backdrop"></div>
        </>
      )}
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
