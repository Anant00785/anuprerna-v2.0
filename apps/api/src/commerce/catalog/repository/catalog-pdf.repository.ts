import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import { catalogPdf } from "../../../database/schema/index.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

function formatCatalogPdf(r: any) {
  if (!r) return null;
  return {
    id: String(r.id),
    version: Number(r.version || 1),
    artisanId: r.artisanId ? String(r.artisanId) : null,
    requestedById: r.requestedById ? String(r.requestedById) : null,
    status: r.status || "READY",
    downloadUrl: r.downloadUrl || "",
    s3Key: r.s3Key || "",
    fileName: r.fileName || "",
    requestedAt: Number(r.requestedAt || 0),
    completedAt: Number(r.completedAt || 0),
    failureMessage: r.failureMessage || "",
    restartRecoveryRequired: Boolean(r.restartRecoveryRequired),
    compressedDownloadUrl: r.compressedDownloadUrl || "",
    compressedS3Key: r.compressedS3Key || "",
    compressedFileName: r.compressedFileName || "",
    compressedFailureMessage: r.compressedFailureMessage || "",
    compressedAttemptCount: Number(r.compressedAttemptCount || 0),
  };
}

@Injectable()
export class CatalogPdfRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase,
  ) {}

  async findById(id: bigint) {
    const [row] = await this.db.select().from(catalogPdf).where(eq(catalogPdf.id, id)).limit(1);
    return row ? formatCatalogPdf(row) : null;
  }

  async findAll() {
    const rows = await this.db.select().from(catalogPdf).orderBy(desc(catalogPdf.id)).limit(50);
    return (rows || []).map(formatCatalogPdf);
  }

  async findByArtisan(artisanId: bigint) {
    const rows = await this.db
      .select()
      .from(catalogPdf)
      .where(eq(catalogPdf.artisanId, Number(artisanId)))
      .orderBy(desc(catalogPdf.id));
    // No fallback: an artisan with no PDFs gets an empty list. The previous
    // fallback returned other artisans' catalog PDFs (download URLs included).
    return rows.map(formatCatalogPdf);
  }

  async create(artisanId: bigint, body?: any) {
    const now = Date.now();
    const [inserted] = await this.db
      .insert(catalogPdf)
      .values({
        artisanId: Number(artisanId),
        requestedById: 1,
        status: "READY",
        downloadUrl: `https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/catalog-pdf/artisan/${artisanId}/${now}/artisan_catalog_${artisanId}_${now}.pdf`,
        s3Key: `catalog-pdf/artisan/${artisanId}/${now}/artisan_catalog_${artisanId}_${now}.pdf`,
        fileName: `artisan_catalog_${artisanId}_${now}.pdf`,
        requestedAt: now,
        completedAt: now + 5000,
        failureMessage: "",
        restartRecoveryRequired: false,
        compressedDownloadUrl: `https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/catalog-pdf/artisan/${artisanId}/${now}/compressed/artisan_catalog_compressed_${artisanId}_${now}.pdf`,
        compressedS3Key: `catalog-pdf/artisan/${artisanId}/${now}/compressed/artisan_catalog_compressed_${artisanId}_${now}.pdf`,
        compressedFileName: `artisan_catalog_compressed_${artisanId}_${now}.pdf`,
        compressedFailureMessage: "",
        compressedAttemptCount: 0,
      })
      .returning();
    return formatCatalogPdf(inserted);
  }
}
