import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();
const capturedPaths: string[] = [];

vi.mock("@/lib/firebase-services", () => ({
  database: {},
  auth: { currentUser: { displayName: "Test Admin" } },
  storage: {},
}));

vi.mock("firebase/database", () => ({
  ref: (_db: unknown, path: string) => {
    capturedPaths.push(path);
    return { path };
  },
  get: (...args: unknown[]) => mockGet(...args),
  set: vi.fn(),
  update: (...args: unknown[]) => mockUpdate(...args),
  remove: (...args: unknown[]) => mockRemove(...args),
  push: vi.fn(),
  query: vi.fn(),
  orderByChild: vi.fn(),
  limitToLast: vi.fn(),
  startAt: vi.fn(),
  endAt: vi.fn(),
  serverTimestamp: () => "SERVER_TS",
}));

vi.mock("firebase/storage", () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));

import {
  adminGetAllRequests,
  adminUpdateRequestStatus,
  adminDeleteRequest,
} from "./adminService";

describe("adminService chargingRequests nested paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedPaths.length = 0;
  });

  it("adminGetAllRequests reads nested chargingRequests/{userId}/{requestId}", async () => {
    const nested = {
      riderUid123: {
        reqAbc: {
          spotId: "spot-1",
          userId: "riderUid123",
          userName: "Rider",
          userPhone: "999",
          userEmail: "rider@test.com",
          duration: 60,
          status: "pending",
          requestedAt: 1_700_000_000_000,
          requestedTime: 1_700_000_360_000,
        },
      },
    };

    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => nested,
    });

    const requests = await adminGetAllRequests();

    expect(capturedPaths).toContain("chargingRequests");
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      id: "reqAbc",
      userId: "riderUid123",
      spotId: "spot-1",
      status: "pending",
    });
  });

  it("adminUpdateRequestStatus writes to chargingRequests/{userId}/{requestId}", async () => {
    mockUpdate.mockResolvedValue(undefined);

    await adminUpdateRequestStatus("riderUid123", "reqAbc", "approved", "Approved!");

    expect(capturedPaths).toContain("chargingRequests/riderUid123/reqAbc");
    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(mockUpdate.mock.calls[0][1]).toMatchObject({
      status: "approved",
      response: { text: "Approved!" },
    });
  });

  it("adminDeleteRequest removes chargingRequests/{userId}/{requestId}", async () => {
    mockRemove.mockResolvedValue(undefined);

    await adminDeleteRequest("riderUid123", "reqAbc");

    expect(capturedPaths).toContain("chargingRequests/riderUid123/reqAbc");
    expect(mockRemove).toHaveBeenCalledOnce();
  });
});
