import { CloudIcon } from "../../../components/common-icons";
import { CloudFile, CloudProvider } from "../types";

const API_BASE_URL = "https://api.dataviz.jp";
const APP_NAME = "gephi-lite";

export class DatavizCloudProvider implements CloudProvider {
    type = "dataviz";
    icon = (<CloudIcon />);

    private async getToken(): Promise<string> {
        const { data } = await window.supabase.auth.getSession();
        if (!data.session?.access_token) {
            throw new Error("No active session");
        }
        return data.session.access_token;
    }

    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
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

        const data = await res.json();
        // Handle both array (legacy?) and object (spec) responses
        const projects = Array.isArray(data) ? data : (data.projects || []);

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
            webUrl: "",
            thumbnailUrl: p.thumbnail_path
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

        if (!res.ok) {
            throw new Error(`Failed to fetch project content: ${res.statusText}`);
        }

        // The API returns the JSON object directly.
        // We need to return it as a string.
        const data = await res.json();
        return JSON.stringify(data);
    }

    async createFile(file: Pick<CloudFile, "filename" | "description" | "isPublic" | "format">, content: string, thumbnail?: Blob): Promise<CloudFile> {
        const token = await this.getToken();

        // Prepare payload
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
            name: file.filename,
            app_name: APP_NAME,
            data: JSON.parse(content)
        };

        if (thumbnail) {
            payload.thumbnail = await this.blobToBase64(thumbnail);
        }

        const res = await fetch(`${API_BASE_URL}/api/projects`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to create project: ${res.status} ${errorText}`);
        }

        const responseData = await res.json();
        const p = responseData.project;

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
            thumbnailUrl: p.thumbnail_path,
            format: "gephi-lite"
        } as CloudFile;
    }

    async saveFile(file: CloudFile, content: string, thumbnail?: Blob): Promise<CloudFile> {
        const token = await this.getToken();

        // Prepare payload
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
            name: file.filename,
            data: JSON.parse(content)
        };

        if (thumbnail) {
            payload.thumbnail = await this.blobToBase64(thumbnail);
        }

        const res = await fetch(`${API_BASE_URL}/api/projects/${file.id}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to update project: ${res.status} ${errorText}`);
        }

        const responseData = await res.json();
        const p = responseData.project;

        return {
            type: "cloud",
            id: p.id,
            filename: p.name,
            description: "",
            createdAt: new Date(p.updated_at), // Use updated_at 
            updatedAt: new Date(p.updated_at),
            isPublic: false,
            size: 0,
            webUrl: "",
            thumbnailUrl: p.thumbnail_path,
            format: "gephi-lite"
        } as CloudFile;
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

    async getThumbnail(file: CloudFile): Promise<string> {
        if (!file.thumbnailUrl) return "";

        const token = await this.getToken();
        const res = await fetch(`${API_BASE_URL}/api/projects/${file.id}/thumbnail`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            // Simply return empty string if thumbnail fetch fails, no need to crash the app
            console.warn(`Failed to fetch thumbnail for ${file.filename}`);
            return "";
        }

        const blob = await res.blob();
        return URL.createObjectURL(blob);
    }

    serialize(): string {
        return JSON.stringify({ type: this.type });
    }

}

export function datavizProviderDeserialize(_json: string): DatavizCloudProvider {
    return new DatavizCloudProvider();
}
