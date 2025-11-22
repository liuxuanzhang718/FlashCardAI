# FlashCard AI - PDF to Anki

A minimalist, high-performance web application that converts PDF documents into Anki-style flashcards using AI, with a built-in spaced repetition review system.

## Features
- **PDF Parsing**: Upload any PDF (lecture notes, textbooks).
- **AI Generation**: Automatically extracts key concepts and creates Q&A flashcards.
- **Spaced Repetition**: Built-in review system using the SM-2 algorithm (Anki's algorithm).
- **Apple-style UI**: Clean, responsive, and mobile-friendly.

## Prerequisites
1. **Node.js** (v18+)
2. **Supabase Account**: For database and authentication.
3. **OpenAI API Key**: For generating flashcards.

## Setup Instructions

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd flashcard-app
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### 3. Database Setup (Supabase)
1. Go to your Supabase project dashboard.
2. Go to **SQL Editor**.
3. Copy the contents of `supabase/schema.sql` and run it.
4. Go to **Authentication** -> **Providers** and enable **Email** (or others if you want).
5. (Optional) Disable "Confirm email" in Auth settings for easier testing.

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)
1. Push your code to GitHub.
2. Go to [Vercel](https://vercel.com) and import your project.
3. Add the Environment Variables (from step 2) in the Vercel dashboard.
4. Click **Deploy**.

## Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-3.5/4
