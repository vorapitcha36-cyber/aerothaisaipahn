import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { RedisStore } from "connect-redis";
import session from "express-session";
import helmet from "helmet";
import passport from "passport";
import { createClient } from "redis";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], imgSrc: ["'self'", "data:", "https://lh3.googleusercontent.com"], connectSrc: ["'self'"] } } }));
  app.use(cookieParser());
  let store: RedisStore | undefined;
  if (process.env.REDIS_URL) {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    store = new RedisStore({ client, prefix: "aerothai:sess:" });
  }
  app.use(session({ store, name: "aerothai.sid", secret: process.env.SESSION_SECRET || "development-only-session-secret-change-me", resave: false, saveUninitialized: false, rolling: true, cookie: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 8 * 60 * 60 * 1000 } }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const config = new DocumentBuilder().setTitle("AEROTHAI Security Standards API").setVersion("1.0").addCookieAuth("aerothai.sid").build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT || 3000), "0.0.0.0");
}

void bootstrap();
