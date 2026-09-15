import { ComponentType } from "react";

export interface ModalProps<ArgumentsType = unknown, SubmitArgumentsType = unknown> {
  arguments: ArgumentsType;
  cancel: () => void;
  submit: (args: SubmitArgumentsType) => void;
}

export interface ModalRequest<ArgumentsType = unknown, SubmitArgumentsType = unknown> {
  component: ComponentType<ModalProps<ArgumentsType, SubmitArgumentsType>>;
  arguments: ArgumentsType;
  beforeCancel?: () => void;
  afterCancel?: () => void;
  beforeSubmit?: (args: SubmitArgumentsType) => void;
  afterSubmit?: (args: SubmitArgumentsType) => void;
}

export interface ModalState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modal?: ModalRequest<any, any>;
  // Declared by the open modal while it holds user input that closing would discard. A close
  // coming from outside of it (the Android back button) then asks it to confirm rather than
  // throwing the input away, see `requestCloseModal`.
  hasUnsavedInput?: boolean;
  // Bumped by `requestCloseModal` when the open modal has unsaved input: the modal watches this
  // token and raises its own confirmation. A counter rather than a flag, so two requests in a row
  // are distinguishable.
  closeRequestId?: number;
}
