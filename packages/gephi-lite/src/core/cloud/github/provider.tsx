import { notEmpty } from "@gephi/gephi-lite-sdk";
import { Octokit } from "@octokit/core";
import { isNil } from "lodash";

import { GitHubIcon } from "../../../components/common-icons";
import { checkFilenameExtension } from "../../../utils/check";
import { getFilename } from "../../file/utils";
import { CloudFile, CloudProvider } from "../types";

export type GistFile =
  | {
      filename?: string;
      type?: string;
      language?: string;
      raw_url?: string;
      size?: number;
    }
  | undefined
  | null;
export class GithubProvider implements CloudProvider {
  type = "github";
  icon = (<GitHubIcon />);
  octokit: Octokit;
  token: string;

  constructor(token: string) {
    this.token = token;
    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * Get Gist GEXF files.
   */
  async getFiles(skip: number, limit: number): Promise<Array<Omit<CloudFile, "format">>> {
    let result: Array<Omit<CloudFile, "format">> = [];
    let ghPage = 0;
    let reachEnd = false;

    while (!reachEnd && result.length < skip + limit) {
      ghPage++;
      const response = await this.octokit.request("GET /gists", {
        per_page: 100,
        page: ghPage,
      });
      if (response.data && response.data.length > 0) {
        result = result.concat(
          response.data
            .map((item) => {
              if (item && this.getGraphFile(item)) {
                return this.gistToCloudFile(item);
              }
              return null;
            })
            .filter(notEmpty),
        );
      } else {
        reachEnd = true;
      }
    }
    return result.slice(skip, skip + limit);
  }

  /**
   * Request options forcing a fresh read of the gist, bypassing any HTTP cache. GitHub serves gists
   * with a short-lived cache, so without this a change made seconds ago from another tab/session
   * would be hidden behind a stale response — which would defeat the whole remote-freshness guard
   * (stale updatedAt / stale content). The unique query param defeats the URL-keyed browser cache;
   * the header asks any cache to revalidate with the origin.
   */
  private noCacheRequestOptions() {
    return {
      // A unique query param defeats the URL-keyed HTTP cache (fetch ignores a Cache-Control request
      // header for its own cache decisions, so that alone would not help), and request.cache tells
      // fetch itself not to reuse a cached response.
      _bust: Date.now(),
      request: { cache: "no-store" as RequestCache },
    };
  }

  /**
   * One read of the gist, returning both its metadata and the content of its graph file.
   *
   * Reading the two together matters for the freshness guard: it compares the remote content
   * against a fingerprint taken alongside a reference date, and mixing a date from one read with
   * a content from another would compare two potentially different versions. It also saves a
   * round-trip where both are needed at once (right after a write, see saveFile).
   */
  private async readGist(id: string): Promise<{ file: Omit<CloudFile, "format">; content: string } | null> {
    const response = await this.octokit.request("GET /gists/{gist_id}", {
      gist_id: id,
      ...this.noCacheRequestOptions(),
    });
    if (!response.data) return null;

    const gistFile = this.getGraphFile(response.data);
    if (!gistFile) return null;

    // Over ~1MB the API only sends a truncated content, the whole file being served by raw_url.
    const file = response.data.files?.[gistFile.filename];
    const content = file?.truncated && file?.raw_url ? await (await fetch(file.raw_url)).text() : file?.content || "";

    return { file: this.gistToCloudFile(response.data), content };
  }

  /**
   * Get a file by id (without content)
   */
  async getFile(id: string): Promise<Omit<CloudFile, "format"> | null> {
    return (await this.readGist(id))?.file || null;
  }

  /**
   * Retrieve the content of file by its id.
   */
  async getFileContent(id: string): Promise<string> {
    const read = await this.readGist(id);
    if (!read) throw new Error("not found");
    return read.content;
  }

  /**
   * Create a gist on github
   */
  async createFile(file: CloudFile, content: string): Promise<CloudFile> {
    const filename = getFilename(file.filename, file.format);
    const body = {
      description: file.description || file.filename,
      public: file.isPublic || false,
      files: {
        [filename]: {
          content,
        },
      },
    };
    const result = await this.octokit.request("POST /gists", body);
    return { ...this.gistToCloudFile(result.data), format: file.format };
  }

  /**
   * Save (ie.update) a file on github
   */
  async saveFile(file: CloudFile, content: string): Promise<{ file: CloudFile; content: string }> {
    const body = {
      description: file.description,
      public: file.isPublic || false,
      files: {
        [file.filename]: {
          content,
        },
      },
    };
    const result = await this.octokit.request("PATCH /gists/{gist_id}", {
      gist_id: file.id,
      ...body,
    });

    // Read the gist back from the same "detail" endpoint the freshness guard polls, rather than
    // trusting the PATCH response or the bytes we just sent:
    // - the two endpoints can report a different `updated_at` for the very version just written,
    //   and memorizing the write one makes every later check believe the remote moved on its own
    //   (same reasoning as the open path, see `open` in core/file);
    // - the content the gist ends up holding is what later checks will download and compare, so
    //   that is what has to be fingerprinted - anything GitHub might do to the bytes on the way in
    //   would otherwise make every comparison report a difference that does not exist.
    // Falls back to the PATCH response and our own bytes when the re-read is unavailable (offline
    // right after the write...), which is no worse than not re-reading at all.
    const fresh = await this.readGist(file.id).catch(() => null);
    return {
      file: { ...this.gistToCloudFile(result.data), ...(fresh?.file || {}), format: file.format },
      content: fresh?.content ?? content,
    };
  }

  /**
   * Delete a gist on github.
   */
  async deleteFile(file: CloudFile): Promise<void> {
    await this.octokit.request("DELETE /gists/{gist_id}", {
      gist_id: file.id,
    });
  }

  serialize(): string {
    return JSON.stringify({
      type: this.type,
      token: this.token,
    });
  }

  /**
   * Convert a gist to a CloudFile.
   * If the gist has no gexf file, this function throw an error
   */
  private gistToCloudFile(gist: {
    id?: string;
    description?: string | null;
    public?: boolean;
    created_at?: string;
    updated_at?: string;
    files?: { [key: string]: GistFile };
    html_url?: string;
  }): Omit<CloudFile, "format"> {
    if (!gist.id) throw new Error(`Gist ${JSON.stringify(gist)} has no ID`);
    const file = this.getGraphFile(gist);
    if (!file) throw new Error(`File can't be find on gist ${gist.id}`);
    return {
      type: "cloud",
      id: gist.id,
      description: gist.description ?? undefined,
      filename: file.filename,
      createdAt: gist.created_at ? new Date(gist.created_at) : new Date(),
      updatedAt: gist.updated_at ? new Date(gist.updated_at) : new Date(),
      isPublic: gist.public !== undefined ? gist.public : false,
      size: file.size,
      webUrl: file.webUrl,
    };
  }

  /**
   * Given a gist, check if it is a graphml file.
   * If so, it return the file, otherwise null
   */
  private getGraphFile(gist: {
    files?: { [key: string]: GistFile };
    html_url?: string;
  }): { filename: string; size: number; webUrl?: string } | null {
    let result: { filename: string; size: number; webUrl?: string } | null = null;
    Object.keys(gist.files || []).forEach((filename: string) => {
      const file = gist.files ? gist.files[filename] : undefined;
      if (
        file &&
        file.filename &&
        (checkFilenameExtension(file.filename, "gexf") ||
          checkFilenameExtension(file.filename, "graphml") ||
          checkFilenameExtension(file.filename, "json"))
      ) {
        result = {
          filename: file.filename || "Untitled",
          size: file.size || 0,
          webUrl: gist.html_url,
        };
      }
    });
    return result;
  }
}

/**
 * Deserialize.
 */
export function ghProviderDeserialize(json: string): GithubProvider {
  const params = JSON.parse(json);
  if (params.type !== "github") throw new Error("Not a GithubProvider serialization");
  if (isNil(params.token)) throw new Error("Token is mandatory in GithubProvider serialization");
  return new GithubProvider(params.token);
}
