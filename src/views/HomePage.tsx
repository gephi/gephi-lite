import { FC } from "react";
import { BsGithub } from "react-icons/bs";

import { Layout } from "./layout";
import { GithubLoginModal } from "../core/cloud/github/GithubLoginModal";
import { useModal } from "../core/modals";
import { useConnectedUser } from "../core/user";
import { UserAvatar } from "../components/user/UserAvatar";

export const HomePage: FC = () => {
  const { openModal } = useModal();
  const [user] = useConnectedUser();

  return (
    <Layout>
      <div className="container">
        <div className="row">
          <div className="col-12">
            <h1>Hello World</h1>
            {user ? (
              <UserAvatar />
            ) : (
              <>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => openModal({ component: GithubLoginModal, arguments: {} })}
                >
                  <BsGithub className="me-1" />
                  Login with Github
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
