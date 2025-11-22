import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Use require for pdf-parse to avoid ESM issues
// @ts-ignore
const pdf = require('pdf-parse/lib/pdf-parse.js');

export const runtime = 'nodejs';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Parse PDF using pdf-parse (v1.1.1)
        const data = await pdf(buffer);
        const text = data.text;

        console.log("Extracted text length:", text.length);

        // Truncate text if too long for a single prompt (simple heuristic)
        // For a production app, we'd chunk this.
        const truncatedText = text.slice(0, 20000);

        const count = parseInt(formData.get('count') as string) || 10;
        const style = formData.get('style') as string || 'mixed';

        const prompt = `
      You are an expert at creating high-quality Anki flashcards for spaced repetition study.
      Your goal is to extract the most important information from the text and convert it into clear, atomic flashcards.

      **Configuration**:
      - **Target Card Count**: EXACTLY ${count} cards. (You MUST generate this many).
      - **Style**: ${style === 'cloze' ? 'Fill-in-the-blank (Cloze) style ONLY' : style === 'qa' ? 'Question & Answer style ONLY' : 'Mix of Q&A and Fill-in-the-blank'}.

      **Rules for High-Quality Flashcards**:
      1. **Atomic Principle (CRITICAL)**: Each card must test ONE specific fact or concept. 
         - BAD: "What are the functions of the liver?" (Too broad)
         - GOOD: "Which organ produces bile?" -> "Liver"
      2. **Cloze Format**: If style is 'cloze' or 'mixed', use "Fill-in-the-blank" style.
         - Format: Use "______" (6 underscores) for the blank.
         - Front: "The capital of France is ______."
         - Back: "Paris"
         - Front: "______ is the powerhouse of the cell."
         - Back: "Mitochondria"
      3. **Context**: If a term is ambiguous, provide context in the question (e.g., "In the context of React, what is a Hook?").
      4. **Formatting**: 
         - Use **Markdown** for bolding key terms.
         - Use **LaTeX** for math formulas (e.g., $E=mc^2$).
      5. **No Fluff**: Avoid "What is...", "Explain..." if possible. Go straight to the point.

      **Task**:
      Extract key concepts, definitions, formulas, and important facts from the text below.
      Return a JSON object with a "cards" array, where each object has "front" and "back".
      
      Text:
      ${truncatedText}
    `;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant that outputs JSON." },
                { role: "user", content: prompt }
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) {
            throw new Error('No content from OpenAI');
        }

        const result = JSON.parse(responseContent);
        return NextResponse.json(result);

    } catch (error) {
        console.error('Error processing PDF:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
