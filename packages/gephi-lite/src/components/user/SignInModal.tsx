import { FC, useEffect } from "react";

import { useModal } from "../../core/modals";
import { GithubLoginModal } from "../modals/GithubLoginModal";

/**
 * For now this modal is just a redirect to the one for github.
 * But in a near feature, we will have other cloud provider,
 * so we need a modal to choose the cloud provider
 */
export const SignInModal: FC = () => {
  const { openModal } = useModal();

  useEffect(() => {
    openModal({ component: GithubLoginModal, arguments: {} });
  }, [openModal]);

  return null;
};
