import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CreateNotificationData = {
  type: any;
  message: string;
  recipientId: string;
  entityType?: string;
  entityId?: string;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateNotificationData) {
    return this.prisma.notification.create({ data });
  }

  createMany(data: CreateNotificationData[]) {
    return this.prisma.notification.createMany({ data });
  }

  getForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { recipientId: userId, read: false },
    });
  }

  markRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id, recipientId: userId },
      data: { read: true },
    });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientId: userId, read: false },
      data: { read: true },
    });
  }

  delete(id: string, userId: string) {
    return this.prisma.notification.delete({
      where: { id, recipientId: userId },
    });
  }
}
