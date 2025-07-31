> <h4>2025S KAIST 몰입캠프</h4>
> <h4>Week 4 : 2025. 07. 24. ~ 2025. 07. 31.</h4>

---

## 👥 Team Members
<table>
    <tr>
      <td align="center" width="200">
        <a href="https://github.com/jaedungg">
          <img width="120" height="120" alt="Image" src="https://github.com/user-attachments/assets/e0088254-6ae8-455f-9c3f-a6878999689e" />
          <br />
        </a>
      </td>
      <td align="center" width="200">
        <a href="https://github.com/chngmn">
          <img width="120" height="120" alt="Image" src="https://github.com/user-attachments/assets/20771cb6-a9f0-4648-87ac-f9e3268767e1" />
          <br />
        </a>
      </td>
    </tr>
    <tr>
      <td align="center">
        <b>이재현</b>
      </td>
      <td align="center">
        <b>이창민</b>
      </td>
    </tr>
  <tr>
    <td align="center">
      <p>카이스트 전산학부</p>
    </td>
    <td align="center">
      <p>카이스트 전산학부</p>
    </td>
  </tr>
</table>
---

# 프롬 (From)


> A Korean AI writing assistant web app built with Next.js, helping you craft natural Korean text for emails, letters, messages, and more—with customizable tones and real-time collaboration.

---

## 🚀 Features

- **AI-Powered Writing**: Generate, improve, summarize, expand, translate and adjust tone with Google Gemini (and optional OpenAI).
- **Document Management**: Create, edit, organize, share & export/import documents (JSON, CSV, PDF).
- **Templates**: Pre-built & custom Korean templates for common writing scenarios.
- **Collaboration**: Real-time editing, access logs, sharing permissions.
- **Speech & Prediction**: Browser-based voice input and AI-driven text suggestions.

---

## 🛠️ Quick Start

1. **Install**

   ```bash
   npm install
   ```

2. **Run in Development**

   ```bash
   npm run dev
   # Opens http://localhost:3000 with Turbopack
   ```

3. **Build & Start**

   ```bash
   npm run build
   npm start
   ```

4. **Lint**

   ```bash
   npm run lint
   ```

---

## 📦 Database & Migrations

- **Run migrations**:
  ```bash
  npx prisma migrate dev
  ```
- **Generate client**:
  ```bash
  npx prisma generate
  ```
- **Inspect**:
  ```bash
  npx prisma studio
  ```
- **Push schema** (dev):
  ```bash
  npx prisma db push
  ```

---

## 🔧 Environment Variables

```env
GOOGLE_API_KEY      # Gemini AI
DATABASE_URL        # PostgreSQL
NEXTAUTH_SECRET     # NextAuth.js
OPENAI_API_KEY      # (Optional) OpenAI
API_BASE_URL        # e.g. http://localhost:3000
```

---

## 🏗️ Architecture

- **Framework**: Next.js 15.4.4 (App Router + Turbopack)
- **DB**: PostgreSQL + Prisma ORM with full-text search (tsvector)
- **Auth**: NextAuth.js (credentials provider, JWT, bcrypt)
- **State**: Zustand (persistent stores)
- **UI**: Tailwind CSS, Headless UI, Lucide icons, Framer Motion
- **Editor**: TipTap rich-text + speech recognition + prediction
- **AI Layer**: Google Gemini API (`@google/generative-ai`), optional OpenAI
- **API**: RESTful endpoints under `src/app/api/`

---

## 📁 Directory Structure

```
src/
├── app/           # Pages & API routes
│   ├── (dashboard)/   # Protected dashboard
│   ├── api/           # AI, auth, docs, users, etc.
│   └── page.tsx       # Home
├── components/    # UI & domain components
├── lib/           # AI services, DB utils, exporters/importers
├── stores/        # Zustand state
├── hooks/         # Custom React hooks
└── types/         # TypeScript definitions
```

---

## ⚙️ Common Tasks

- **Add AI function**:

  1. Create `/api/ai/[fn]/route.ts`
  2. Add service in `lib/ai/services.ts`
  3. Update prompts in `lib/ai/prompts.ts`
  4. Register in the Command Palette
  5. Update types in `lib/ai/types.ts`

- **Schema change**:

  ```bash
  # edit `prisma/schema.prisma`
  npx prisma migrate dev --name <desc>
  npx prisma generate
  ```

- **Extend editor**:

  - Add TipTap extension in `AIEditor`
  - Follow `ToolbarButton`/`Command` patterns
  - Integrate hooks (`useSpeechRecognition`, `useTextPrediction`)

- **Styling**:

  - Tailwind CSS with semantic tokens
  - Framer Motion for animations
  - Mobile-first responsive design

---

## 🎯 Contributing

1. Fork & clone
2. Create feature branch
3. Commit & push
4. Open PR against `main`
5. Review & merge

---

**Enjoy writing in Korean with AI!**

