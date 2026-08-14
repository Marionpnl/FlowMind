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

export const moduleTextClass: Record<ModuleName, string> = {
  FlowDay: "text-flowday",
  MindShelf: "text-mindshelf",
  SparkTime: "text-sparktime",
};

export const moduleSelectedClass: Record<ModuleName, string> = {
  FlowDay: "border-flowday bg-flowday-bg",
  MindShelf: "border-mindshelf bg-mindshelf-bg",
  SparkTime: "border-sparktime bg-sparktime-bg",
};

export const moduleButtonClass: Record<ModuleName, string> = {
  FlowDay: "bg-flowday hover:bg-flowday/90",
  MindShelf: "bg-mindshelf hover:bg-mindshelf/90",
  SparkTime: "bg-sparktime hover:bg-sparktime/90",
};
