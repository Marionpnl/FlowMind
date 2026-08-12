import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { fetchBookByISBN } from "../services/openLibraryService";
import Resource from "../models/Resource";

const router = Router();

router.use(requireAuth);

// GET /api/resources/lookup/:isbn - Recherche un livre par ISBN via OpenLibrary
router.get("/lookup/:isbn", async (req: AuthRequest, res: Response) => {
  try {
    const isbn = req.params.isbn as string;
    const book = await fetchBookByISBN(isbn);

    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Livre introuvable pour cet ISBN" });
    }

    res.json({ success: true, data: book });
  } catch (error) {
    console.error("GET /api/resources/lookup/:isbn", error);
    res
      .status(500)
      .json({ success: false, message: "Erreur lors de la recherche" });
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
    const { type, title, author, coverUrl, isbn, status, tags } = req.body;

    if (!type || !title) {
      return res.status(400).json({
        success: false,
        message: "type and title are required",
      });
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
    const { title, author, status, tags, coverUrl } = req.body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (author !== undefined) updates.author = author;
    if (status !== undefined) updates.status = status;
    if (tags !== undefined) updates.tags = tags;
    if (coverUrl !== undefined) updates.coverUrl = coverUrl;

    const resource = await Resource.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updates,
      { new: true },
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
    const { content, isQuote } = req.body;

    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "content is required" });
    }

    const note = {
      id: `note-${Date.now()}`,
      content,
      isQuote: !!isQuote,
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

export default router;
