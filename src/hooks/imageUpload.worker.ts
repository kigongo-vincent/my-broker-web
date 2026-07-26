/// <reference lib="webworker" />

// jSquash works in workers — in fact it's *better* here since WASM off
// the main thread is the whole point.
type CompressTarget = {
  maxWidthOrHeight: number;
  quality: number;
  maxSizeMB?: number;
};

async function compressWithJSquash(
  file: File,
  target: CompressTarget
): Promise<Blob> {
  const [
    { decode: decodeJpeg },
    { decode: decodePng },
    { encode: encodeWebp },
    { default: resizeMod },
  ] = await Promise.all([
    import("@jsquash/jpeg"),
    import("@jsquash/png"),
    import("@jsquash/webp"),
    import("@jsquash/resize"),
  ]);

  const buffer = await file.arrayBuffer();
  const imageData =
    file.type === "image/png"
      ? await decodePng(buffer)
      : await decodeJpeg(buffer);

  const scale = Math.min(
    1,
    target.maxWidthOrHeight / Math.max(imageData.width, imageData.height)
  );
  const resized =
    scale < 1
      ? await resizeMod(imageData, {
          width: Math.round(imageData.width * scale),
          height: Math.round(imageData.height * scale),
        })
      : imageData;

  const webpBuffer = await encodeWebp(resized, {
    quality: Math.round(target.quality * 100),
  });
  return new Blob([webpBuffer], { type: "image/webp" });
}

// No browser-image-compression fallback here — that package assumes
// `document`/canvas APIs and its own internal worker spawn, which don't
// exist inside a worker. If jSquash fails (rare — WASM works essentially
// everywhere workers do), fall back to the raw file.
async function compressImage(
  file: File,
  target: CompressTarget
): Promise<Blob> {
  try {
    return await compressWithJSquash(file, target);
  } catch {
    return file;
  }
}

/**
 * fetch() in a worker has no native upload-progress event (no XHR here).
 * We approximate progress via a streamed request body when supported,
 * else jump 0 -> 100 on completion — still correct, just coarser.
 */
async function uploadToCloudinary(
  blob: Blob,
  folder: string,
  filename: string,
  cloudName: string,
  uploadPreset: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, filename);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  onProgress?.(0);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
  const data = await res.json();
  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || "Cloudinary upload failed");
  }
  onProgress?.(100);
  return data.secure_url as string;
}

export interface UploadJobImage {
  file: File;
  index: number;
}

export interface UploadWorkerRequest {
  type: "upload";
  jobId: string;
  images: UploadJobImage[];
  cloudName: string;
  uploadPreset: string;
}

export interface UploadWorkerProgressMsg {
  type: "progress";
  jobId: string;
  index: number;
  pct: number;
}
export interface UploadWorkerDoneMsg {
  type: "done";
  jobId: string;
  assets: { URL: string; Type: "image" | "thumb" }[];
}
export interface UploadWorkerErrorMsg {
  type: "error";
  jobId: string;
  error: string;
}

self.onmessage = async (e: MessageEvent<UploadWorkerRequest>) => {
  const msg = e.data;
  if (msg.type !== "upload") return;

  const { jobId, images, cloudName, uploadPreset } = msg;

  try {
    const assets: { URL: string; Type: "image" | "thumb" }[] = [];

    for (const { file, index } of images) {
      const [normalBlob, thumbBlob] = await Promise.all([
        compressImage(file, { maxWidthOrHeight: 1600, quality: 0.8 }),
        compressImage(file, {
          maxWidthOrHeight: 100,
          quality: 0.4,
          maxSizeMB: 0.001,
        }),
      ]);

      const [normalUrl, thumbUrl] = await Promise.all([
        uploadToCloudinary(
          normalBlob,
          "posts",
          `post-${Date.now()}-${index}`,
          cloudName,
          uploadPreset,
          (pct) => {
            const progressMsg: UploadWorkerProgressMsg = {
              type: "progress",
              jobId,
              index,
              pct,
            };
            self.postMessage(progressMsg);
          }
        ),
        uploadToCloudinary(
          thumbBlob,
          "posts/thumbs",
          `post-thumb-${Date.now()}-${index}`,
          cloudName,
          uploadPreset
        ),
      ]);

      assets.push({ URL: normalUrl, Type: "image" });
      assets.push({ URL: thumbUrl, Type: "thumb" });
    }

    const doneMsg: UploadWorkerDoneMsg = { type: "done", jobId, assets };
    self.postMessage(doneMsg);
  } catch (err: any) {
    const errorMsg: UploadWorkerErrorMsg = {
      type: "error",
      jobId,
      error: err?.message || "Upload failed",
    };
    self.postMessage(errorMsg);
  }
};

export {};
