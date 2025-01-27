import { FC, useEffect } from "react";

import { GithubLoginModal } from "../../core/cloud/github/GithubLoginModal";
import { useModal } from "../../core/modals";

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
