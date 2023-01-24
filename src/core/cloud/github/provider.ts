import { isNil } from "lodash";
import { Octokit } from "@octokit/core";
import { CloudProvider, CloudFile } from "../types";

import { notEmpty } from "../../utils/casting";

export class GithubProvider implements CloudProvider {
  type = "github";
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
  async getFiles(skip: number, limit: number): Promise<Array<CloudFile>> {
    let result: Array<CloudFile> = [];
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
              if (this.getGexfFile(item)) {
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
   * Get a file by id (without content)
   */
  async getFile(id: string): Promise<CloudFile | null> {
    const response = await this.octokit.request("GET /gists/{gist_id}", {
      gist_id: id,
    });

    if (response.data) {
      const file = this.getGexfFile(response.data);
      if (file) return this.gistToCloudFile(response.data);
    }

    return null;
  }

  /**
   * Retrieve the content of file by its id.
   */
  async getFileContent(id: string): Promise<string> {
    const response = await this.octokit.request("GET /gists/{gist_id}", {
      gist_id: id,
    });

    if (response.data && response.data.files) {
      const gistFile = this.getGexfFile(response.data);
      if (gistFile) {
        const file = response.data.files[gistFile.filename];
        if (file?.truncated && file?.raw_url) {
          const response = await fetch(file?.raw_url);
          const content = await response.text();
          return content;
        }
        return file?.content || "";
      }
    }

    throw new Error("not found");
  }

  /**
   * Save or create a file on github
   */
  async saveFile(
    file: { id?: string; filename: string; description?: string; isPublic?: boolean },
    content: string,
  ): Promise<CloudFile> {
    const body = {
      description: file.description,
      public: file.isPublic || false,
      files: {
        [file.filename]: {
          content,
        },
      },
    };
    if (!file.id) {
      const result = await this.octokit.request("POST /gists", body);
      return this.gistToCloudFile(result.data);
    } else {
      const result = await this.octokit.request("PATCH /gists/{gist_id}", {
        gist_id: file.id,
        ...body,
      });
      return this.gistToCloudFile(result.data);
    }
  }

  /**
   * Delete a gist on github.
   */
  async deleteFile(id: string): Promise<void> {
    await this.octokit.request("DELETE /gists/{gist_id}", {
      gist_id: id,
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
    files?: { [key: string]: any };
    html_url?: string;
  }): CloudFile {
    if (!gist.id) throw new Error(`Gist ${JSON.stringify(gist)} has no ID`);
    const file = this.getGexfFile(gist);
    if (!file) throw new Error(`File can't be find on gist ${gist.id}`);
    return {
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
   * Given a gist, check if it has a GEXF file.
   * If so, it return the file, otherwise null
   */
  private getGexfFile(gist: {
    files?: { [key: string]: any };
    html_url?: string;
  }): { filename: string; size: number; webUrl?: string } | null {
    let result: { filename: string; size: number; webUrl?: string } | null = null;
    Object.keys(gist.files || []).forEach((filename: string) => {
      const file = (gist.files || [])[filename];
      if (file && file.filename.endsWith(".gexf")) {
        result = {
          filename: file.filename,
          size: file.size,
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
