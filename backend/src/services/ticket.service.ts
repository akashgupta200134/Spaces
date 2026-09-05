import { prisma } from '../lib/prisma';

export interface TicketFilterOptions {
  priority?: 'NORMAL' | 'HIGH' | 'URGENT';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string;
}

// Fetch helpdesk tickets with filtering and user context
export async function getTickets(filters: TicketFilterOptions = {}) {
  const where: any = {};

  if (filters.priority) where.priority = filters.priority;
  if (filters.status) where.status = filters.status;
  if (filters.assignedTo) where.assignedTo = filters.assignedTo;

  return await prisma.supportTicket.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      assignedAdmin: {
        select: { id: true, name: true, email: true },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

// Get single ticket details with full message history
export async function getTicketDetails(ticketId: string) {
  return await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      assignedAdmin: {
        select: { id: true, name: true, email: true },
      },
      messages: {
        include: {
          sender: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

// Reassign ticket agent
export async function reassignTicket(ticketId: string, assignedTo: string | null) {
  return await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      assignedTo,
      status: assignedTo ? 'IN_PROGRESS' : 'OPEN',
    },
  });
}

// Update ticket status or priority
export async function updateTicketMetadata(
  ticketId: string,
  updates: { status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'; priority?: 'NORMAL' | 'HIGH' | 'URGENT' }
) {
  return await prisma.supportTicket.update({
    where: { id: ticketId },
    data: updates,
  });
}

// Add message or internal note to a ticket thread
export async function addTicketMessage(
  ticketId: string,
  senderId: string,
  message: string,
  isInternal: boolean = false
) {
  const ticketMessage = await prisma.supportMessage.create({
    data: {
      ticketId,
      senderId,
      message,
      isInternal,
    },
    include: {
      sender: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  // Touch updated time on parent ticket
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() },
  });

  return ticketMessage;
}