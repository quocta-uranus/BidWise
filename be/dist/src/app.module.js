"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const ioredis_1 = require("@nestjs-modules/ioredis");
const core_1 = require("@nestjs/core");
const app_config_1 = __importDefault(require("./config/app.config"));
const jwt_config_1 = __importDefault(require("./config/jwt.config"));
const redis_config_1 = __importDefault(require("./config/redis.config"));
const mail_config_1 = __importDefault(require("./config/mail.config"));
const prisma_module_1 = require("./modules/prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const admin_module_1 = require("./modules/admin/admin.module");
const token_module_1 = require("./modules/token/token.module");
const email_module_1 = require("./modules/email/email.module");
const otp_module_1 = require("./modules/otp/otp.module");
const session_module_1 = require("./modules/session/session.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const jobs_module_1 = require("./modules/jobs/jobs.module");
const freelancer_module_1 = require("./modules/freelancer/freelancer.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.default, jwt_config_1.default, redis_config_1.default, mail_config_1.default],
            }),
            throttler_1.ThrottlerModule.forRoot({
                throttlers: [{ limit: 60, ttl: 60000 }],
            }),
            ioredis_1.RedisModule.forRootAsync({
                useFactory: (configService) => {
                    const redisUrl = process.env.REDIS_URL;
                    if (redisUrl) {
                        return {
                            type: 'single',
                            url: redisUrl,
                            options: { tls: redisUrl.startsWith('rediss://') ? {} : undefined },
                        };
                    }
                    return {
                        type: 'single',
                        url: `redis://${configService.get('redis.host')}:${configService.get('redis.port')}`,
                        options: {
                            password: configService.get('redis.password') || undefined,
                        },
                    };
                },
                inject: [config_1.ConfigService],
            }),
            prisma_module_1.PrismaModule,
            token_module_1.TokenModule,
            email_module_1.EmailModule,
            otp_module_1.OtpModule,
            session_module_1.SessionModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            admin_module_1.AdminModule,
            jobs_module_1.JobsModule,
            freelancer_module_1.FreelancerModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map