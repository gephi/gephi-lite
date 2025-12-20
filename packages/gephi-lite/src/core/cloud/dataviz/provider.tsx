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

        // 1. Get storage_path from DB
        // @ts-expect-error accessing internal properties
        const supabaseUrl = window.supabase.supabaseUrl;
        // @ts-expect-error accessing internal properties
        const supabaseKey = window.supabase.supabaseKey;
        const token = await this.getToken();

        const dbRes = await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${id}&select=storage_path`, {
            headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${token}`
            }
        });

        if (!dbRes.ok) throw new Error("Failed to fetch project metadata");
        const rows = await dbRes.json();
        if (rows.length === 0) throw new Error("Project not found");

        const storagePath = rows[0].storage_path;
        if (!storagePath) throw new Error("Project content not found (no storage_path)");

        // 2. Download from Storage
        // @ts-expect-error window.supabase is dynamically injected
        const { data, error } = await window.supabase
            .storage
            .from('user_projects')
            .download(storagePath);

        if (error) {
            console.error("Storage download error:", error);
            throw new Error(`Failed to download project content: ${error.message}`);
        }

        return await data.text();
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




        const id = crypto.randomUUID();
        // @ts-expect-error window.supabase is dynamically injected
        const { data: sessionData } = await window.supabase.auth.getSession();
        const user = sessionData?.session?.user;

        const token = await this.getToken();

        // 1. Upload Project Content (JSON) to Storage
        const jsonPath = `${user.id}/${id}.json`;
        console.log(`[DatavizCloudProvider] Uploading project JSON to ${jsonPath}...`);

        const jsonBlob = new Blob([content], { type: 'application/json' });
        // @ts-expect-error window.supabase is dynamically injected
        const { error: jsonUploadError } = await window.supabase
            .storage
            .from('user_projects')
            .upload(jsonPath, jsonBlob, {
                upsert: true,
                contentType: 'application/json'
            });

        if (jsonUploadError) {
            console.error("[DatavizCloudProvider] Failed to upload project JSON:", jsonUploadError);
            alert(`プロジェクトデータのアップロードに失敗しました: ${jsonUploadError.message}`);
            throw new Error(`Failed to upload project JSON: ${jsonUploadError.message}`);
        }

        // 2. Upload Thumbnail to Storage (if exists)
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
                // Proceed without thumbnail
            } else {
                console.log("[DatavizCloudProvider] Thumbnail uploaded:", uploadData);
            }
        }

        const projectData = {
            id,
            user_id: user?.id,
            name,
            app_name: APP_NAME,
            storage_path: jsonPath, // Save storage path instead of raw data
            thumbnail_path: thumbnail && user ? `${user.id}/${id}.png` : null,
            updated_at: new Date().toISOString()
        };

        console.log("[DatavizCloudProvider] Inserting into DB manually:", projectData);

        // @ts-expect-error accessing internal properties
        const supabaseUrl = window.supabase.supabaseUrl;
        // @ts-expect-error accessing internal properties
        const supabaseKey = window.supabase.supabaseKey;

        const res = await fetch(`${supabaseUrl}/rest/v1/projects`, {
            method: "POST",
            headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=representation"
            },
            body: JSON.stringify(projectData)
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("[DatavizCloudProvider] DB Error:", res.status, errorText);
            alert(`プロジェクトの保存に失敗しました (DB Error: ${res.status}): ${errorText}`);
            throw new Error(`Failed to save project: ${res.status} ${errorText}`);
        }

        const insertedData = await res.json();
        const p = insertedData[0]; // return=representation returns array
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
