import { HelpIcon } from "./common-icons";

export function DocumentationHelp({title, url}: {title: string, url: string}) {
  return (
    <>
      {title}
      <a href={url} target="_blank" rel="noreferrer">
        <HelpIcon onClick={(e) => e.stopPropagation()}/>
      </a>
    </>
  )
}
