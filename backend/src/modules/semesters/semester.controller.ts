import { Request, Response } from "express";
import {
  createSemester,
  deleteSemester,
  getSemester,
  getSemesters,
  updateSemester,
} from "./semester.service";

function message(error: unknown, fallback: string) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  if (code === "P2002") return "A semester with this name already exists";
  if (code === "P2021")
    return "Semester storage is not initialized. Run the database migrations.";
  return error instanceof Error ? error.message : fallback;
}

function input(body: Record<string, unknown>, partial = false) {
  const result: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
    isCurrent?: boolean;
    costPerCredit?: number;
  } = {};
  if (!partial || body.name !== undefined)
    result.name = String(body.name ?? "").trim();
  if (!partial || body.startDate !== undefined)
    result.startDate = new Date(String(body.startDate ?? ""));
  if (!partial || body.endDate !== undefined)
    result.endDate = new Date(String(body.endDate ?? ""));
  if (body.isCurrent !== undefined) result.isCurrent = body.isCurrent === true;
  if (!partial || body.costPerCredit !== undefined)
    result.costPerCredit = Number(body.costPerCredit ?? 0);
  if (!partial && !result.name) throw new Error("Semester name is required");
  return result;
}

export async function listSemesters(_req: Request, res: Response) {
  res.json({ success: true, data: await getSemesters() });
}
export async function readSemester(req: Request, res: Response) {
  const semester = await getSemester(Number(req.params.id));
  if (!semester)
    return res
      .status(404)
      .json({ success: false, message: "Semester not found" });
  return res.json({ success: true, data: semester });
}
export async function addSemester(req: Request, res: Response) {
  try {
    return res.status(201).json({
      success: true,
      data: await createSemester(
        input(req.body) as Parameters<typeof createSemester>[0],
      ),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: message(error, "Failed to create semester"),
    });
  }
}
export async function editSemester(req: Request, res: Response) {
  try {
    return res.json({
      success: true,
      data: await updateSemester(Number(req.params.id), input(req.body, true)),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: message(error, "Failed to update semester"),
    });
  }
}
export async function removeSemester(req: Request, res: Response) {
  try {
    await deleteSemester(Number(req.params.id));
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: message(error, "Failed to delete semester"),
    });
  }
}
