import type { Project } from "../../types";

export type BoardProject = Project;

export type BoardTab = "board" | "list" | "activity" | "members";

export const BOARD_TABS: Array<{ id: BoardTab; label: string }> = [
  { id: "board", label: "Board" },
  { id: "list", label: "List" },
  { id: "activity", label: "Activity" },
  { id: "members", label: "Members" },
];
