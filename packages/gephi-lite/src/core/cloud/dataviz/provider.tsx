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
        if (!res.ok) throw new Error("Failed to fetch project content");
        // The content is returned directly as JSON
        return await res.text();
    }

    async createFile(file: Pick<CloudFile, "filename" | "description" | "isPublic" | "format">, content: string, thumbnail?: Blob): Promise<CloudFile> {
        return this.saveProject(file.filename, content, thumbnail);
    }

    async saveFile(file: CloudFile, content: string, thumbnail?: Blob): Promise<CloudFile> {
        if (file.id) {
            try {
                await this.deleteFile(file);
            } catch (e) {
                console.warn("Failed to delete old file before saving new one", e);
            }
        }
        return this.saveProject(file.filename, content, thumbnail);
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

    private async saveProject(name: string, content: string, thumbnail?: Blob): Promise<CloudFile> {
        const token = await this.getToken();

        let data;
        try {
            data = JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse content as JSON", e);
            throw new Error("Invalid content format");
        }

        const id = crypto.randomUUID();
        // @ts-expect-error window.supabase is dynamically injected
        const { data: sessionData } = await window.supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (thumbnail && user) {
            console.log(`[DatavizCloudProvider] Uploading thumbnail for ${id}...`);
            // @ts-expect-error window.supabase is dynamically injected
            const { data: uploadData, error: uploadError } = await window.supabase
                .storage
                .from('user_projects')
                .upload(`${user.id}/${id}.png`, thumbnail, {
                    upsert: true,
                    contentType: 'image/png'
                });

            if (uploadError) {
                console.error("[DatavizCloudProvider] Failed to upload thumbnail:", uploadError);
                alert(`サムネイルのアップロードに失敗しました: ${uploadError.message}`);
                // Proceed without thumbnail or throw error? 
                // We proceed but log warning.
            } else {
                console.log("[DatavizCloudProvider] Thumbnail uploaded:", uploadData);
            }
        } else {
            console.warn("[DatavizCloudProvider] Skipping thumbnail upload. Thumbnail:", !!thumbnail, "User:", !!user);
        }

        const projectData = {
            id,
            user_id: user?.id,
            name,
            description: "",
            app_name: APP_NAME,
            data: data,
            thumbnail_path: thumbnail && user ? `${user.id}/${id}.png` : null,
            updated_at: new Date().toISOString()
        };

        console.log("[DatavizCloudProvider] Inserting into DB directly:", projectData);

        // @ts-expect-error window.supabase is dynamically injected
        const { data: insertedData, error: dbError } = await window.supabase
            .from('projects')
            .upsert(projectData)
            .select()
            .single();

        if (dbError) {
            console.error("[DatavizCloudProvider] DB Error:", dbError);
            alert(`プロジェクトの保存に失敗しました (DB Error): ${dbError.message}`);
            throw new Error(`Failed to save project: ${dbError.message}`);
        }

        const p = insertedData;
        console.log("[DatavizCloudProvider] DB Success:", p);
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

    serialize(): string {
        return JSON.stringify({ type: this.type });
    }

}


export function datavizProviderDeserialize(_json: string): DatavizCloudProvider {
    return new DatavizCloudProvider();
}
