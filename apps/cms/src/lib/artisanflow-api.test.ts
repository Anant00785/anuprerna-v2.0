/**
 * artisanflow-api.ts is the single data boundary for the whole /artisanflow/*
 * corner (2,087 lines, ~40 exported functions) and the widest blast radius of
 * the eight *-api.ts modules — but it is also the one whose behaviour is least
 * obvious from its call sites, because almost every fetcher SWALLOWS a failure
 * into `[]` / `null` and re-throws only the systemic ones.
 *
 * So these tests are about the decisions, not the plumbing:
 *
 *   1. the swallow is asymmetric ON PURPOSE — a systemic failure (network,
 *      auth, 5xx, isolated) and a `{success:false}` rejection propagate so a
 *      page shows a banner; a 200 with no matching row degrades quietly,
 *      because "no rows" is a real answer,
 *   2. getWorkflowFeedbackList is the ONE documented exception and swallows
 *      everything,
 *   3. the merge/dedupe of the two workflow-list endpoints keys on
 *      (workflowType, id) — an id-only key silently drops custom-order jobs,
 *   4. the money and date arithmetic the board renders.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server, useHandlers, envelope, errorEnvelope } from "@/test/msw";
import {
  BackendFetchError,
  computeCustomOrderMoney,
  computeStepWindow,
  customItemName,
  customItemSku,
  fulfilledQty,
  getCustomOrderDetail,
  getCustomOrderList,
  getWorkflow,
  getWorkflowCommentCounts,
  getWorkflowFeedbackList,
  getWorkflowFeedbackQueue,
  getWorkflowList,
  getWorkflowTemplateList,
  nodeDelay,
  orderWorkflowSteps,
  readyQty,
  workflowDelaySummary,
  workflowSchedule,
} from "./artisanflow-api";
import type {
  CustomOrderDetail,
  CustomOrderFulfillment,
  CustomOrderItem,
  CustomOrderReady,
  WorkflowStep,
} from "./artisanflow-api";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 0, 15);

afterEach(() => vi.restoreAllMocks());

// ── 1. The swallow is asymmetric ────────────────────────────────────────────

describe("artisanflow-api — what propagates and what degrades", () => {
  it("returns the rows on a good envelope", async () => {
    useHandlers(
      http.get("*/get/super-user/custom-order-list", () =>
        HttpResponse.json(envelope("orderList", [{ id: 7 }])),
      ),
    );

    await expect(getCustomOrderList({})).resolves.toEqual([{ id: 7 }]);
  });

  it("sends the paging contract the endpoint expects, with the documented defaults", async () => {
    let url = "";
    useHandlers(
      http.get("*/get/super-user/custom-order-list", ({ request }) => {
        url = request.url;
        return HttpResponse.json(envelope("orderList", []));
      }),
    );

    await getCustomOrderList({ orderType: "WHOLESALE", tenantId: 49113 });

    const q = new URL(url).searchParams;
    expect(q.get("pageNumber")).toBe("0");
    expect(q.get("pageSize")).toBe("300");
    expect(q.get("orderType")).toBe("WHOLESALE");
    expect(q.get("tenantId")).toBe("49113");
  });

  it("omits orderType and tenantId entirely when unset, rather than sending 'undefined'", async () => {
    let url = "";
    useHandlers(
      http.get("*/get/super-user/custom-order-list", ({ request }) => {
        url = request.url;
        return HttpResponse.json(envelope("orderList", []));
      }),
    );

    await getCustomOrderList({});

    const q = new URL(url).searchParams;
    expect(q.has("orderType")).toBe(false);
    expect(q.has("tenantId")).toBe(false);
  });

  it("PROPAGATES a {success:false} rejection instead of rendering it as an empty order list", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(
      http.get("*/get/super-user/custom-order-list", () =>
        HttpResponse.json(errorEnvelope("tenant not permitted")),
      ),
    );

    await expect(getCustomOrderList({})).rejects.toMatchObject({
      kind: "rejected",
      message: expect.stringContaining("tenant not permitted"),
    });
  });

  it("PROPAGATES a 401 as an auth fault, so a token mismatch is not read as 'no templates'", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(http.get("*/get/workflow-template-list", () => new HttpResponse(null, { status: 401 })));

    await expect(getWorkflowTemplateList()).rejects.toMatchObject({ kind: "auth", status: 401 });
  });

  it("PROPAGATES a 500 as a server fault", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(http.get("*/get/workflow-template-list", () => new HttpResponse(null, { status: 500 })));

    await expect(getWorkflowTemplateList()).rejects.toMatchObject({ kind: "server" });
  });

  it("PROPAGATES a 503 as 'isolated' — outdated backend code, not a business answer", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(http.get("*/get/workflow-template-list", () => new HttpResponse(null, { status: 503 })));

    await expect(getWorkflowTemplateList()).rejects.toMatchObject({ kind: "isolated" });
  });

  it("PROPAGATES an unreachable backend as a network fault", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(http.get("*/get/workflow-template-list", () => HttpResponse.error()));

    await expect(getWorkflowTemplateList()).rejects.toMatchObject({ kind: "network" });
  });

  it("DEGRADES a 200 with no matching row to null — 'this record does not exist' is not an error", async () => {
    useHandlers(
      http.get("*/get/super-user/custom-order/:id", () =>
        HttpResponse.json({ success: true, message: "" }),
      ),
    );

    await expect(getCustomOrderDetail(404)).resolves.toBeNull();
  });

  it("keeps 'refused' distinguishable from 'not found' on the same detail read", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(
      http.get("*/get/workflow/:id", () => HttpResponse.json(errorEnvelope("workflow archived"))),
    );

    await expect(getWorkflow(9)).rejects.toBeInstanceOf(BackendFetchError);
  });

  it("falls back to the first array on the envelope when the named key is absent", async () => {
    // pickArray's documented best-effort behaviour: the backend has renamed
    // list keys before, and a rename must not empty the screen.
    useHandlers(
      http.get("*/get/super-user/custom-order-list", () =>
        HttpResponse.json({ success: true, message: "", someRenamedList: [{ id: 3 }] }),
      ),
    );

    await expect(getCustomOrderList({})).resolves.toEqual([{ id: 3 }]);
  });
});

// ── 2. The one documented exception ─────────────────────────────────────────

describe("getWorkflowFeedbackList — the documented always-401 route", () => {
  it("swallows an auth failure so the board degrades to 'no pending feedback'", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(http.get("*/get/element/feedback", () => new HttpResponse(null, { status: 401 })));

    await expect(getWorkflowFeedbackList("PENDING")).resolves.toEqual([]);
  });

  it("PINNED: it also swallows a rejection and a 500, which its sibling queue does NOT", async () => {
    // The bare `catch {}` is wider than the comment above it claims (it names
    // only the expected 401). Recorded rather than narrowed, because narrowing
    // it changes what the board shows on a real outage — a product decision.
    // See docs/KNOWN-GAPS.md.
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(http.get("*/get/element/feedback", () => new HttpResponse(null, { status: 500 })));
    await expect(getWorkflowFeedbackList("PENDING")).resolves.toEqual([]);

    useHandlers(http.get("*/get/element/feedback", () => HttpResponse.json(errorEnvelope("nope"))));
    await expect(getWorkflowFeedbackList("PENDING")).resolves.toEqual([]);
  });

  it("the review queue, by contrast, propagates a 500 rather than showing an empty review list", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(
      http.get("*/get/element-feedback/queue", () => new HttpResponse(null, { status: 500 })),
    );

    await expect(getWorkflowFeedbackQueue("PENDING")).rejects.toBeInstanceOf(BackendFetchError);
  });

  it("the queue keeps every status count present even when the backend sends a partial map", async () => {
    // The tab badges read these; a missing key must render 0, not undefined.
    useHandlers(
      http.get("*/get/element-feedback/queue", () =>
        HttpResponse.json({
          success: true,
          message: "",
          elementFeedbackList: [{ id: 1 }],
          elementFeedbackCounts: { PENDING: 4 },
        }),
      ),
    );

    await expect(getWorkflowFeedbackQueue("PENDING")).resolves.toMatchObject({
      counts: { PENDING: 4, APPROVED: 0, REJECTED: 0 },
    });
  });
});

// ── 3. The two-endpoint merge ───────────────────────────────────────────────

describe("getWorkflowList — merging the standard and custom job endpoints", () => {
  function lists(std: unknown[], cust: unknown[]) {
    server.use(
      http.get("*/get/workflow-list/:status", () =>
        HttpResponse.json(envelope("workflowList", std)),
      ),
      http.get("*/get/custom-workflow-list/:status", () =>
        HttpResponse.json(envelope("workflowList", cust)),
      ),
    );
  }

  it("returns jobs from BOTH endpoints — the production board needs standard and custom", async () => {
    lists([{ id: 1, workflowType: "ORDER" }], [{ id: 2, workflowType: "CUSTOM_ORDER" }]);

    await expect(getWorkflowList("INITIATED")).resolves.toHaveLength(2);
  });

  it("keeps a CUSTOM_ORDER job whose id collides with an ORDER job — the two id sequences are independent", async () => {
    // An id-only dedupe key drops this row, and because std is spread first it
    // is always the custom-order job that disappears.
    lists([{ id: 500, workflowType: "ORDER" }], [{ id: 500, workflowType: "CUSTOM_ORDER" }]);

    const out = await getWorkflowList("INITIATED");

    expect(out.map((w) => w.workflowType)).toEqual(["ORDER", "CUSTOM_ORDER"]);
  });

  it("still dedupes a genuine repeat of the same (type, id)", async () => {
    lists([{ id: 7, workflowType: "ORDER" }], [{ id: 7, workflowType: "ORDER" }]);

    await expect(getWorkflowList("INITIATED")).resolves.toHaveLength(1);
  });

  it("fails the whole read when only the CUSTOM endpoint answers a 200-with-rejection", async () => {
    // rethrowIfSystemic re-throws kind:"rejected" too, so a half-refused board
    // becomes a banner rather than a silently short list. That is the right
    // call here: the two endpoints feed ONE board, and showing the standard
    // jobs alone would read as "these are all the jobs".
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(
      http.get("*/get/workflow-list/:status", () =>
        HttpResponse.json(envelope("workflowList", [{ id: 1, workflowType: "ORDER" }])),
      ),
      http.get("*/get/custom-workflow-list/:status", () =>
        HttpResponse.json(errorEnvelope("custom workflows unavailable")),
      ),
    );

    await expect(getWorkflowList("INITIATED")).rejects.toMatchObject({ kind: "rejected" });
  });

  it("propagates a systemic failure from either endpoint rather than half-rendering the board", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(
      http.get("*/get/workflow-list/:status", () =>
        HttpResponse.json(envelope("workflowList", [{ id: 1, workflowType: "ORDER" }])),
      ),
      http.get("*/get/custom-workflow-list/:status", () => new HttpResponse(null, { status: 500 })),
    );

    await expect(getWorkflowList("INITIATED")).rejects.toBeInstanceOf(BackendFetchError);
  });
});

describe("getWorkflowCommentCounts", () => {
  it("makes no request at all for an empty id list", async () => {
    // MSW runs with onUnhandledRequest:"error", so a stray fetch fails here.
    await expect(getWorkflowCommentCounts([])).resolves.toEqual({});
  });

  it("re-keys the backend's string keys to numbers so a badge lookup by id works", async () => {
    useHandlers(
      http.get("*/get/workflow-comment-counts", () =>
        HttpResponse.json({ success: true, message: "", counts: { "12": 3, "13": 0 } }),
      ),
    );

    await expect(getWorkflowCommentCounts([12, 13])).resolves.toEqual({ 12: 3, 13: 0 });
  });
});

// ── 4. The arithmetic the board renders ─────────────────────────────────────

function step(over: Partial<WorkflowStep>): WorkflowStep {
  return { id: 1, name: "Step", ...over } as WorkflowStep;
}

describe("computeStepWindow", () => {
  it("takes the earliest start and latest end across a job's steps", () => {
    expect(
      computeStepWindow([
        step({ id: 1, estimatedStartDate: 300, estimatedEndDate: 400 }),
        step({ id: 2, estimatedStartDate: 100, estimatedEndDate: 900 }),
      ]),
    ).toEqual({ from: 100, to: 900 });
  });

  it("ignores deleted steps", () => {
    expect(
      computeStepWindow([
        step({ id: 1, estimatedStartDate: 100, estimatedEndDate: 900, deleted: true }),
        step({ id: 2, estimatedStartDate: 300, estimatedEndDate: 400 }),
      ]),
    ).toEqual({ from: 300, to: 400 });
  });

  it("returns null rather than epoch 0 when no step carries a real date", () => {
    // The order-level fields are all epoch 0 in this dataset; coercing would
    // render "1 Jan 1970" as a delivery date.
    expect(computeStepWindow([step({ estimatedStartDate: 0, estimatedEndDate: 0 })])).toEqual({
      from: null,
      to: null,
    });
    expect(computeStepWindow([])).toEqual({ from: null, to: null });
  });
});

describe("computeCustomOrderMoney", () => {
  const base = {
    subTotal: 1000,
    total: 1000,
    currency: "INR",
    adjustments: [],
  } as unknown as CustomOrderDetail;

  it("ADDS adjustmentType 1 and SUBTRACTS everything else", () => {
    const money = computeCustomOrderMoney({
      ...base,
      adjustments: [
        { particular: "Shipping", adjustmentType: 1, adjustmentAmount: 200 },
        { particular: "Coupon", adjustmentType: 2, adjustmentAmount: 50 },
      ],
    } as unknown as CustomOrderDetail);

    expect(money.adjustedTotal).toBe(1150);
  });

  it("reports a wholesale discount as the loyalty figure and HIDES it from the visible line items", () => {
    const money = computeCustomOrderMoney({
      ...base,
      adjustments: [
        { particular: "Wholesale Discount", adjustmentType: 2, adjustmentAmount: 250 },
        { particular: "Shipping", adjustmentType: 1, adjustmentAmount: 100 },
      ],
    } as unknown as CustomOrderDetail);

    expect(money.loyaltyDiscountAmount).toBe(250);
    expect(money.loyaltyDiscountPct).toBe(25);
    expect(money.visibleAdjustments.map((a) => a.particular)).toEqual(["Shipping"]);
    // Still subtracted from the total — hidden from the list, not from the maths.
    expect(money.adjustedTotal).toBe(850);
  });

  it("matches the wholesale line case-insensitively and ignores surrounding whitespace", () => {
    const money = computeCustomOrderMoney({
      ...base,
      adjustments: [{ particular: "  wholesale discount ", adjustmentType: 2, adjustmentAmount: 100 }],
    } as unknown as CustomOrderDetail);

    expect(money.loyaltyDiscountAmount).toBe(100);
    expect(money.visibleAdjustments).toEqual([]);
  });

  it("does not divide by zero when the order has no subtotal", () => {
    const money = computeCustomOrderMoney({
      ...base,
      subTotal: 0,
      adjustments: [{ particular: "Wholesale Discount", adjustmentType: 2, adjustmentAmount: 10 }],
    } as unknown as CustomOrderDetail);

    expect(money.loyaltyDiscountPct).toBe(0);
  });

  it("leaves the total untouched when there are no adjustments", () => {
    expect(computeCustomOrderMoney(base)).toMatchObject({ adjustedTotal: 1000, loyaltyDiscountPct: 0 });
  });
});

describe("fulfilledQty / readyQty", () => {
  const fulfillments = [
    { customOrderItemFulfillmentList: [{ customOrderItemId: 1, quantity: 2 }] },
    {
      customOrderItemFulfillmentList: [
        { customOrderItemId: 1, quantity: 3 },
        { customOrderItemId: 2, quantity: 9 },
      ],
    },
  ] as unknown as CustomOrderFulfillment[];

  it("sums one item's quantity ACROSS every fulfillment record, not just the first", () => {
    expect(fulfilledQty(1, fulfillments)).toBe(5);
  });

  it("does not leak another item's quantity into the total", () => {
    expect(fulfilledQty(2, fulfillments)).toBe(9);
    expect(fulfilledQty(3, fulfillments)).toBe(0);
  });

  it("tolerates a record with no nested list", () => {
    expect(fulfilledQty(1, [{}] as unknown as CustomOrderFulfillment[])).toBe(0);
  });

  it("readyQty sums the ready records the same way", () => {
    const readies = [
      { customOrderItemReadyList: [{ customOrderItemId: 4, quantity: 1 }] },
      { customOrderItemReadyList: [{ customOrderItemId: 4, quantity: 6 }] },
    ] as unknown as CustomOrderReady[];

    expect(readyQty(4, readies)).toBe(7);
  });
});

describe("customItemName / customItemSku", () => {
  it("reads a fabric item from the fabric product preview", () => {
    const item = {
      id: 1,
      productGroup: "fabric",
      customization: { fabricProductPreview: { product: { name: "Ikat", sku: "IK-1" } } },
    } as unknown as CustomOrderItem;

    expect(customItemName(item)).toBe("Ikat");
    expect(customItemSku(item)).toBe("IK-1");
  });

  it("prefers the custom product for a non-fabric item, falling back to the finished preview", () => {
    const withCustom = {
      id: 2,
      productGroup: "finished",
      customization: {
        customProduct: { name: "Bespoke Stole", sku: "BS-1" },
        finishedProductPreview: { product: { name: "Stole", sku: "ST-1" } },
      },
    } as unknown as CustomOrderItem;
    expect(customItemName(withCustom)).toBe("Bespoke Stole");

    const withoutCustom = {
      id: 3,
      productGroup: "finished",
      customization: { finishedProductPreview: { product: { name: "Stole", sku: "ST-1" } } },
    } as unknown as CustomOrderItem;
    expect(customItemName(withoutCustom)).toBe("Stole");
  });

  it("falls back to the item id rather than rendering a blank row", () => {
    expect(customItemName({ id: 88 } as unknown as CustomOrderItem)).toBe("Item #88");
    expect(customItemSku({ id: 88 } as unknown as CustomOrderItem)).toBe("");
  });
});

describe("nodeDelay", () => {
  it("calls a completed node on time when it finished before its planned end", () => {
    expect(
      nodeDelay({ status: "COMPLETED", estimatedEndDate: NOW, actualEndDate: NOW - DAY }, NOW),
    ).toMatchObject({ state: "done", days: 0 });
  });

  it("reports how many days a completed node overran by", () => {
    expect(
      nodeDelay({ status: "COMPLETED", estimatedEndDate: NOW - 3 * DAY, actualEndDate: NOW }, NOW),
    ).toMatchObject({ state: "late-done", days: 3, label: "Finished 3d late" });
  });

  it("derives a completed node's plan end from start + estimatedDays when it has no plan date", () => {
    expect(
      nodeDelay(
        {
          status: "COMPLETED",
          estimatedDays: 2,
          actualStartDate: NOW - 5 * DAY,
          actualEndDate: NOW,
        },
        NOW,
      ),
    ).toMatchObject({ state: "late-done", days: 3 });
  });

  it("reports an incomplete node past its due date as overdue", () => {
    expect(nodeDelay({ status: "CREATED", estimatedEndDate: NOW - 2 * DAY }, NOW)).toMatchObject({
      state: "overdue",
      days: 2,
      label: "2d late",
    });
  });

  it("measures an IN_PROGRESS node from when it actually started, not from the plan date", () => {
    // Started 10 days ago on a 2-day estimate: 8 days late, even though the
    // plan said it had until next week.
    expect(
      nodeDelay(
        {
          status: "IN_PROGRESS",
          estimatedDays: 2,
          actualStartDate: NOW - 10 * DAY,
          estimatedEndDate: NOW + 7 * DAY,
        },
        NOW,
      ),
    ).toMatchObject({ state: "overdue", days: 8 });
  });

  it("flags the three-day window as due-soon and anything beyond it as on-track", () => {
    expect(nodeDelay({ estimatedEndDate: NOW + 3 * DAY }, NOW)).toMatchObject({
      state: "due-soon",
      days: 3,
    });
    expect(nodeDelay({ estimatedEndDate: NOW + 4 * DAY }, NOW)).toMatchObject({ state: "on-track" });
  });

  it("says 'pending' with no label when a node carries no date to judge it by", () => {
    expect(nodeDelay({ status: "CREATED" }, NOW)).toEqual({ state: "pending", days: 0, label: "" });
  });
});

describe("workflowDelaySummary", () => {
  it("names the WORST overdue leaf as the bottleneck, not merely the first", () => {
    const summary = workflowDelaySummary(
      [
        step({ id: 1, name: "Dyeing", estimatedEndDate: NOW - 2 * DAY }),
        step({ id: 2, name: "Weaving", estimatedEndDate: NOW - 9 * DAY }),
      ],
      NOW,
    );

    expect(summary).toMatchObject({
      onTrack: false,
      overdueCount: 2,
      behindDays: 9,
      bottleneck: "Weaving",
    });
  });

  it("descends to subprocesses and names the leaf with its parent step", () => {
    const summary = workflowDelaySummary(
      [
        step({
          id: 1,
          name: "Weaving",
          subProcesses: [{ id: 10, name: "Warping", estimatedEndDate: NOW - 4 * DAY }],
        }),
      ],
      NOW,
    );

    expect(summary.bottleneck).toBe("Weaving › Warping");
    // The parent itself is NOT counted as well — that would double-count the job.
    expect(summary.overdueCount).toBe(1);
  });

  it("skips deleted steps and deleted subprocesses", () => {
    expect(
      workflowDelaySummary(
        [step({ id: 1, name: "Gone", estimatedEndDate: NOW - 9 * DAY, deleted: true })],
        NOW,
      ),
    ).toMatchObject({ onTrack: true, overdueCount: 0 });
  });

  it("is on track with a next-due label when nothing has slipped", () => {
    const summary = workflowDelaySummary(
      [
        step({ id: 1, name: "Dyeing", estimatedEndDate: NOW + 2 * DAY }),
        step({ id: 2, name: "Weaving", estimatedEndDate: NOW + 20 * DAY }),
      ],
      NOW,
    );

    expect(summary.onTrack).toBe(true);
    expect(summary.dueSoonCount).toBe(1);
    expect(summary.nextDueLabel).toBe("Dyeing · due in 2d");
  });
});

describe("workflowSchedule", () => {
  const noDelay = { onTrack: true, behindDays: 0, overdueCount: 0, dueSoonCount: 0 };

  it("projects a slipped completion date from the worst stage delay", () => {
    const sched = workflowSchedule(
      { estimatedStartDate: NOW - 10 * DAY, estimatedEndDate: NOW + 5 * DAY },
      { ...noDelay, onTrack: false, behindDays: 4, overdueCount: 1 },
      NOW,
    );

    expect(sched).toMatchObject({ lateDays: 4, onSchedule: false, done: false });
    expect(sched.projectedEnd).toBe(NOW + 9 * DAY);
  });

  it("counts the delivery window itself being blown even when every stage looks fine", () => {
    const sched = workflowSchedule({ estimatedEndDate: NOW - 6 * DAY }, noDelay, NOW);

    expect(sched).toMatchObject({ lateDays: 6, onSchedule: false });
  });

  it("uses the LATEST actual completion across steps and subprocesses for a finished job", () => {
    const sched = workflowSchedule(
      {
        status: "COMPLETED",
        estimatedEndDate: NOW - 5 * DAY,
        steps: [
          step({ id: 1, actualEndDate: NOW - 4 * DAY }),
          step({ id: 2, subProcesses: [{ id: 9, name: "Warping", actualEndDate: NOW - DAY }] }),
        ] as WorkflowStep[],
      },
      noDelay,
      NOW,
    );

    expect(sched).toMatchObject({ done: true, actualEnd: NOW - DAY, lateDays: 4 });
  });

  it("reports a finished job delivered inside its window as on schedule", () => {
    expect(
      workflowSchedule(
        {
          status: "COMPLETED",
          estimatedEndDate: NOW,
          steps: [step({ id: 1, actualEndDate: NOW - 2 * DAY })] as WorkflowStep[],
        },
        noDelay,
        NOW,
      ),
    ).toMatchObject({ done: true, lateDays: 0, onSchedule: true });
  });
});

describe("orderWorkflowSteps", () => {
  const chained = [
    step({ id: 3, name: "Finishing", element: { elementId: "C" }, previousStepId: "B" }),
    step({ id: 1, name: "Processing", element: { elementId: "A" }, nextStepId: "B" }),
    step({ id: 2, name: "Weaving", element: { elementId: "B" }, previousStepId: "A", nextStepId: "C" }),
  ] as WorkflowStep[];

  it("puts steps in TEMPLATE order, which the backend does not return them in", () => {
    expect(orderWorkflowSteps(chained).map((s) => s.name)).toEqual([
      "Processing",
      "Weaving",
      "Finishing",
    ]);
  });

  it("falls back to id order on a broken chain rather than dropping steps", () => {
    const broken = [
      step({ id: 2, name: "B", element: { elementId: "B" }, previousStepId: "A" }),
      step({ id: 1, name: "A", element: { elementId: "A" }, previousStepId: "Z" }),
    ] as WorkflowStep[];

    expect(orderWorkflowSteps(broken).map((s) => s.name)).toEqual(["A", "B"]);
  });

  it("tolerates an empty or absent step list", () => {
    expect(orderWorkflowSteps([])).toEqual([]);
    expect(orderWorkflowSteps(undefined as unknown as WorkflowStep[])).toEqual([]);
  });
});
