type HeaderValue = string | string[] | undefined;

interface GithubProxyRequest {
  query: {
    path?: string | string[];
  };
  method?: string;
  headers: Record<string, HeaderValue>;
  body?: unknown;
}

interface GithubProxyResponse {
  setHeader(name: string, value: string): void;
  status(code: number): GithubProxyResponse;
  json(body: unknown): unknown;
  end(): unknown;
}

export default async (req: GithubProxyRequest, res: GithubProxyResponse) => {
  // リクエストされたパスを抽出
  const pathArray = req.query.path || [];
  const path = Array.isArray(pathArray) ? pathArray.join("/") : pathArray;

  if (!path) {
    return res.status(400).json({ error: "path parameter is required" });
  }

  const targetUrl = `https://github.com/${path}`;

  try {
    // GitHub へリクエストを転送
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "user-agent": req.headers["user-agent"] || "Gephi-Lite/1.0 (+https://gephi.org/gephi-lite)",
        "content-type": req.headers["content-type"] || "application/json",
      },
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    });

    const contentType = response.headers.get("content-type");
    const body =
      contentType && contentType.includes("application/json") ? await response.json() : await response.text();

    // CORS ヘッダーを設定
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, User-Agent");

    // プリフライトリクエスト対応
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    return res.status(response.status).json(body);
  } catch (error) {
    console.error("GitHub proxy error:", error);
    return res.status(500).json({ error: "Failed to proxy request to GitHub" });
  }
};
