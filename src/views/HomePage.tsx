import { FC, useEffect } from "react";
import { BsGithub } from "react-icons/bs";

import { Layout } from "./layout";
import { GithubLoginModal } from "../core/cloud/github/GithubLoginModal";
import { useModal } from "../core/modals";
import { useConnectedUser } from "../core/user";
import { UserAvatar } from "../components/user/UserAvatar";

export const HomePage: FC = () => {
  const { openModal } = useModal();
  const [user] = useConnectedUser();

  useEffect(() => {
    if (user) {
      console.log("Connected user is ", user);
      // user.provider.getFiles().then((data) => console.log(data));
      // user.provider.getFileContent("a86358f094376ef0cbaa291821ed5f94").then((data) => console.log(data));
    }
  }, [user]);

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
