import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import {
  fetchBookByISBN,
  searchBooksByTitle,
} from "../services/openLibraryService";
import {
  generateConnections,
  generateReadingPatternSuggestion,
} from "../services/aiService";
import Resource from "../models/Resource";
import { truncateWords } from "../utils/text";

const router = Router();

router.use(requireAuth);

// GET /api/resources/lookup/:isbn - Search books by ISBN via OpenLibrary
router.get("/lookup/:isbn", async (req: AuthRequest, res: Response) => {
  try {
    const isbn = req.params.isbn as string;
    const book = await fetchBookByISBN(isbn);

    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found for this ISBN" });
    }

    res.json({ success: true, data: book });
  } catch (error) {
    console.error("GET /api/resources/lookup/:isbn", error);
    res.status(500).json({ success: false, message: "Error during search" });
  }
});

// GET /api/resources/search/:query - Search books by title via OpenLibrary
router.get("/search/:query", async (req: AuthRequest, res: Response) => {
  try {
    const query = req.params.query as string;
    const results = await searchBooksByTitle(query);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("GET /api/resources/search/:query", error);
    res.status(500).json({ success: false, message: "Error during search" });
  }
});

// POST /api/resources/connections - Find thematic connections between resources (not persisted)
router.post("/connections", async (req: AuthRequest, res: Response) => {
  try {
    const resources = await Resource.find({ userId: req.userId }).select(
      "title author tags notes",
    );

    if (resources.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Not enough resources to find connections",
      });
    }

    const resourceIds = new Set(resources.map((r) => r._id.toString()));
    const summaries = resources.map((r) => ({
      id: r._id.toString(),
      title: r.title,
      author: r.author,
      tags: r.tags,
      noteExcerpts: r.notes.slice(0, 3).map((n) => n.content),
    }));

    const generated = await generateConnections(summaries);

    const seen = new Set<string>();
    const connections = generated
      .filter(
        (c) =>
          resourceIds.has(c.resourceIdA) &&
          resourceIds.has(c.resourceIdB) &&
          c.resourceIdA !== c.resourceIdB,
      )
      .filter((c) => {
        const key = [c.resourceIdA, c.resourceIdB].sort().join("|");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 3)
      .map((c) => ({ ...c, explanation: truncateWords(c.explanation, 20) }));

    res.json({ success: true, data: connections });
  } catch (error) {
    console.error("POST /api/resources/connections", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/resources/rediscover?count=N - Surface N old notes, rotating deterministically by day.
router.get("/rediscover", async (req: AuthRequest, res: Response) => {
  try {
    const resources = await Resource.find({ userId: req.userId }).select(
      "title notes",
    );

    const allNotes = resources.flatMap((r) =>
      r.notes.map((n) => ({
        noteId: n.id,
        resourceId: r._id.toString(),
        resourceTitle: r.title,
        content: n.content,
        isQuote: n.isQuote,
        page: n.page,
        createdAt: n.createdAt,
      })),
    );

    if (allNotes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No notes to surface a rediscovery",
      });
    }

    allNotes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const requestedCount = Math.max(
      1,
      Math.min(Number(req.query.count) || 1, allNotes.length),
    );

    const startOfYear = new Date(new Date().getFullYear(), 0, 0);
    const dayOfYear = Math.floor(
      (Date.now() - startOfYear.getTime()) / 86400000,
    );
    const notes = Array.from(
      { length: requestedCount },
      (_, i) => allNotes[(dayOfYear + i) % allNotes.length],
    );

    res.json({ success: true, data: notes });
  } catch (error) {
    console.error("GET /api/resources/rediscover", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/resources/reading-pattern - Detect this week's reading pattern and suggest
// a related FlowDay practice session (not persisted) — the FlowDay/MindShelf bridge.
router.post("/reading-pattern", async (req: AuthRequest, res: Response) => {
  try {
    const resources = await Resource.find({ userId: req.userId }).select(
      "title tags notes",
    );

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const recentActivity = resources
      .map((r) => ({
        resourceTitle: r.title,
        tags: r.tags,
        recentNoteExcerpts: r.notes
          .filter((n) => n.createdAt >= sevenDaysAgo)
          .map((n) => n.content),
      }))
      .filter((r) => r.recentNoteExcerpts.length > 0);

    if (recentActivity.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Not enough recent reading activity",
      });
    }

    const generated = await generateReadingPatternSuggestion(recentActivity);

    res.json({
      success: true,
      data: {
        title:
          typeof generated.title === "string" && generated.title
            ? generated.title
            : "Session de pratique",
        description:
          typeof generated.description === "string" && generated.description
            ? generated.description
            : "Une session de pratique en lien avec tes lectures récentes ?",
        duration:
          typeof generated.duration === "number" && generated.duration > 0
            ? generated.duration
            : 30,
      },
    });
  } catch (error) {
    console.error("POST /api/resources/reading-pattern", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/resources - List with optional filters (type, status, tag)
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { type, status, tag } = req.query;
    const filter: Record<string, unknown> = { userId: req.userId };

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (tag) filter.tags = tag;

    const resources = await Resource.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: resources });
  } catch (error) {
    console.error("GET /api/resources", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/resources - Add a resource
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const {
      type,
      title,
      author,
      coverUrl,
      isbn,
      status,
      tags,
      rating,
      progress,
      currentPosition,
    } = req.body;

    if (!type || !title) {
      return res
        .status(400)
        .json({ success: false, message: "type and title are required" });
    }

    const resource = await Resource.create({
      userId: req.userId,
      type,
      title,
      author,
      coverUrl,
      isbn,
      status: status || "to-read",
      tags: tags || [],
      rating,
      progress: progress || 0,
      currentPosition,
    });

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    console.error("POST /api/resources", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PUT /api/resources/:id - Update a resource
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      status,
      tags,
      coverUrl,
      rating,
      progress,
      currentPosition,
    } = req.body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (author !== undefined) updates.author = author;
    if (status !== undefined) updates.status = status;
    if (tags !== undefined) updates.tags = tags;
    if (coverUrl !== undefined) updates.coverUrl = coverUrl;
    if (rating !== undefined) updates.rating = rating;
    if (progress !== undefined) updates.progress = progress;
    if (currentPosition !== undefined)
      updates.currentPosition = currentPosition;

    const resource = await Resource.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updates,
      { new: true, runValidators: true },
    );

    if (!resource) {
      return res
        .status(404)
        .json({ success: false, message: "Resource not found" });
    }

    res.json({ success: true, data: resource });
  } catch (error) {
    console.error("PUT /api/resources/:id", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE /api/resources/:id - Delete a resource
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!resource) {
      return res
        .status(404)
        .json({ success: false, message: "Resource not found" });
    }

    res.json({ success: true, message: "Resource deleted" });
  } catch (error) {
    console.error("DELETE /api/resources/:id", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/resources/:id/notes - Add a note/quote to a resource
router.post("/:id/notes", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, isQuote, page } = req.body;

    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "content is required" });
    }

    const note = {
      id: `note-${Date.now()}`,
      content,
      isQuote: !!isQuote,
      page: page || undefined,
      createdAt: new Date(),
    };

    const resource = await Resource.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $push: { notes: note } },
      { new: true },
    );

    if (!resource) {
      return res
        .status(404)
        .json({ success: false, message: "Resource not found" });
    }

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    console.error("POST /api/resources/:id/notes", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE /api/resources/:id/notes/:noteId - Delete a note
router.delete("/:id/notes/:noteId", async (req: AuthRequest, res: Response) => {
  try {
    const { id, noteId } = req.params;

    const resource = await Resource.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $pull: { notes: { id: noteId } } },
      { new: true },
    );

    if (!resource) {
      return res
        .status(404)
        .json({ success: false, message: "Resource not found" });
    }

    res.json({ success: true, data: resource });
  } catch (error) {
    console.error("DELETE /api/resources/:id/notes/:noteId", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
