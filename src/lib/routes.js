export const PROJECT_TABS = ["tasks", "notes", "files"];

export function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueProjectSlug(name, projects, projectId) {
  const baseSlug = slugify(name) || projectId;
  const usedSlugs = new Set(
    projects
      .filter((project) => project.id !== projectId)
      .map((project) => project.slug || slugify(project.name)),
  );

  let slug = baseSlug;
  let suffix = 2;
  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export function projectRouteKey(project) {
  return project.slug || slugify(project.name) || project.id;
}

export function resolveProjectByRouteParam(projects, routeParam) {
  if (!routeParam) return null;

  return (
    projects.find((project) => project.slug === routeParam) ||
    projects.find((project) => slugify(project.name) === routeParam) ||
    projects.find((project) => project.id === routeParam) ||
    null
  );
}

export function projectPath(project, tab = "tasks") {
  return `/projects/${encodeURIComponent(projectRouteKey(project))}/${tab}`;
}

export function parseRoutePath(pathname) {
  const parts = String(pathname || "/")
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);
  if (!parts.length) {
    return { view: "home", routeProjectParam: null, activeTab: "tasks" };
  }
  if (parts[0] === "projects" && parts[1]) {
    if (parts[2] && !PROJECT_TABS.includes(parts[2])) {
      return {
        view: "notFound",
        routeProjectParam: parts[1],
        activeTab: "tasks",
      };
    }
    return {
      view: "detail",
      routeProjectParam: parts[1],
      activeTab: parts[2] || "tasks",
    };
  }
  if (parts[0] === "projects") {
    return { view: "home", routeProjectParam: null, activeTab: "tasks" };
  }
  return { view: "notFound", routeProjectParam: null, activeTab: "tasks" };
}

export function routePath({
  view,
  routeProjectParam,
  activeTab,
  project,
  currentPath = "/not-found",
}) {
  if (view === "detail" && project)
    return projectPath(project, activeTab || "tasks");
  if (view === "detail" && routeProjectParam)
    return `/projects/${encodeURIComponent(routeProjectParam)}/${activeTab || "tasks"}`;
  if (view === "notFound") return currentPath || "/not-found";
  return "/";
}
