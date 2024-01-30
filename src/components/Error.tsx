import { FC } from "react";
import { FallbackProps } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { TbFaceIdError } from "react-icons/tb";
import cx from "classnames";

import { GitHubIcon } from "./common-icons";

function errorToGithubLink(error: unknown): string {
  let body = `
## Description

Please provide a description of what you were doing while the error occurs`;

  if (error instanceof Error) {
    body = `${body}
    
## Stack trace 

\`\`\`
${error.message}
${error.stack}
\`\`\``;
  }
  return `https://github.com/gephi/gephi-lite/issues/new?labels=prod&body=${encodeURIComponent(body)}`;
}

export const ErrorComponent: FC<FallbackProps> = ({ error }) => {
  const { t } = useTranslation("translation");

  return (
    <div className={cx("container text-center col-6 mt-5 pt-5")}>
      <div className="row">
        <h1 style={{ fontSize: 160 }}>
          <TbFaceIdError />
          {t("error.title")}
        </h1>
        <h2 className="text-danger my-3">{error.message || t("error.unknown")}</h2>
        <p>{t("error.message")}</p>
        <a className="btn btn-outline-primary" href={errorToGithubLink(error)} target="_blank">
          <GitHubIcon /> {t("error.report")}
        </a>
      </div>
    </div>
  );
};
