import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { EmailService } from '../email/email.service';
import { RoleType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private emailService: EmailService,
  ) {}

  // ─── USER MANAGEMENT ─────────────────────────────────────────────────────

  async listUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { fullName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { userRoles: { include: { role: true } } },
        omit: { passwordHash: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
        loginSessions: { orderBy: { createdAt: 'desc' }, take: 10 },
        accountLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
      omit: { passwordHash: true },
    });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return user;
  }

  async createUser(dto: import('./dto/create-admin-user.dto').CreateAdminUserDto, createdBy: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('EMAIL_ALREADY_EXISTS');

    const role = await this.prisma.role.findUnique({ where: { name: dto.role } });
    if (!role) throw new NotFoundException('ROLE_NOT_FOUND');

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        status: 'ACTIVE', // Bypass OTP
        isEmailVerified: true,
        userRoles: {
          create: {
            roleId: role.id,
            assignedBy: createdBy,
          },
        },
        accountLogs: {
          create: {
            action: 'CREATED_BY_ADMIN',
            performedBy: createdBy,
            metadata: { initialRole: dto.role },
          },
        },
      },
      omit: { passwordHash: true },
    });

    return user;
  }

  // ─── ROLE MANAGEMENT ─────────────────────────────────────────────────────

  async assignRole(userId: string, roleType: RoleType, assignedBy: string): Promise<void> {
    const [user, role] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.role.findUnique({ where: { name: roleType } }),
    ]);

    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    if (!role) throw new NotFoundException('ROLE_NOT_FOUND');

    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId: role.id } },
    });
    if (existing) throw new BadRequestException('ROLE_ALREADY_ASSIGNED');

    await this.prisma.$transaction([
      this.prisma.userRole.create({
        data: { userId, roleId: role.id, assignedBy },
      }),
      this.prisma.accountStatusLog.create({
        data: { userId, action: 'ROLE_ASSIGNED', performedBy: assignedBy, metadata: { role: roleType } },
      }),
    ]);
  }

  async revokeRole(userId: string, roleType: RoleType, performedBy: string): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { name: roleType } });
    if (!role) throw new NotFoundException('ROLE_NOT_FOUND');

    const userRole = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId: role.id } },
    });
    if (!userRole) throw new NotFoundException('ROLE_NOT_ASSIGNED');

    await this.prisma.$transaction([
      this.prisma.userRole.delete({
        where: { userId_roleId: { userId, roleId: role.id } },
      }),
      this.prisma.accountStatusLog.create({
        data: { userId, action: 'ROLE_REVOKED', performedBy, metadata: { role: roleType } },
      }),
    ]);
  }

  // ─── SUSPEND / UNSUSPEND ─────────────────────────────────────────────────

  async suspendUser(
    userId: string,
    reason: string,
    performedBy: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    if (user.status === 'SUSPENDED') throw new BadRequestException('ALREADY_SUSPENDED');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: 'SUSPENDED' },
      }),
      this.prisma.accountStatusLog.create({
        data: { userId, action: 'SUSPENDED', reason, performedBy },
      }),
    ]);

    await this.tokenService.revokeAllUserSessions(userId);
    await this.emailService.sendAccountSuspended(user.email, user.fullName, reason);
  }

  async unsuspendUser(userId: string, performedBy: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    if (user.status !== 'SUSPENDED') throw new BadRequestException('NOT_SUSPENDED');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: 'ACTIVE' },
      }),
      this.prisma.accountStatusLog.create({
        data: { userId, action: 'UNSUSPENDED', performedBy },
      }),
    ]);
  }
}
