import { useMemo } from "react";
import type { Project, WorkspaceData } from "../types";
import { Avatar } from "./Avatar";

interface MyDeskProps {
  workspace: WorkspaceData;
  currentDesignerId: string;
  onOpenProject: (id: string) => void;
}

const PRIORITY_ORDER: Record<string, number> = {
  Urgent: 0,
  High: 1,
  Normal: 2,
  Low: 3,
};

function sortByPriorityThenDue(a: Project, b: Project): number {
  const dp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (dp !== 0) return dp;
  return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
}

export function MyDesk({ workspace, currentDesignerId, onOpenProject }: MyDeskProps) {
  const allActiveProjects = useMemo(
    () =>
      workspace.projects.filter(
        (p) => (p.status ?? "active") === "active" && !p.archived
      ),
    [workspace.projects]
  );

  const myProjects = useMemo(
    () =>
      allActiveProjects
        .filter((p) => p.assigneeIds.includes(currentDesignerId))
        .sort(sortByPriorityThenDue),
    [allActiveProjects, currentDesignerId]
  );

  const overdueTasks = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return myProjects
      .filter((p) => p.dueDate && p.dueDate < today)
      .sort(sortByPriorityThenDue);
  }, [myProjects]);

  const dueSoon = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    return myProjects
      .filter((p) => p.dueDate && p.dueDate >= today && p.dueDate <= nextWeek)
      .sort(sortByPriorityThenDue);
  }, [myProjects]);

  const highPriority = useMemo(
    () =>
      myProjects
        .filter((p) => p.priority === "Urgent" || p.priority === "High")
        .slice(0, 5),
    [myProjects]
  );

  const upcomingDeadlines = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const twoWeeksOut = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    return myProjects
      .filter((p) => p.dueDate && p.dueDate >= today && p.dueDate <= twoWeeksOut)
      .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
      .slice(0, 6);
  }, [myProjects]);

  const getDaysUntil = (dueDate: string | undefined): number | null => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = due.getTime() - today.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (priority: string): string => {
    switch (priority) {
      case "Urgent":
        return "#ef4444";
      case "High":
        return "#f97316";
      case "Normal":
        return "#3b82f6";
      case "Low":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const currentDesigner = workspace.designers.find((d) => d.id === currentDesignerId);

  return (
    <div className="mydesk">
      <div className="mydesk-header">
        <div className="mydesk-greeting">
          <h1>My Desk</h1>
          <p className="muted small">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        {currentDesigner && <Avatar designer={currentDesigner} size={48} />}
      </div>

      <div className="mydesk-notifications">
        {/* High Priority Section */}
        {highPriority.length > 0 && (
          <section className="notification-card high-priority">
            <h3>High Priority</h3>
            <div className="notification-list">
              {highPriority.map((p) => (
                <div
                  key={p.id}
                  className="notification-item"
                  onClick={() => onOpenProject(p.id)}
                >
                  <span className="notification-title">{p.title}</span>
                  {p.dueDate && (
                    <span className="notification-meta">
                      {getDaysUntil(p.dueDate)! < 0
                        ? `${Math.abs(getDaysUntil(p.dueDate)!)} days overdue`
                        : getDaysUntil(p.dueDate) === 0
                          ? "Due today"
                          : `Due in ${getDaysUntil(p.dueDate)} days`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Overdue Section */}
        {overdueTasks.length > 0 && (
          <section className="notification-card overdue">
            <h3>Overdue</h3>
            <div className="notification-list">
              {overdueTasks.map((p) => (
                <div
                  key={p.id}
                  className="notification-item"
                  onClick={() => onOpenProject(p.id)}
                >
                  <span className="notification-title">{p.title}</span>
                  <span className="notification-meta">
                    {Math.abs(getDaysUntil(p.dueDate)!)} days overdue
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Due Soon Section */}
        {dueSoon.length > 0 && (
          <section className="notification-card due-soon">
            <h3>Due Soon</h3>
            <div className="notification-list">
              {dueSoon.map((p) => (
                <div
                  key={p.id}
                  className="notification-item"
                  onClick={() => onOpenProject(p.id)}
                >
                  <span className="notification-title">{p.title}</span>
                  <span className="notification-meta">
                    {getDaysUntil(p.dueDate) === 0
                      ? "Due today"
                      : `Due in ${getDaysUntil(p.dueDate)} days`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {highPriority.length === 0 &&
          overdueTasks.length === 0 &&
          dueSoon.length === 0 && (
            <section className="notification-card empty">
              <p className="muted">Nothing needs immediate attention. Great work!</p>
            </section>
          )}
      </div>

      <div className="mydesk-grid">
        {/* My Projects Section */}
        <section className="mydesk-section">
          <div className="mydesk-section-head">
            <h3>My Projects</h3>
            <span className="badge">{myProjects.length}</span>
          </div>
          {myProjects.length === 0 ? (
            <p className="muted small">No projects assigned to you.</p>
          ) : (
            <div className="project-list">
              {myProjects.map((p) => {
                const daysLeft = getDaysUntil(p.dueDate);
                return (
                  <div
                    key={p.id}
                    className="project-item"
                    onClick={() => onOpenProject(p.id)}
                  >
                    <div className="project-header">
                      <div className="project-title">{p.title}</div>
                      <span
                        className="priority-dot"
                        style={{ backgroundColor: getStatusColor(p.priority) }}
                        title={p.priority}
                      />
                    </div>
                    <div className="project-meta">
                      <span className="project-client">{p.client || "—"}</span>
                      {p.dueDate && (
                        <span
                          className={`project-due ${
                            daysLeft !== null && daysLeft < 0 ? "overdue" : ""
                          }`}
                        >
                          {daysLeft !== null
                            ? daysLeft < 0
                              ? `${Math.abs(daysLeft)}d overdue`
                              : daysLeft === 0
                                ? "Due today"
                                : `${daysLeft}d left`
                            : "No due date"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming Deadlines Section */}
        <section className="mydesk-section">
          <div className="mydesk-section-head">
            <h3>Upcoming Deadlines</h3>
            <span className="badge">{upcomingDeadlines.length}</span>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <p className="muted small">No upcoming deadlines in the next 2 weeks.</p>
          ) : (
            <div className="deadline-list">
              {upcomingDeadlines.map((p) => {
                const date = new Date(p.dueDate!);
                return (
                  <div
                    key={p.id}
                    className="deadline-item"
                    onClick={() => onOpenProject(p.id)}
                  >
                    <div className="deadline-date">
                      <div className="deadline-day">{date.getDate()}</div>
                      <div className="deadline-month">
                        {date.toLocaleDateString("en-US", { month: "short" })}
                      </div>
                    </div>
                    <div className="deadline-content">
                      <div className="deadline-title">{p.title}</div>
                      <div className="deadline-meta">{p.client || "—"}</div>
                    </div>
                    <span
                      className="priority-badge"
                      style={{ backgroundColor: getStatusColor(p.priority) }}
                    >
                      {p.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
