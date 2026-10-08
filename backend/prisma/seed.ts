import bcrypt from "bcryptjs";
import type { Priority, ProjectRole, TaskStatus } from "@prisma/client";
import { prisma } from "../src/db/prisma.js";
import { env } from "../src/config/env.js";

const DEMO_PASSWORD = process.env.SEED_MEMBER_PASSWORD ?? "member123";

const DEMO_USERS = [
  { email: "an@example.com", name: "An" },
  { email: "binh@example.com", name: "Bình" },
  { email: "chi@example.com", name: "Chi" },
  { email: "dung@example.com", name: "Dung" },
];

interface SeedTask {
  title: string;
  description?: string;
  priority: Priority;
  dueInDays: number | null;
  assigneeEmail?: string;
  creatorEmail: string;
  history: TaskStatus[];
}

interface SeedProject {
  name: string;
  description: string;
  ownerEmail: string;
  members: Array<{ email: string; role: ProjectRole }>;
  tasks: SeedTask[];
}

const DAY = 24 * 60 * 60 * 1000;

function dueDate(inDays: number | null): Date | undefined {
  if (inDays === null) return undefined;
  return new Date(Date.now() + inDays * DAY);
}

const SEED_PROJECTS: SeedProject[] = [
  {
    name: "Website bán hàng",
    description: "Xây dựng website thương mại điện tử cho khách hàng",
    ownerEmail: "an@example.com",
    members: [
      { email: "binh@example.com", role: "MEMBER" },
      { email: "chi@example.com", role: "MEMBER" },
      { email: "dung@example.com", role: "MEMBER" },
    ],
    tasks: [
      {
        title: "Thiết kế trang chủ",
        description: "Lên layout hero, danh mục nổi bật và footer",
        priority: "HIGH",
        dueInDays: 3,
        assigneeEmail: "dung@example.com",
        creatorEmail: "an@example.com",
        history: ["TODO"],
      },
      {
        title: "Tích hợp thanh toán VNPay",
        description: "Tích hợp sandbox rồi đối soát giao dịch",
        priority: "URGENT",
        dueInDays: -2,
        assigneeEmail: "binh@example.com",
        creatorEmail: "an@example.com",
        history: ["TODO", "IN_PROGRESS"],
      },
      {
        title: "Viết tài liệu API",
        priority: "LOW",
        dueInDays: null,
        assigneeEmail: "chi@example.com",
        creatorEmail: "an@example.com",
        history: ["TODO"],
      },
      {
        title: "Setup CI/CD",
        description: "Pipeline build + test + deploy staging",
        priority: "MEDIUM",
        dueInDays: -10,
        assigneeEmail: "binh@example.com",
        creatorEmail: "an@example.com",
        history: ["TODO", "IN_PROGRESS", "DONE"],
      },
    ],
  },
  {
    name: "App mobile",
    description: "Ứng dụng di động cho khách hàng thân thiết",
    ownerEmail: env.SEED_ADMIN_EMAIL,
    members: [
      { email: "an@example.com", role: "LEAD" },
      { email: "dung@example.com", role: "MEMBER" },
    ],
    tasks: [
      {
        title: "Màn hình đăng nhập",
        description: "Email + OTP, lưu refresh token an toàn",
        priority: "MEDIUM",
        dueInDays: 5,
        assigneeEmail: "dung@example.com",
        creatorEmail: env.SEED_ADMIN_EMAIL,
        history: ["TODO", "IN_PROGRESS"],
      },
      {
        title: "Push notification",
        priority: "HIGH",
        dueInDays: 2,
        assigneeEmail: "an@example.com",
        creatorEmail: env.SEED_ADMIN_EMAIL,
        history: ["TODO"],
      },
      {
        title: "Splash screen",
        priority: "LOW",
        dueInDays: -5,
        assigneeEmail: "dung@example.com",
        creatorEmail: env.SEED_ADMIN_EMAIL,
        history: ["TODO", "DONE"],
      },
    ],
  },
  {
    name: "Hệ thống CRM",
    description: "Quản lý khách hàng và pipeline bán hàng",
    ownerEmail: "chi@example.com",
    members: [{ email: "binh@example.com", role: "MEMBER" }],
    tasks: [
      {
        title: "Import danh bạ từ Excel",
        priority: "MEDIUM",
        dueInDays: 7,
        assigneeEmail: "binh@example.com",
        creatorEmail: "chi@example.com",
        history: ["TODO"],
      },
      {
        title: "Kế hoạch kiểm thử UAT",
        description: "Kịch bản nghiệm thu theo từng phân hệ",
        priority: "HIGH",
        dueInDays: -1,
        assigneeEmail: "chi@example.com",
        creatorEmail: "chi@example.com",
        history: ["TODO", "IN_PROGRESS"],
      },
    ],
  },
];

async function ensureUser(email: string, name: string, password: string): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, 10),
      role: "MEMBER",
      status: "ACTIVE",
    },
  });
  return user.id;
}

async function ensureProject(p: SeedProject, userIds: Map<string, string>): Promise<void> {
  const ownerId = userIds.get(p.ownerEmail);
  if (!ownerId) throw new Error(`Missing user ${p.ownerEmail}`);
  let project = await prisma.project.findFirst({ where: { name: p.name } });
  if (!project) {
    project = await prisma.project.create({
      data: { name: p.name, description: p.description, ownerId },
    });
    console.log(`Seeded project: ${p.name}`);
  }
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: ownerId } },
    create: { projectId: project.id, userId: ownerId, role: "LEAD" },
    update: {},
  });
  for (const m of p.members) {
    const userId = userIds.get(m.email);
    if (!userId) throw new Error(`Missing user ${m.email}`);
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId } },
      create: { projectId: project.id, userId, role: m.role },
      update: {},
    });
  }
  for (const t of p.tasks) {
    const existing = await prisma.task.findFirst({
      where: { projectId: project.id, title: t.title },
    });
    if (existing) continue;
    const assigneeId = t.assigneeEmail ? userIds.get(t.assigneeEmail) : undefined;
    const creatorId = userIds.get(t.creatorEmail);
    const task = await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.history[t.history.length - 1] as TaskStatus,
        dueDate: dueDate(t.dueInDays),
        projectId: project.id,
        creatorId,
        assigneeId,
      },
    });
    let from: TaskStatus | null = null;
    for (const [i, to] of t.history.entries()) {
      await prisma.taskStatusLog.create({
        data: {
          taskId: task.id,
          fromStatus: from,
          toStatus: to,
          changedById: creatorId,
          createdAt: new Date(Date.now() - (t.history.length - i) * DAY),
        },
      });
      from = to;
    }
  }
}

async function main(): Promise<void> {
  const admin = await prisma.user.upsert({
    where: { email: env.SEED_ADMIN_EMAIL },
    update: {},
    create: {
      email: env.SEED_ADMIN_EMAIL,
      name: "Super Admin",
      passwordHash: await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 10),
      role: "SUPERADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`Seeded SUPERADMIN: ${admin.email}`);

  const userIds = new Map<string, string>();
  userIds.set(admin.email, admin.id);
  for (const u of DEMO_USERS) {
    userIds.set(u.email, await ensureUser(u.email, u.name, DEMO_PASSWORD));
  }
  console.log(`Seeded ${DEMO_USERS.length} demo members (password: ${DEMO_PASSWORD})`);

  for (const p of SEED_PROJECTS) {
    await ensureProject(p, userIds);
  }

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.taskStatusLog.count(),
  ]);
  console.log(
    `Done: ${counts[0]} users, ${counts[1]} projects, ${counts[2]} tasks, ${counts[3]} status logs`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
