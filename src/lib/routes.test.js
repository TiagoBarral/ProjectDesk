import { describe, expect, it } from "vitest";
import {
  parseRoutePath,
  projectPath,
  projectRouteKey,
  resolveProjectByRouteParam,
  routePath,
  slugify,
  uniqueProjectSlug,
} from "./routes.js";

const projects = [
  { id: "project-id-1", slug: "saved-slug", name: "Saved Name" },
  { id: "project-id-2", name: "Café Launch" },
  { id: "legacy-id", slug: "", name: "" },
];

describe("route helpers", () => {
  it("slugifies names for route-safe project URLs", () => {
    expect(slugify("  Café Launch!! 2026  ")).toBe("cafe-launch-2026");
  });

  it("generates unique slugs while ignoring the current project", () => {
    expect(uniqueProjectSlug("Saved Name", projects, "new-project")).toBe(
      "saved-name",
    );
    expect(
      uniqueProjectSlug(
        "Saved Name",
        [{ id: "other", slug: "saved-name", name: "Saved Name" }],
        "new-project",
      ),
    ).toBe("saved-name-2");
    expect(
      uniqueProjectSlug(
        "Saved Name",
        [{ id: "current", slug: "saved-name", name: "Saved Name" }],
        "current",
      ),
    ).toBe("saved-name");
  });

  it("resolves route params by saved slug, generated slug, then id fallback", () => {
    expect(resolveProjectByRouteParam(projects, "saved-slug")?.id).toBe(
      "project-id-1",
    );
    expect(resolveProjectByRouteParam(projects, "cafe-launch")?.id).toBe(
      "project-id-2",
    );
    expect(resolveProjectByRouteParam(projects, "legacy-id")?.id).toBe(
      "legacy-id",
    );
    expect(resolveProjectByRouteParam(projects, "missing")).toBeNull();
  });

  it("builds canonical project paths from slug/name/id", () => {
    expect(projectRouteKey(projects[0])).toBe("saved-slug");
    expect(projectPath(projects[1], "files")).toBe(
      "/projects/cafe-launch/files",
    );
    expect(projectPath(projects[2])).toBe("/projects/legacy-id/tasks");
  });

  it("parses direct project routes without needing the browser location object", () => {
    expect(parseRoutePath("/")).toEqual({
      view: "home",
      routeProjectParam: null,
      activeTab: "tasks",
    });
    expect(parseRoutePath("/projects/saved-slug")).toEqual({
      view: "detail",
      routeProjectParam: "saved-slug",
      activeTab: "tasks",
    });
    expect(parseRoutePath("/projects/saved-slug/notes")).toEqual({
      view: "detail",
      routeProjectParam: "saved-slug",
      activeTab: "notes",
    });
    expect(parseRoutePath("/projects/saved-slug/unknown")).toEqual({
      view: "notFound",
      routeProjectParam: "saved-slug",
      activeTab: "tasks",
    });
  });

  it("builds route paths for navigation and preserves not-found paths", () => {
    expect(
      routePath({ view: "detail", project: projects[0], activeTab: "notes" }),
    ).toBe("/projects/saved-slug/notes");
    expect(
      routePath({
        view: "detail",
        routeProjectParam: "raw id",
        activeTab: "files",
      }),
    ).toBe("/projects/raw%20id/files");
    expect(routePath({ view: "notFound", currentPath: "/bad/path" })).toBe(
      "/bad/path",
    );
    expect(routePath({ view: "home" })).toBe("/");
  });
});
