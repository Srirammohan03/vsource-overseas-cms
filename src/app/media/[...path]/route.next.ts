import { NextResponse } from "next/server";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { localMediaRoot, mediaFolders } from "@/lib/storage/local";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const knownTypes: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: parts } = await context.params;


    if (
      !parts ||
      parts.length < 2 ||
      parts.length > 3 ||
      parts.some(
        (part) =>
          part === "." || part === ".." || !/^[a-zA-Z0-9._-]+$/.test(part),
      )
    ) {
      console.error("INVALID MEDIA PATH:", parts);

      return new NextResponse("Invalid media path", {
        status: 404,
      });
    }

    if (!mediaFolders.includes(parts[0] as (typeof mediaFolders)[number])) {
      console.error("INVALID MEDIA FOLDER:", {
        requested: parts[0],
        allowed: mediaFolders,
      });

      return new NextResponse("Invalid media folder", {
        status: 404,
      });
    }

    const filename = parts.at(-1)!;
    const extension = path.extname(filename).toLowerCase();
    const contentType = knownTypes[extension];

    if (!contentType) {
      return new NextResponse("Unsupported file type", {
        status: 415,
      });
    }

    const root = path.resolve(localMediaRoot());
    const target = path.resolve(root, ...parts);
    const relativePath = path.relative(root, target);

 

    if (
      relativePath === ".." ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath)
    ) {
      return new NextResponse("Forbidden", {
        status: 403,
      });
    }

    const actualRoot = await realpath(root);
    const actualTarget = await realpath(target);

    const actualRelative = path.relative(actualRoot, actualTarget);

    if (
      actualRelative === ".." ||
      actualRelative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(actualRelative)
    ) {
      return new NextResponse("Forbidden", {
        status: 403,
      });
    }

    const fileStat = await stat(actualTarget);

    if (!fileStat.isFile()) {
      return new NextResponse("Media file not found", {
        status: 404,
      });
    }

    const file = await readFile(actualTarget);

   

    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(file.length),
        "Cache-Control":
          process.env.NODE_ENV === "development"
            ? "no-store"
            : "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;

    console.error("MEDIA ROUTE ERROR:", {
      message: err.message,
      code: err.code,
      path: err.path,
    });

    if (err.code === "ENOENT" || err.code === "ENOTDIR") {
      return new NextResponse("Media file not found", {
        status: 404,
      });
    }

    if (err.code === "EACCES" || err.code === "EPERM") {
      return new NextResponse("Media access denied", {
        status: 403,
      });
    }

    return new NextResponse("Unable to load media", {
      status: 500,
    });
  }
}
