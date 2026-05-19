import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    try {
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-2.0-flash-lite",
        contents: messages,
        config: {
          systemInstruction: systemInstruction || "You are a helpful writing assistant for a book editor called Inkwell Studio. You can suggest snippets and critique content.",
        },
      });

      for await (const chunk of responseStream) {
        const payload = JSON.stringify({
          text: chunk.text || "",
          thoughts: "" 
        });
        res.write(`data: ${payload}\n\n`);
      }
      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (apiError: any) {
      if (apiError.message?.includes('429') || apiError.message?.includes('RESOURCE_EXHAUSTED') || apiError.message?.includes('403') || apiError.message?.includes('SCOPE_INSUFFICIENT')) {
        console.log("Falling back to OpenRouter for Chat Stream");
        
        const openRouterMessages = [];
        if (systemInstruction) {
          openRouterMessages.push({ role: "system", content: systemInstruction });
        }
        for (const m of messages) {
          openRouterMessages.push({ role: m.role === 'model' ? 'assistant' : 'user', content: m.parts[0].text });
        }

        const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY || 'OPENROUTER_API_KEY'}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openrouter/free",
            messages: openRouterMessages,
            service_tier: "flex",
            stream: true
          })
        });
        
        if (!orResponse.ok) {
           throw new Error("OpenRouter error: " + orResponse.statusText);
        }
        
        if (!orResponse.body) {
           res.write(`data: [DONE]\n\n`);
           return res.end();
        }

        const reader = orResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              if (line.includes('[DONE]')) continue;
              try {
                const parsed = JSON.parse(line.slice(6));
                const textChunk = parsed.choices?.[0]?.delta?.content || "";
                if (textChunk) {
                  res.write(`data: ${JSON.stringify({ text: textChunk, thoughts: "" })}\n\n`);
                }
              } catch (e) {}
            }
          }
        }
        res.write(`data: [DONE]\n\n`);
        res.end();
      } else {
        throw apiError;
      }
    }
  } catch (error: any) {
    console.error("Chat Error:", error);
    res.write(`data: {"error": ${JSON.stringify(error.message)}}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
});

app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, aspectRatio = "1:1" } = req.body;
    
    const svgSystemInstruction = `You are a professional SVG illustrator. 
    Generate a beautiful, modern, and clean SVG illustration based on the user's prompt. 
    ONLY output the SVG code. Do not include any explanation or markdown code blocks. 
    Ensure the SVG is responsive (uses viewBox and no internal width/height) and looks good on dark backgrounds. 
    Use a minimalist style with elegant path work.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: {
          parts: [{ text: `Create a professional SVG illustration for: ${prompt}. Return ONLY the valid SVG code.` }],
        },
        config: {
          systemInstruction: svgSystemInstruction,
          maxOutputTokens: 4096,
        }
      });

      let imageUrl = "";
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Look for SVG code
      const svgMatch = text.match(/<svg[\s\S]*?\/svg>/i);
      let svgCode = "";
      if (svgMatch) {
         svgCode = svgMatch[0];
         // Use UTF-8 encoding for SVG data URL (more readable than base64)
         const encodedSvg = encodeURIComponent(svgCode)
           .replace(/'/g, '%27')
           .replace(/"/g, '%22');
         imageUrl = `data:image/svg+xml;utf8,${encodedSvg}`;
      } else {
        // Fallback to text URL check
        const urlMatch = text.match(/https?:\/\/[^\s)]+/);
        if (urlMatch) imageUrl = urlMatch[0];
      }

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) {
        throw new Error("No image or SVG generated by model");
      }

      res.json({ imageUrl, svgCode });
    } catch (apiError: any) {
      if (apiError.message?.includes('429') || apiError.message?.includes('RESOURCE_EXHAUSTED') || apiError.message?.includes('402') || apiError.message?.includes('403') || apiError.message?.includes('SCOPE_INSUFFICIENT')) {
        console.log("Falling back to OpenRouter for SVG/Image Gen");
        
        const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY || 'OPENROUTER_API_KEY'}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [
              { role: "system", content: svgSystemInstruction },
              { role: "user", content: `Create a professional SVG illustration for: ${prompt}. Return ONLY the valid SVG code.` }
            ],
            max_tokens: 2048,
            service_tier: "flex"
          })
        });

        const orData = await orResponse.json();
        if (orData.error) throw new Error("OpenRouter " + JSON.stringify(orData.error));

        const reply = orData.choices?.[0]?.message?.content || "";
        const svgMatch = reply.match(/<svg[\s\S]*?\/svg>/i);
        
        if (svgMatch) {
           const svgCode = svgMatch[0];
           const encodedSvg = encodeURIComponent(svgCode)
             .replace(/'/g, '%27')
             .replace(/"/g, '%22');
           res.json({ 
             imageUrl: `data:image/svg+xml;utf8,${encodedSvg}`,
             svgCode 
           });
        } else {
           const urlMatch = reply.match(/https?:\/\/[^\s)]+/);
           res.json({ imageUrl: urlMatch ? urlMatch[0] : "" });
        }
      } else {
        throw apiError;
      }
    }
  } catch (error: any) {
    console.error("Image Gen Error:", error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
