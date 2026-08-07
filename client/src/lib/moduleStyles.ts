export type ModuleName = "FlowDay" | "MindShelf" | "SparkTime";

export const moduleBadgeClass: Record<ModuleName, string> = {
  FlowDay: "bg-flowday-bg text-flowday",
  MindShelf: "bg-mindshelf-bg text-mindshelf",
  SparkTime: "bg-sparktime-bg text-sparktime",
};

export const moduleDotClass: Record<ModuleName, string> = {
  FlowDay: "bg-flowday",
  MindShelf: "bg-mindshelf",
  SparkTime: "bg-sparktime",
};
