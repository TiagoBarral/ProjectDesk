import { describe, expect, it } from "vitest";
import {
  cacheState,
  getPendingSyncScope,
  hasPendingSync,
  loadState,
  mergeStateByUpdatedAt,
  normalizeData,
} from "./storage.js";

const projectId = "11111111-1111-4111-8111-111111111111";
const taskId = "22222222-2222-4222-8222-222222222222";
const subtaskId = "33333333-3333-4333-8333-333333333333";
const fileId = "44444444-4444-4444-8444-444444444444";

describe("storage transforms", () => {
  it("normalizes duplicate project slugs while preserving deleted rows", () => {
    const normalized = normalizeData({
      projects: [
        { id: projectId, slug: "launch", name: "Launch", tasks: [], files: [] },
        {
          id: "55555555-5555-4555-8555-555555555555",
          slug: "launch",
          name: "Launch Copy",
          tasks: [],
          files: [],
        },
        {
          id: "66666666-6666-4666-8666-666666666666",
          slug: "launch",
          name: "Deleted Launch",
          deleted_at: "2026-01-01T00:00:00.000Z",
          tasks: [],
          files: [],
        },
      ],
    });

    expect(normalized.projects.map((project) => project.slug)).toEqual([
      "launch",
      "launch-2",
      "launch",
    ]);
    expect(normalized.projects[2].deleted_at).toBe("2026-01-01T00:00:00.000Z");
  });

  it("collects pending sync scope across projects, tasks, subtasks, and files", () => {
    const scope = getPendingSyncScope({
      projects: [
        {
          id: projectId,
          name: "Project",
          sync_pending: true,
          files: [{ id: fileId, name: "Spec", sync_pending: true }],
          tasks: [
            {
              id: taskId,
              title: "Task",
              sync_pending: true,
              subtasks: [
                { id: subtaskId, text: "Subtask", sync_pending: true },
              ],
            },
          ],
        },
      ],
    });

    expect(scope).toEqual({
      projects: [projectId],
      tasks: [taskId],
      subtasks: [subtaskId],
      files: [fileId],
    });
    expect(hasPendingSync(scope)).toBe(true);
    expect(
      hasPendingSync({ projects: [], tasks: [], subtasks: [], files: [] }),
    ).toBe(false);
  });

  it("keeps newer pending local deletions over older remote rows", () => {
    const merged = mergeStateByUpdatedAt(
      {
        projects: [
          {
            id: projectId,
            name: "Project",
            updated_at: "2026-01-02T00:00:00.000Z",
            files: [],
            tasks: [
              {
                id: taskId,
                title: "Deleted locally",
                updated_at: "2026-01-03T00:00:00.000Z",
                deleted_at: "2026-01-03T00:00:00.000Z",
                sync_pending: true,
                subtasks: [],
              },
            ],
          },
        ],
      },
      {
        projects: [
          {
            id: projectId,
            name: "Project",
            updated_at: "2026-01-02T00:00:00.000Z",
            files: [],
            tasks: [
              {
                id: taskId,
                title: "Older remote task",
                updated_at: "2026-01-02T00:00:00.000Z",
                deleted_at: null,
                sync_pending: false,
                subtasks: [],
              },
            ],
          },
        ],
      },
    );

    const task = merged.projects[0].tasks[0];
    expect(task.title).toBe("Deleted locally");
    expect(task.deleted_at).toBe("2026-01-03T00:00:00.000Z");
    expect(task.sync_pending).toBe(true);
  });

  it("uses newer remote rows and clears sync flags when local edits are stale", () => {
    const merged = mergeStateByUpdatedAt(
      {
        projects: [
          {
            id: projectId,
            name: "Local name",
            updated_at: "2026-01-01T00:00:00.000Z",
            sync_pending: true,
            files: [],
            tasks: [],
          },
        ],
      },
      {
        projects: [
          {
            id: projectId,
            name: "Remote name",
            updated_at: "2026-01-02T00:00:00.000Z",
            sync_pending: false,
            files: [],
            tasks: [],
          },
        ],
      },
    );

    expect(merged.projects[0].name).toBe("Remote name");
    expect(merged.projects[0].sync_pending).toBe(false);
  });

  it("keeps authenticated local cache separate from the legacy anonymous cache", async () => {
    const values = new Map();
    globalThis.window = {
      localStorage: {
        getItem: (key) => values.get(key) || null,
        setItem: (key, value) => values.set(key, value),
      },
    };

    cacheState({
      projects: [{ id: projectId, name: "Legacy", files: [], tasks: [] }],
    });
    cacheState(
      {
        projects: [
          { id: projectId, name: "User scoped", files: [], tasks: [] },
        ],
      },
      { userId: "user-1" },
    );

    expect((await loadState()).projects[0].name).toBe("Legacy");
    expect((await loadState({ userId: "user-1" })).projects[0].name).toBe(
      "User scoped",
    );
  });

  it("keeps workspace cache separate while falling back to user cache", async () => {
    const values = new Map();
    globalThis.window = {
      localStorage: {
        getItem: (key) => values.get(key) || null,
        setItem: (key, value) => values.set(key, value),
      },
    };

    cacheState(
      {
        projects: [
          { id: projectId, name: "User fallback", files: [], tasks: [] },
        ],
      },
      { userId: "user-1" },
    );
    cacheState(
      {
        projects: [
          { id: projectId, name: "Workspace scoped", files: [], tasks: [] },
        ],
      },
      { userId: "user-1", workspaceId: "workspace-1" },
    );

    expect(
      (await loadState({ userId: "user-1", workspaceId: "workspace-1" }))
        .projects[0].name,
    ).toBe("Workspace scoped");
    expect(
      (await loadState({ userId: "user-1", workspaceId: "workspace-2" }))
        .projects[0].name,
    ).toBe("User fallback");
  });
});
