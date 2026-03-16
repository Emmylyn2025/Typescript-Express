
import { Request, Response, NextFunction } from "express";

const validation = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);

  if (!result.success) return res.status(400).json({ message: "Invalid data", error: result.error.flatten().fieldErrors });

  req.body = result.data;

  next();
}

export default validation;