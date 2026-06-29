import { z } from "zod";

export const clientSchema = z.object({
  companyName: z.string().min(2),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  tags: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : []
    ),
});

export const projectSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  status: z
    .enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"])
    .default("DRAFT"),
  progressPercent: z.coerce.number().int().min(0).max(100).default(0),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  budget: z.coerce.number().nonnegative().optional(),
});

export const milestoneSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z
    .enum(["PENDING", "IN_PROGRESS", "COMPLETED", "APPROVED"])
    .default("PENDING"),
  sortOrder: z.coerce.number().int().default(0),
});

export const deliverableSchema = z.object({
  projectId: z.string().min(1),
  milestoneId: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  fileKey: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.coerce.number().int().optional(),
});

export const attachmentSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  size: z.number().int().nonnegative(),
  type: z.string(),
});

export type Attachment = z.infer<typeof attachmentSchema>;

export const messageSchema = z.object({
  projectId: z.string().min(1),
  body: z.string().min(1).max(4000),
  attachments: z.array(attachmentSchema).default([]),
});

export const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
});

export type LineItem = z.infer<typeof lineItemSchema>;

export const invoiceSchema = z.object({
  projectId: z.string().min(1),
  clientId: z.string().min(1),
  invoiceNumber: z.string().min(1),
  currency: z.string().length(3).default("usd"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z
    .string()
    .transform((val) => JSON.parse(val) as LineItem[])
    .pipe(z.array(lineItemSchema).min(1, "At least one line item is required")),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER", "CLIENT"]),
});