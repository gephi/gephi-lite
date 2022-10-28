import { Octokit } from "@octokit/core";
import { CloudProvider, CloudFile } from "../types";

import { notEmpty } from "../../utils/casting";

export class GithubProvider implements CloudProvider {
  octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * Get Gist GEXF files.
   */
  async getFiles(skip = 0, limit = 5): Promise<Array<CloudFile>> {
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
              if (this.getGexfFilename(item)) {
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
      const filename = this.getGexfFilename(response.data);
      if (filename) return this.gistToCloudFile(response.data);
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
      const filename = this.getGexfFilename(response.data);
      if (filename) {
        const file = response.data.files[filename];
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
  }): CloudFile {
    if (!gist.id) throw new Error(`Gist ${JSON.stringify(gist)} has no ID`);
    const filename = this.getGexfFilename(gist);
    if (!filename) throw new Error(`File ${filename} can't be find on gist ${gist.id}`);
    return {
      id: gist.id,
      description: gist.description ?? undefined,
      filename: filename,
      createdAt: gist.created_at ? new Date(gist.created_at) : new Date(),
      updatedAt: gist.updated_at ? new Date(gist.updated_at) : new Date(),
      isPublic: gist.public !== undefined ? gist.public : false,
    };
  }

  /**
   * Given a gist, check if it has a GEXF file.
   * If so, it return the filename, otherwise null
   */
  private getGexfFilename(gist: { files?: { [key: string]: any } }): string | null {
    let result: string | null = null;
    Object.keys(gist.files || []).forEach((filename: string) => {
      const file = (gist.files || [])[filename];
      if (file && file.filename.endsWith(".gexf")) {
        result = file.filename;
      }
    });
    return result;
  }
}
