import { useEffect, useState } from "react";
import { Command, Search, Filter, Plus, BookOpen } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import InProgressCard from "@/components/mindshelf/InProgressCard";
import LibraryRow from "@/components/mindshelf/LibraryRow";
import ConnectionsPanel from "@/components/mindshelf/ConnectionsPanel";
import NotesRediscoveryPanel from "@/components/mindshelf/NotesRediscoveryPanel";
import AISuggestionCard from "@/components/mindshelf/AISuggestionCard";
import NewResourceModal from "@/components/mindshelf/NewResourceModal";
import ResourceDetailsModal from "@/components/mindshelf/ResourceDetailsModal";
import AllNotesModal from "@/components/mindshelf/AllNotesModal";
import FilterModal from "@/components/mindshelf/FilterModal";
import type { IResource, ResourceStatus } from "@shared/types";
import { Button } from "@/components/ui/button";
import { useResourceStore } from "@/store/resourceStore";
import { cn } from "@/lib/utils";
import {
  LIBRARY_STATUSES,
  STATUS_LABELS,
  type SortOption,
} from "@/lib/resourceTypes";

export default function MindShelf() {
  const resources = useResourceStore((s) => s.resources);
  const fetchResources = useResourceStore((s) => s.fetchResources);
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<ResourceStatus[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [allNotesOpen, setAllNotesOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [notesOnly, setNotesOnly] = useState(false);
  const [selectedResource, setSelectedResource] = useState<IResource | null>(
    null,
  );

  const filtersActive =
    categories.length > 0 ||
    minRating > 0 ||
    sortBy !== "recent" ||
    statuses.length > 0 ||
    notesOnly;

  function toggleStatus(status: ResourceStatus) {
    setStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  }

  function toggleCategory(category: string) {
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  }

  function resetFilters() {
    setStatuses([]);
    setCategories([]);
    setMinRating(0);
    setSortBy("recent");
    setNotesOnly(false);
  }

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const inProgress = resources.filter((r) => r.status === "in-progress");
  const totalNotes = resources.reduce((sum, r) => sum + r.notes.length, 0);

  const liveSelectedResource = selectedResource
    ? (resources.find((r) => r._id === selectedResource._id) ?? null)
    : null;

  const filteredLibrary = resources
    .filter((r) => statuses.length === 0 || statuses.includes(r.status))
    .filter((r) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        (r.author?.toLowerCase().includes(q) ?? false) ||
        r.notes.some((n) => n.content.toLowerCase().includes(q))
      );
    })
    .filter(
      (r) =>
        categories.length === 0 || r.tags.some((t) => categories.includes(t)),
    )
    .filter((r) => !minRating || (r.rating ?? 0) >= minRating)
    .filter((r) => !notesOnly || r.notes.length > 0)
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === "progress") return (b.progress ?? 0) - (a.progress ?? 0);
      return 0;
    });

  return (
    <div className="min-h-screen">
      <PageHeader
        title="MindShelf"
        subtitle={`${resources.length} livres · ${totalNotes} notes · ${inProgress.length} en cours`}
        actions={
          <>
            <button
              onClick={() => setFilterOpen(true)}
              className={cn(
                "flex items-center gap-2 text-xs hover:text-foreground cursor-pointer",
                filtersActive
                  ? "text-black/60 font-medium"
                  : "text-black/70 text-muted-foreground",
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtrer
            </button>
            <Button
              size="sm"
              className="bg-mindshelf text-white hover:bg-mindshelf/90"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Ajouter un livre
            </Button>
          </>
        }
      />

      <main className="grid grid-cols-3 gap-5 px-8 py-6">
        <div className="col-span-2 space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-mindshelf" />
            <Search className="absolute left-8 top-1/2 h-4 w-4 -translate-y-1/2 text-black/70 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un titre, un auteur, une note..."
              className="w-full bg-transparent py-8 pl-15 pr-4 text-sm outline-none"
            />
            <kbd className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 pr-8 text-xs text-black/60 text-muted-foreground">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </div>

          {inProgress.length > 0 && (
            <div>
              <h2 className="font-display text-2xl italic">
                En cours de lecture
              </h2>
              <p className="mb-4 mt-0.5 text-xs text-black/70 text-muted-foreground">
                {inProgress.length} livres actifs
              </p>
              <div className="grid grid-cols-2 gap-4">
                {inProgress.map((r) => (
                  <InProgressCard
                    key={r._id}
                    resource={r}
                    onClick={() => setSelectedResource(r)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-white p-5 border border-black/5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm tracking-wide font-semibold">
                <BookOpen className="h-4.5 w-4.5 text-mindshelf" />
                Ta bibliothèque
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStatuses([])}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium tracking-wider transition-colors cursor-pointer",
                    statuses.length === 0
                      ? "bg-[#2B2A28] text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Tous
                </button>
                {LIBRARY_STATUSES.filter((s) => s !== "in-progress").map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => toggleStatus(s)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium tracking-wider transition-colors cursor-pointer",
                        statuses.includes(s)
                          ? "bg-[#2B2A28] text-white"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ),
                )}
              </div>
            </div>

            {filteredLibrary.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun livre pour l'instant.
              </p>
            ) : (
              <div>
                {filteredLibrary.map((r) => (
                  <LibraryRow
                    key={r._id}
                    resource={r}
                    onClick={() => setSelectedResource(r)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <AISuggestionCard />
          <ConnectionsPanel
            resources={resources}
            onSelectResource={setSelectedResource}
          />
          <NotesRediscoveryPanel onOpenAllNotes={() => setAllNotesOpen(true)} />
        </div>
      </main>
      <NewResourceModal open={modalOpen} onOpenChange={setModalOpen} />
      <ResourceDetailsModal
        resource={liveSelectedResource}
        onOpenChange={(open) => !open && setSelectedResource(null)}
      />
      <AllNotesModal
        open={allNotesOpen}
        onOpenChange={setAllNotesOpen}
        resources={resources}
        onSelectResource={(r) => {
          setAllNotesOpen(false);
          setSelectedResource(r);
        }}
      />
      <FilterModal
        open={filterOpen}
        onOpenChange={setFilterOpen}
        totalCount={resources.length}
        statuses={statuses}
        onToggleStatus={toggleStatus}
        categories={categories}
        onToggleCategory={toggleCategory}
        minRating={minRating}
        onMinRatingChange={setMinRating}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        notesOnly={notesOnly}
        onNotesOnlyChange={setNotesOnly}
        onReset={resetFilters}
      />
    </div>
  );
}
