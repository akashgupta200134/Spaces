import { prisma } from '../lib/prisma';

export interface AuditFilterOptions {
  search?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
  page?: number;
  limit?: number;
}

export async function logActivity(data: {
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}) {
  return await prisma.auditLog.create({
    data: {
      actorId: data.actorId,
      actorRole: data.actorRole,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      details: data.details || {},
      ipAddress: data.ipAddress ?? null,
    },
  });
}

export async function getAuditLogs(filters: AuditFilterOptions = {}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.actorId) where.actorId = filters.actorId;
  if (filters.search) {
    where.OR = [
      { action: { contains: filters.search, mode: 'insensitive' } },
      { entityType: { contains: filters.search, mode: 'insensitive' } },
      { entityId: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getActorTraceability(actorId: string) {
  return await prisma.auditLog.findMany({
    where: { actorId },
    include: {
      actor: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}