// hooks/usePosts.ts
import {
  useQuery,
  keepPreviousData,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { PostI } from "../components/pages/tabs/Post";

// types/api.ts

interface PaginationControls {
  Limit: number;
  Page: number;
  Total: number;
}

interface APIRequest {
  pagination: {
    limit: number;
    page: number;
  };
  columns?: Record<string, unknown>[];
}

export interface PaginatedResponse<T> {
  content: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

interface UsePostsParams {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export const usePosts = ({
  page = 1,
  limit = 10,
  enabled = true,
}: UsePostsParams) => {
  return useQuery({
    queryKey: ["posts", "feed", page, limit],
    queryFn: async () =>
      await Post<APIRequest, PostI[]>("posts/feed", {
        pagination: { limit, page },
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
};
// hooks/useAddPost.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { Post } from "../../api";

/* ---------------------------------------------------------------------- */
/* Env                                                                     */
/* ---------------------------------------------------------------------- */

const CLOUDINARY_CLOUD_NAME = import.meta.env
  .VITE_CLOUDINARY_CLOUD_NAME as string;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env
  .VITE_CLOUDINARY_UPLOAD_PRESET as string;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/* ---------------------------------------------------------------------- */
/* Types                                                                   */
/* ---------------------------------------------------------------------- */

export type PostAssetType = "image" | "thumb";

export interface PostAsset {
  URL: string;
  Type: PostAssetType;
}

export interface PriceInput {
  Amount: number;
  Currency: string;
}

export interface LocationInput {
  Name: string;
  Coordinates: { Lat: number; Lon: number };
}

export interface AddPostInput {
  type: string;
  bathrooms: number;
  bedrooms: number;
  toilets: number;
  negotiable: boolean;
  months: number;
  units: number;
  price: PriceInput;
  location: LocationInput;
  amenities: string[];
  extras: string[];
  images: File[];
  onProgress?: (percentPerImage: Record<number, number>) => void;
}

interface PostPayload {
  Type: string;
  Bathrooms: number;
  Bedrooms: number;
  Toilets: number;
  Negotiable: boolean;
  Months: number;
  Units: number;
  Assets: PostAsset[];
  Price: PriceInput;
  Location: LocationInput;
  Amenities: string[];
  Extras: string[];
}

/* ---------------------------------------------------------------------- */
/* Compression: jSquash (WASM, fast desktop/modern-phone path) with a       */
/* browser-image-compression fallback (pure JS/canvas worker, works on      */
/* low-end/older phones or when WASM fails to init).                       */
/* ---------------------------------------------------------------------- */

interface CompressTarget {
  maxWidthOrHeight: number;
  quality: number; // 0-1
  maxSizeMB?: number; // used to drive the 1KB thumb target
}

async function compressWithJSquash(
  file: File,
  target: CompressTarget
): Promise<Blob> {
  // Loaded dynamically so a failed WASM init on an old/low-memory device
  // doesn't break the bundle — we just fall through to the JS fallback.
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
  let imageData;
  if (file.type === "image/png") {
    imageData = await decodePng(buffer);
  } else {
    imageData = await decodeJpeg(buffer);
  }

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

async function compressWithFallback(
  file: File,
  target: CompressTarget
): Promise<Blob> {
  return imageCompression(file, {
    maxWidthOrHeight: target.maxWidthOrHeight,
    maxSizeMB: target.maxSizeMB ?? 1,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: target.quality,
  });
}

/**
 * Three-tier compression:
 *  1. jSquash (WASM MozJPEG/WebP codecs) — best ratio, needs WASM support.
 *  2. browser-image-compression (canvas + worker) — works on virtually every
 *     phone, including older Android WebViews where WASM is flaky/slow.
 *  3. Original file, untouched — last resort so the post can still be created.
 */
async function compressImage(
  file: File,
  target: CompressTarget
): Promise<Blob> {
  try {
    return await compressWithJSquash(file, target);
  } catch {
    try {
      return await compressWithFallback(file, target);
    } catch {
      return file;
    }
  }
}

/* ---------------------------------------------------------------------- */
/* Cloudinary client-side upload (unsigned preset, no backend round trip)  */
/* ---------------------------------------------------------------------- */

function uploadToCloudinary(
  blob: Blob,
  folder: string,
  filename: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", folder);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.min(Math.round((e.loaded / e.total) * 100), 99));
      }
    });

    xhr.addEventListener("load", () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data?.secure_url) {
          onProgress?.(100);
          resolve(data.secure_url as string);
        } else {
          reject(new Error(data?.error?.message || "Cloudinary upload failed"));
        }
      } catch {
        reject(new Error("Cloudinary upload failed: invalid response"));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Cloudinary upload failed: network error"))
    );
    xhr.addEventListener("abort", () =>
      reject(new Error("Cloudinary upload was cancelled"))
    );

    xhr.open("POST", CLOUDINARY_UPLOAD_URL);
    xhr.send(formData);
  });
}

/* ---------------------------------------------------------------------- */
/* Hook                                                                    */
/* ---------------------------------------------------------------------- */

export function useAddPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddPostInput) => {
      const progressMap: Record<number, number> = {};
      const assets: PostAsset[] = [];

      for (let i = 0; i < input.images.length; i++) {
        const file = input.images[i];

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
            `post-${Date.now()}-${i}`,
            (pct) => {
              progressMap[i] = pct;
              input.onProgress?.({ ...progressMap });
            }
          ),
          uploadToCloudinary(
            thumbBlob,
            "posts/thumbs",
            `post-thumb-${Date.now()}-${i}`
          ),
        ]);

        assets.push({ URL: normalUrl, Type: "image" });
        assets.push({ URL: thumbUrl, Type: "thumb" });
      }

      const payload: PostPayload = {
        Type: input.type,
        Bathrooms: input.bathrooms,
        Bedrooms: input.bedrooms,
        Toilets: input.toilets,
        Negotiable: input.negotiable,
        Months: input.months,
        Units: input.units,
        Assets: assets,
        Price: input.price,
        Location: input.location,
        Amenities: input.amenities,
        Extras: input.extras,
      };

      return Post("/posts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

// hooks/posts.ts
// NOTE: adjust these two import paths to match your project structure —
// `Post` is your existing generic HTTP helper, `compressImage` /
// `uploadToCloudinary` are your existing image utilities. Nothing in
// those files needs to change.

export interface PostAsset {
  URL: string;
  Type: "image" | "thumb";
}

export interface UploadImagesInput {
  images: File[];
  onProgress?: (progress: Record<number, number>) => void;
}

export interface AddPostInput {
  type: string;
  bathrooms: number;
  bedrooms: number;
  toilets: number;
  negotiable: boolean;
  months: number;
  units: number;
  price: { Amount: number; Currency: string };
  location: { Name: string; Coordinates: { Lat: number; Lon: number } };
  amenities: string[];
  extras: string[];
  assets: PostAsset[]; // already-uploaded assets — this hook never uploads
}

/* ------------------------------------------------------------------ */
/* Step 1: upload + compress images ONLY. Never touches /posts.        */
/* Safe to call the moment the user finishes picking photos, since it  */
/* creates nothing in the database — just returns asset URLs.          */
// /* ------------------------------------------------------------------ */
// export function useUploadImages() {
//   return useMutation({
//     mutationFn: async (input: UploadImagesInput): Promise<PostAsset[]> => {
//       const progressMap: Record<number, number> = {};
//       const assets: PostAsset[] = [];

//       for (let i = 0; i < input.images.length; i++) {
//         const file = input.images[i];

//         const [normalBlob, thumbBlob] = await Promise.all([
//           compressImage(file, { maxWidthOrHeight: 1600, quality: 0.8 }),
//           compressImage(file, {
//             maxWidthOrHeight: 100,
//             quality: 0.4,
//             maxSizeMB: 0.001,
//           }),
//         ]);

//         const [normalUrl, thumbUrl] = await Promise.all([
//           uploadToCloudinary(
//             normalBlob,
//             "posts",
//             `post-${Date.now()}-${i}`,
//             (pct) => {
//               progressMap[i] = pct;
//               input.onProgress?.({ ...progressMap });
//             }
//           ),
//           uploadToCloudinary(
//             thumbBlob,
//             "posts/thumbs",
//             `post-thumb-${Date.now()}-${i}`
//           ),
//         ]);

//         assets.push({ URL: normalUrl, Type: "image" });
//         assets.push({ URL: thumbUrl, Type: "thumb" });
//       }

//       return assets;
//     },
//   });
// }

// /* ------------------------------------------------------------------ */
// /* Step 2: create the actual post. Called exactly once, on final       */
// /* submit, using assets that were already uploaded in step 1.          */
// /* ------------------------------------------------------------------ */
// export function useCreatePost() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (input: AddPostInput) => {
//       const payload: PostPayload = {
//         Type: input.type,
//         Bathrooms: input.bathrooms,
//         Bedrooms: input.bedrooms,
//         Toilets: input.toilets,
//         Negotiable: input.negotiable,
//         Months: input.months,
//         Units: input.units,
//         Assets: input.assets,
//         Price: input.price,
//         Location: input.location,
//         Amenities: input.amenities,
//         Extras: input.extras,
//       };

//       return Post("/posts", payload);
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["posts"] });
//     },
//   });
// }

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export interface PostAsset {
  URL: string;
  Type: "image" | "thumb";
}

export interface UploadImagesInput {
  images: File[];
  onProgress?: (progress: Record<number, number>) => void;
}

export interface AddPostInput {
  type: string;
  bathrooms: number;
  bedrooms: number;
  toilets: number;
  negotiable: boolean;
  months: number;
  units: number;
  price: { Amount: number; Currency: string };
  location: { Name: string; Coordinates: { Lat: number; Lon: number } };
  amenities: string[];
  extras: string[];
  assets: PostAsset[]; // already-uploaded assets — this hook never uploads
}

interface PostPayload {
  Type: string;
  Bathrooms: number;
  Bedrooms: number;
  Toilets: number;
  Negotiable: boolean;
  Months: number;
  Units: number;
  Assets: PostAsset[];
  Price: { Amount: number; Currency: string };
  Location: { Name: string; Coordinates: { Lat: number; Lon: number } };
  Amenities: string[];
  Extras: string[];
}

/* ------------------------------------------------------------------ */
/* Step 1: upload + compress images ONLY. Never touches /posts.        */
/* Safe to call the moment the user finishes picking photos, since it  */
/* creates nothing in the database — just returns asset URLs.          */
/* ------------------------------------------------------------------ */
export function useUploadImages() {
  return useMutation({
    mutationFn: async (input: UploadImagesInput): Promise<PostAsset[]> => {
      const progressMap: Record<number, number> = {};
      const assets: PostAsset[] = [];

      for (let i = 0; i < input.images.length; i++) {
        const file = input.images[i];

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
            `post-${Date.now()}-${i}`,
            (pct) => {
              progressMap[i] = pct;
              input.onProgress?.({ ...progressMap });
            }
          ),
          uploadToCloudinary(
            thumbBlob,
            "posts/thumbs",
            `post-thumb-${Date.now()}-${i}`
          ),
        ]);

        assets.push({ URL: normalUrl, Type: "image" });
        assets.push({ URL: thumbUrl, Type: "thumb" });
      }

      return assets;
    },
  });
}

/* ------------------------------------------------------------------ */
/* Step 2: create the actual post. Called exactly once, on final       */
/* submit, using assets that were already uploaded in step 1.          */
/* ------------------------------------------------------------------ */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PostI) => {
      const payload = input;
      return await Post<PostI, unknown>("/posts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

// hooks/posts.ts

interface UseInfinitePostsParams {
  limit: number;
  // search is accepted but intentionally not sent to the server yet —
  // Columns-based filtering (search/filters) lands in a later pass.
  search?: string;
}
export const useInfinitePosts = ({ limit }: UseInfinitePostsParams) => {
  return useInfiniteQuery({
    queryKey: ["posts", "infinite", limit],
    queryFn: async ({ pageParam }) => {
      const res = await Post<APIRequest, PostI[]>("posts/feed", {
        pagination: {
          limit,
          page: pageParam,
        },
      });

      return {
        data: res?.data || [],
        pagination: res?.pagination as unknown as PaginationControls,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // 1. If the previous page request threw an error or returned nothing,
      // halt right here and don't try to read any properties.
      if (!lastPage || !lastPage.pagination) {
        return undefined;
      }

      // 2. Safely read pagination with fallback values to prevent NaN crashes
      const Page = lastPage.pagination.Page ?? lastPage.pagination?.Page;
      const Limit = lastPage.pagination.Limit ?? lastPage.pagination?.Limit;
      const Total = lastPage.pagination.Total ?? lastPage.pagination?.Total;

      if (Page === undefined || Limit === undefined || Total === undefined) {
        return undefined;
      }

      const fetchedSoFar = Page * Limit;
      return fetchedSoFar < Total ? Page + 1 : undefined;
    },
  });
};
