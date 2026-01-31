import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/api-auth";
import fs from "fs/promises";
import path from "path";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Get storage statistics and file list
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "stats";

    if (action === "stats") {
      // Get database storage stats
      const [
        totalCourses,
        totalLessons,
        coursesWithThumbnails,
        lessonsWithVideos,
      ] = await Promise.all([
        db.course.count(),
        db.lesson.count(),
        db.course.count({ where: { thumbnail: { not: null } } }),
        db.lesson.count({ where: { videoUrl: { not: null } } }),
      ]);

      // Get public folder stats
      let publicFolderStats = { files: 0, totalSize: 0 };
      try {
        const publicPath = path.join(process.cwd(), "public");
        publicFolderStats = await getFolderStats(publicPath);
      } catch {
        // Public folder might not exist or be accessible
      }

      return NextResponse.json({
        ok: true,
        data: {
          database: {
            courses: {
              total: totalCourses,
              withThumbnails: coursesWithThumbnails,
            },
            lessons: {
              total: totalLessons,
              withVideos: lessonsWithVideos,
            },
          },
          storage: {
            files: publicFolderStats.files,
            totalSizeBytes: publicFolderStats.totalSize,
            totalSizeMB: (publicFolderStats.totalSize / (1024 * 1024)).toFixed(2),
          },
          limits: {
            maxUploadSizeMB: 100,
            allowedTypes: ["image/jpeg", "image/png", "image/webp", "video/mp4", "application/pdf"],
          },
        },
      });
    }

    if (action === "files") {
      // List files in public folder
      const folder = searchParams.get("folder") || "";
      const publicPath = path.join(process.cwd(), "public", folder);
      
      try {
        const entries = await fs.readdir(publicPath, { withFileTypes: true });
        const files = await Promise.all(
          entries.map(async (entry) => {
            const fullPath = path.join(publicPath, entry.name);
            const stat = await fs.stat(fullPath);
            return {
              name: entry.name,
              isDirectory: entry.isDirectory(),
              size: stat.size,
              modified: stat.mtime.toISOString(),
              path: path.join(folder, entry.name).replace(/\\/g, "/"),
            };
          })
        );

        return NextResponse.json({
          ok: true,
          data: {
            folder,
            files: files.sort((a, b) => {
              if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
              return a.name.localeCompare(b.name);
            }),
          },
        });
      } catch {
        return NextResponse.json({
          ok: true,
          data: { folder, files: [] },
        });
      }
    }

    return NextResponse.json(
      { ok: false, error: "إجراء غير معروف" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in storage API:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في تحميل بيانات التخزين" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a file
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { ok: false, error: "مسار الملف مطلوب" },
        { status: 400 }
      );
    }

    // Security: Prevent path traversal
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, "");
    const fullPath = path.join(process.cwd(), "public", normalizedPath);
    
    // Ensure the path is within public folder
    if (!fullPath.startsWith(path.join(process.cwd(), "public"))) {
      return NextResponse.json(
        { ok: false, error: "مسار غير صالح" },
        { status: 400 }
      );
    }

    try {
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        await fs.rmdir(fullPath, { recursive: true });
      } else {
        await fs.unlink(fullPath);
      }

      return NextResponse.json({
        ok: true,
        data: { deleted: true, path: normalizedPath },
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: "فشل في حذف الملف" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في حذف الملف" },
      { status: 500 }
    );
  }
}

async function getFolderStats(folderPath: string): Promise<{ files: number; totalSize: number }> {
  let files = 0;
  let totalSize = 0;

  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);
      
      if (entry.isDirectory()) {
        const subStats = await getFolderStats(fullPath);
        files += subStats.files;
        totalSize += subStats.totalSize;
      } else {
        files++;
        const stat = await fs.stat(fullPath);
        totalSize += stat.size;
      }
    }
  } catch {
    // Ignore errors for inaccessible folders
  }

  return { files, totalSize };
}
