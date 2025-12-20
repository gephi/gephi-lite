import { CloudIcon } from "../../../components/common-icons";
import { CloudFile, CloudProvider } from "../types";

const API_BASE_URL = "https://api.dataviz.jp";
const APP_NAME = "gephi-lite";

export class DatavizCloudProvider implements CloudProvider {
    type = "dataviz";
    icon = (<CloudIcon />);

    private async getToken(): Promise<string> {
        // @ts-expect-error window.supabase is dynamically injected
        const { data } = await window.supabase.auth.getSession();
        if (!data.session?.access_token) {
            throw new Error("No active session");
        }
        return data.session.access_token;
    }

    async getFiles(_skip: number = 0, _limit: number = 100): Promise<Array<Omit<CloudFile, "format">>> {
        const token = await this.getToken();
        const url = new URL(`${API_BASE_URL}/api/projects`);
        url.searchParams.append("app", APP_NAME);

        const res = await fetch(url.toString(), {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch projects: ${res.statusText}`);
        }

        const projects = await res.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return projects.map((p: any) => ({
            type: "cloud",
            id: p.id,
            filename: p.name,
            description: "",
            createdAt: new Date(p.created_at),
            updatedAt: new Date(p.updated_at),
            isPublic: false,
            size: 0,
            webUrl: ""
        }));
    }

    async getFile(id: string): Promise<Omit<CloudFile, "format"> | null> {
        const files = await this.getFiles();
        return files.find(f => f.id === id) || null;
    }

    async getFileContent(id: string): Promise<string> {
        const token = await this.getToken();
        const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error("Failed to fetch project content");
        // The content is returned directly as JSON
        return await res.text();
    }

    async createFile(file: Pick<CloudFile, "filename" | "description" | "isPublic" | "format">, content: string): Promise<CloudFile> {
        return this.saveProject(file.filename, content);
    }

    async saveFile(file: CloudFile, content: string): Promise<CloudFile> {
        if (file.id) {
            try {
                await this.deleteFile(file);
            } catch (e) {
                console.warn("Failed to delete old file before saving new one", e);
            }
        }
        return this.saveProject(file.filename, content);
    }

    async deleteFile(file: CloudFile): Promise<void> {
        const token = await this.getToken();
        const res = await fetch(`${API_BASE_URL}/api/projects/${file.id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error("Failed to delete project");
    }

    private async saveProject(name: string, content: string): Promise<CloudFile> {
        const token = await this.getToken();
        let data;
        try {
            data = JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse content as JSON", e);
            throw new Error("Invalid content format");
        }

        const body = {
            name,
            app_name: APP_NAME,
            data: data
        };

        const res = await fetch(`${API_BASE_URL}/api/projects`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error("Failed to save project");

        const p = await res.json();
        return {
            type: "cloud",
            id: p.id,
            filename: p.name,
            description: "",
            createdAt: new Date(p.created_at),
            updatedAt: new Date(p.updated_at),
            isPublic: false,
            size: 0,
            webUrl: "",
            format: "gephi-lite"
        } as CloudFile;
    }

    serialize(): string {
        return JSON.stringify({ type: this.type });
    }

}


export function datavizProviderDeserialize(_json: string): DatavizCloudProvider {
    return new DatavizCloudProvider();
}
