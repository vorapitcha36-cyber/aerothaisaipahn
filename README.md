# AEROTHAI Security Standards Hub

ระบบทะเบียนเอกสารมาตรฐานการรักษาความปลอดภัยสำหรับศูนย์ควบคุมการบินและหอควบคุมย่อย พัฒนาด้วย React, NestJS, PostgreSQL และ MinIO

## ความสามารถหลัก

- Dashboard แสดง 9 ศูนย์หลัก, 23 หอควบคุมย่อย และ coverage 7 หมวด
- Google OAuth พร้อมขั้นตอนรอ Admin อนุมัติ
- บทบาท ADMIN, EDITOR และ VIEWER
- Workflow ร่าง → รอตรวจทาน → ใช้งาน/ส่งกลับ → เก็บถาวร
- เอกสารแบบ versioned พร้อม private upload, SHA-256 และ ClamAV
- Notification ในระบบและ Email, audit log แบบ append-only
- Responsive UI ภาษาไทยและ API documentation ที่ `/api/docs`

## เริ่มพัฒนา

1. คัดลอก `.env.example` เป็น `.env` และ `apps/api/.env.example` เป็น `apps/api/.env`
2. กำหนด Google OAuth callback เป็น `http://localhost:3000/api/v1/auth/google/callback`
3. รัน `pnpm install`, `pnpm db:generate`, `pnpm db:migrate` และ `pnpm db:seed`
4. รัน `pnpm dev` แล้วเปิด `http://localhost:5173`

สำหรับการติดตั้งภายในองค์กร ให้กำหนด HTTPS FQDN และ secrets ใน `.env` จากนั้นใช้ `docker compose up -d --build` ระบบจะไม่เปิด PostgreSQL, Redis, MinIO หรือ ClamAV ออกสู่เครือข่ายภายนอกโดยตรง

## ข้อมูลเริ่มต้น

Seed มีชื่อศูนย์หลัก 9 แห่งตามตัวอย่าง ส่วนหอควบคุมย่อย 23 แห่งเป็นข้อมูลตัวอย่าง ต้องแทนที่ด้วยรายชื่อและพิกัดที่องค์กรรับรองก่อน production
