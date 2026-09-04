import { describe, it, expect, vi } from "vitest";
import { WorkflowRepository } from "./workflow.repository.js";
import type { Database } from "../../../database/database.module.js";

/**
 * Loom reads templates through `findAllByDeletedFalse()` and
 * `findByIdAndDeletedFalse(id)` (WorkflowTemplateRepository:106, :90). Ours
 * selected every row.
 *
 * That was harmless only while workflow_template was empty. The table has since
 * been restored from the legacy export — 14 rows, of which 4 are soft-deleted
 * scratch work ('Fabric Test Template', 'fabric test 2', 'Fabric Dye',
 * 'dfdfdfdd'). Without the filter those appear in the CMS "Start production"
 * picker as if they were real production workflows, and someone eventually
 * starts a job on one.
 */
function captureWhere() {
  const calls: unknown[] = [];
  const db = {
    select: () => ({
      from: () => ({
        where: (w: unknown) => {
          calls.push(w);
          return Promise.resolve([]);
        },
      }),
    }),
  };
  return { db, calls };
}

describe("workflow template reads exclude soft-deleted rows", () => {
  it("getWorkflowTemplates filters instead of selecting every row", async () => {
    const { db, calls } = captureWhere();
    const repo = new WorkflowRepository(db as unknown as Database);
    await repo.getWorkflowTemplates();
    // The old implementation had no .where() at all.
    expect(calls).toHaveLength(1);
    expect(calls[0]).toBeDefined();
  });

  it("getWorkflowTemplateById also filters, matching findByIdAndDeletedFalse", async () => {
    const { db, calls } = captureWhere();
    const repo = new WorkflowRepository(db as unknown as Database);
    await repo.getWorkflowTemplateById(490267);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toBeDefined();
  });

  it("a deleted id resolves to null rather than the row", async () => {
    const db = {
      select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
    };
    const repo = new WorkflowRepository(db as unknown as Database);
    // 117639482 is 'dfdfdfdd', deleted=true in the restored data.
    await expect(repo.getWorkflowTemplateById(117639482)).resolves.toBeNull();
  });
});
