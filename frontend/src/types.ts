export type Role = "SUPERADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ProjectRole = "LEAD" | "MEMBER";
export type UserStatus = "ACTIVE" | "LOCKED";

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  user?: Pick<SafeUser, "id" | "email" | "name" | "status"> & { role?: Role };
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: Pick<SafeUser, "id" | "email" | "name">;
  members?: ProjectMember[];
  _count?: { members: number; tasks: number };
}

export interface TaskStatusLog {
  id: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  taskId: string;
  changedById: string | null;
  createdAt: string;
  changedBy?: Pick<SafeUser, "id" | "email" | "name"> | null;
  task?: { id: string; title: string };
}

export type ActivityLog = TaskStatusLog;

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  projectId: string;
  creatorId: string | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: Pick<SafeUser, "id" | "email" | "name"> | null;
  assignee?: Pick<SafeUser, "id" | "email" | "name"> | null;
  project?: Pick<Project, "id" | "name">;
  statusLogs?: TaskStatusLog[];
}

export interface MyProject {
  projectId: string;
  name: string;
  description: string | null;
  myRole: "OWNER" | "LEAD" | "MEMBER";
  joinedAt: string | null;
  totalTasks: number;
  myOpenTasks: number;
}

export interface DashboardByProject {
  projectId: string;
  name: string;
  total: number;
  members: number;
  byStatus: Partial<Record<TaskStatus, number>>;
}

export interface DashboardData {
  scope: "GLOBAL" | "PROJECTS";
  total: number;
  byStatus: Partial<Record<TaskStatus, number>>;
  overdue: number;
  dueSoonCount: number;
  upcoming: Task[];
  byProject?: DashboardByProject[];
  users?: { total: number; superadmin: number; member: number; locked: number };
}

export interface ApiOk<T> {
  data: T;
}

export interface ApiErr {
  message: string;
}
