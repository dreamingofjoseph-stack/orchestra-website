import { Router, type IRouter, type Request, type Response } from "express";
import { RequestUploadUrlBody, RequestUploadUrlResponse } from "@workspace/api-zod";
import { requireAdmin } from "./admin";
import { ObjectNotFoundError, ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

router.post("/storage/uploads/request-url", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.contentType.startsWith("image/") || parsed.data.size > 10 * 1024 * 1024) {
    res.status(400).json({ error: "Upload must be an image smaller than 10 MB." });
    return;
  }

  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json(RequestUploadUrlResponse.parse({
      uploadURL,
      objectPath: objectStorageService.normalizeObjectEntityPath(uploadURL),
      metadata: parsed.data,
    }));
  } catch (error) {
    req.log.error({ err: error }, "Error generating image upload URL");
    res.status(500).json({ error: "Could not prepare the image upload." });
  }
});

router.get("/storage/objects/*path", async (req: Request, res: Response): Promise<void> => {
  try {
    const rawPath = req.params.path;
    const wildcardPath = Array.isArray(rawPath) ? rawPath.join("/") : rawPath;
    const file = await objectStorageService.getObjectEntityFile(`/objects/${wildcardPath}`);
    const response = await objectStorageService.downloadObject(file);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.status(response.status);
    if (response.body) {
      const { Readable } = await import("node:stream");
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving stored image");
    res.status(500).json({ error: "Could not serve the image." });
  }
});

export default router;