import { prisma } from "../src/db/prisma.js";

const TABLES = ["task_status_logs", "tasks", "project_members", "projects", "users"];

async function counts(): Promise<Record<string, number>> {
  const [users, projects, tasks, logs, members] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.taskStatusLog.count(),
    prisma.projectMember.count(),
  ]);
  return { users, projects, tasks, taskStatusLogs: logs, projectMembers: members };
}

async function main(): Promise<void> {
  console.log("Before:", await counts());
  await prisma.$executeRawUnsafe(
    `TRUNCATE ${TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
  console.log("Dropped tables:", TABLES.join(", "));
  console.log("After:", await counts());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
