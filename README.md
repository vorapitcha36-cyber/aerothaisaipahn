# AEROTHAI Security Standards Dashboard Prototype

Frontend-only prototype สำหรับติดตามมาตรฐานการรักษาความปลอดภัย 9 ศูนย์ควบคุมหลัก 23 หอลูกข่าย และหัวข้อมาตรฐานเริ่มต้น 7 หมวด

## Tech stack

- React 18 + Vite + JavaScript
- TailwindCSS และ source UI components แนว Shadcn UI
- Lucide React
- React Simple Maps 3 + TopoJSON ที่เก็บในโปรเจกต์
- Context + `useReducer` และ versioned localStorage
- Vitest + jsdom

## เริ่มใช้งาน

```bash
pnpm install
pnpm dev
```

ทดสอบและ build:

```bash
pnpm test
pnpm build
```

## ขอบเขตข้อมูล

ระบบนี้เป็น prototype แบบ frontend-only ไม่มี authentication, backend API หรือ cloud storage จริง ห้ามนำข้อมูลความมั่นคง ข้อมูลส่วนบุคคล หรือเอกสารจริงมาใช้ ไฟล์เอกสารจำลองจะอยู่ใน browser session เท่านั้นและไม่ถูก persist

## แผนที่และ attribution

ขอบเขตจังหวัดอยู่ที่ `public/maps/thailand-provinces.topo.json` และโหลดจากไฟล์ภายในแอปโดยไม่มี map tile server ภายนอก รายละเอียดแหล่งข้อมูลและสัญญาอนุญาตอยู่ใน `public/maps/ATTRIBUTION.md`
