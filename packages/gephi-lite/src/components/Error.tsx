import cx from "classnames";
import { FC } from "react";
import { FallbackProps } from "react-error-boundary";
import { Trans, useTranslation } from "react-i18next";
import { TbFaceIdError } from "react-icons/tb";

import { resetStates } from "../core/context/dataContexts";
import { GitHubIcon, RetryIcon, TrashIcon } from "./common-icons";

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
  return `https://github.com/gephi/gephi-lite/issues/new?labels=bug,prod&body=${encodeURIComponent(body)}`;
}

export const ErrorComponent: FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const { t } = useTranslation("translation");

  return (
    <div className={cx("container text-center col-6 mt-5 pt-5")}>
      <div className="row">
        <div className="col-12">
          <h1 style={{ fontSize: 160 }}>
            <TbFaceIdError />
            {t("error.title")}
          </h1>
          <h2 className="text-danger my-3">{error.message || t("error.unknown")}</h2>

          <p className="mt-3 mw-100">
            <Trans i18nKey="error.message" />
          </p>

          <div className="d-flex justify-content-center gl-gap-2">
            <a className="gl-btn gl-btn-outline" rel="noreferrer" target="_blank" href={errorToGithubLink(error)}>
              <GitHubIcon /> {t("error.report")}
            </a>
            <button
              className="gl-btn gl-btn-outline"
              onClick={() => {
                resetStates(true);
                resetErrorBoundary();
              }}
            >
              <TrashIcon /> {t("error.reset")}
            </button>
            <button className="gl-btn gl-btn-fill" onClick={() => resetErrorBoundary()}>
              <RetryIcon /> {t("error.retry")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
