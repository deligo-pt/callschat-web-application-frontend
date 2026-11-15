import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "../api.client";
import { UserService } from "../user.service";

describe("UserService - Account Deletion & Reactivation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches account deletion status via GET /user/account/deletion-status", async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          isScheduledForDeletion: true,
          status: "SCHEDULED_FOR_DELETION",
          deletionScheduledAt: "2026-12-15T00:00:00.000Z",
          daysRemaining: 29,
        },
      },
    };

    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockResponse as any);

    const result = await UserService.getAccountDeletionStatus();

    expect(getSpy).toHaveBeenCalledWith("/user/account/deletion-status");
    expect(result.success).toBe(true);
    expect(result.data.isScheduledForDeletion).toBe(true);
    expect(result.data.daysRemaining).toBe(29);
  });

  it("schedules account deletion via DELETE /user/account with payload", async () => {
    const payload = {
      reason: "Switching platforms",
      confirmation: "DELETE",
    };

    const mockResponse = {
      data: {
        success: true,
        message: "Account scheduled for deletion.",
        data: {
          status: "SCHEDULED_FOR_DELETION",
          deletionScheduledAt: "2026-12-15T00:00:00.000Z",
          gracePeriodDays: 30,
        },
      },
    };

    const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValueOnce(mockResponse as any);

    const result = await UserService.deleteAccount(payload);

    expect(deleteSpy).toHaveBeenCalledWith("/user/account", { data: payload });
    expect(result.success).toBe(true);
    expect(result.data.status).toBe("SCHEDULED_FOR_DELETION");
    expect(result.data.gracePeriodDays).toBe(30);
  });

  it("reactivates account via POST /user/account/reactivate", async () => {
    const mockResponse = {
      data: {
        success: true,
        message: "Account reactivated successfully.",
        data: {
          id: "user-123",
          status: "ACTIVE",
          accountType: "PERSONAL",
        },
      },
    };

    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockResponse as any);

    const result = await UserService.reactivateAccount();

    expect(postSpy).toHaveBeenCalledWith("/user/account/reactivate");
    expect(result.success).toBe(true);
    expect(result.data.status).toBe("ACTIVE");
  });
});
