import { getToken, refresh } from "@/lib/http";

const BASE = import.meta.env.VITE_API_URL;

export type UploadKind = "image" | "audio";

function send(
  kind: UploadKind,
  file: File,
  onProgress?: (pct: number) => void,
) {
  return new Promise<{
    status: number;
    body: { url?: string; error?: string };
  }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/admin/uploads/${kind}`);
    xhr.withCredentials = true;
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* not JSON */
      }
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => reject(new Error("Network error. Is the API running?"));

    const form = new FormData();
    form.append("file", file);
    xhr.send(form); // the browser sets the multipart Content-Type itself; don't set it
  });
}

export async function uploadFile(
  kind: UploadKind,
  file: File,
  onProgress?: (pct: number) => void,
) {
  let res = await send(kind, file, onProgress);
  // Access token expired? Refresh once and retry.
  if (res.status === 401 && (await refresh()))
    res = await send(kind, file, onProgress);
  if (res.status < 200 || res.status >= 300 || !res.body.url) {
    throw new Error(res.body.error ?? `Upload failed (${res.status})`);
  }
  return res.body.url;
}
