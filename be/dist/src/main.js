"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const helmet_1 = __importDefault(require("helmet"));
const cookieParser = require('cookie-parser');
const app_module_1 = require("./app.module");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const transform_response_interceptor_1 = require("./common/interceptors/transform-response.interceptor");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const reflector = app.get(core_1.Reflector);
    app.use(cookieParser());
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: true,
        hsts: { maxAge: 31536000, includeSubDomains: true },
    }));
    app.enableCors({
        origin: [configService.get('app.frontendUrl') ?? 'http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Authorization', 'Content-Type'],
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalGuards(new jwt_auth_guard_1.JwtAuthGuard(reflector), new roles_guard_1.RolesGuard(reflector));
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
    app.useGlobalInterceptors(new transform_response_interceptor_1.TransformResponseInterceptor());
    const port = process.env.PORT ?? configService.get('app.port') ?? 3001;
    await app.listen(port, '0.0.0.0');
    console.log(`BidWise API running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map