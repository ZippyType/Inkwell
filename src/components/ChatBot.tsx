import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  Image as ImageIcon, 
  ChevronDown, 
  ChevronUp,
  ChevronRight,
  Plus, 
  Replace,
  Brain,
  Search,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStudio } from '../context/StudioContext';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';

interface Message {
  role: 'user' | 'model';
  content: string;
  thoughts?: string;
  snippet?: string;
  snippetLineNumber?: number;
  imageUrl?: string;
  svgCode?: string;
  glossaryTerms?: { term: string; definition: string }[];
  isGenerating?: boolean;
}

export function ChatBot() {
  const { language, activeFileId, files, updateFileContent, addSnippet, addAsset, assets, addGlossaryTerm } = useStudio();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([])
  
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'model', content: t(language, 'aiGreeting') }]);
    }
  }, [language, messages.length]);
  const [loading, setLoading] = useState(false);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<number, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Check if user is asking for an image
      const isImageRequest = /\b(generate|create|make|draw)\b.*\b(image|picture|illustration|drawing)\b/i.test(userMessage);

      if (isImageRequest) {
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userMessage }),
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // Name the asset based on the prompt or a timestamp
        const assetName = `AI-${Date.now()}`;
        const finalUrl = await addAsset(data.imageUrl, assetName);

        setMessages(prev => [...prev, { 
          role: 'model', 
          content: "I've generated this illustration and added it to your Assets library:", 
          imageUrl: finalUrl,
          svgCode: data.svgCode,
          snippet: `![${assetName}](${finalUrl})`
        }]);
        setLoading(false);
      } else {
        const chatHistory = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));
        
        chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

        const activeDocContent = files.find(f => f.id === activeFileId)?.content || '';
        const linesWithNumbers = activeDocContent.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n');
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messages: chatHistory,
            systemInstruction: `You are Inkwell Studio's AI assistant. You help write books.
Here is the current document content (with line numbers):
${linesWithNumbers}

If you are suggesting a snippet to be inserted or replaced in the document, you MUST output a JSON code block with the new content and the target line number to replace:
\`\`\`json
{
  "snippet": "your new content",
  "lineNumber": 5
}
\`\`\`
If you suggest Glossary terms, add them to the JSON block:
\`\`\`json
{
  "glossary": [
    {"term": "Magic", "definition": "Energy"}
  ]
}
\`\`\`
If generating a chapter outline for the user to append, output a markdown outline snippet. Be creative but professional.`
          }),
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("No reader available");

        let done = false;
        let fullText = "";
        let fullThoughts = "";
        let buffer = "";
        let lastUpdateTime = 0;

        // Add a placeholder message for the stream
        setMessages(prev => [...prev, { role: 'model', content: "", isGenerating: true }]);

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            let updated = false;
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') {
                  done = true;
                  break;
                }
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.error) throw new Error(parsed.error);
                  if (parsed.text) { fullText += parsed.text; updated = true; }
                  if (parsed.thoughts) { fullThoughts += parsed.thoughts; updated = true; }
                } catch (e) {
                  // Ignore JSON parse errors for incomplete chunks
                }
              }
            }
            
            if (updated) {
              const now = Date.now();
              if (now - lastUpdateTime > 50 || done) {
                lastUpdateTime = now;
                setMessages(prev => {
                  const updatedArr = [...prev];
                  updatedArr[updatedArr.length - 1] = {
                    role: 'model',
                    content: fullText,
                    thoughts: fullThoughts,
                    isGenerating: !done
                  };
                  return updatedArr;
                });
              }
            }
          }
        }

        // Post-process the final accumulated text to extract the snippet and glossary
        let snippet = "";
        let lineNumber: number | undefined;
        let finalContent = fullText;
        let newGlossaryTerms: { term: string; definition: string }[] | undefined;
        
        const jsonMatch = fullText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            snippet = parsed.snippet || "";
            lineNumber = parsed.lineNumber;
            newGlossaryTerms = parsed.glossary;
            if (snippet || newGlossaryTerms) {
              finalContent = fullText.replace(jsonMatch[0], "").trim();
            }
          } catch (e) {}
        }

        if (!snippet && !newGlossaryTerms) {
          const snippetMatch = fullText.match(/```[\s\S]*?\n([\s\S]*?)```/);
          if (snippetMatch) {
            snippet = snippetMatch[1];
            finalContent = fullText.replace(snippetMatch[0], "").trim();
          }
        }

        if (snippet) {
          addSnippet(snippet, `Snippet ${new Date().toLocaleTimeString()}`);
        }

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'model',
            content: finalContent,
            thoughts: fullThoughts,
            snippet,
            snippetLineNumber: lineNumber,
            glossaryTerms: newGlossaryTerms,
            isGenerating: false
          };
          return updated;
        });
        setLoading(false);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', content: `Error: ${error.message}` }]);
      setLoading(false);
    }
  };

  const addSnippetToDoc = (snippet: string, lineNumber?: number) => {
    const activeFile = files.find(f => f.id === activeFileId);
    if (!activeFile || !activeFileId) return;

    if (lineNumber !== undefined) {
      const lines = (activeFile.content || '').split('\n');
      if (lineNumber > 0 && lineNumber <= lines.length) {
        lines[lineNumber - 1] = snippet;
        updateFileContent(activeFileId, lines.join('\n'));
      } else {
        updateFileContent(activeFileId, (activeFile.content || '') + "\n" + snippet);
      }
    } else {
      updateFileContent(activeFileId, (activeFile.content || '') + "\n\n" + snippet);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="p-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-300 dark:border-zinc-800 flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
        {t(language, 'inkwellAi')}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
            <div className={cn(
              "w-full rounded p-3 text-xs leading-relaxed",
              msg.role === 'user' 
                ? "bg-indigo-600/20 border border-indigo-500/20 text-indigo-100" 
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            )}>
              {msg.thoughts && (
                <div className="mb-2 bg-zinc-100 dark:bg-zinc-900/50 p-2 rounded border border-zinc-300 dark:border-zinc-800">
                  <button 
                    onClick={() => setExpandedThoughts(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    className="w-full flex items-center gap-1 text-[10px] text-zinc-500 cursor-pointer hover:text-zinc-600 dark:text-zinc-400"
                  >
                    <ChevronRight className={cn("w-3 h-3 transform transition-transform", expandedThoughts[idx] ? "rotate-90" : "")} />
                    Thinking Process
                  </button>
                  <AnimatePresence>
                    {expandedThoughts[idx] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 italic overflow-hidden"
                      >
                        {msg.thoughts}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <div className="prose dark:prose-invert prose-sm max-w-none break-words">
                  <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                </div>
              )}

              {msg.imageUrl && (
                <div className="mt-3 rounded border border-zinc-300 dark:border-zinc-700 overflow-hidden">
                  <img src={msg.imageUrl} alt="AI Generated" className="w-full h-auto" draggable onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', msg.snippet || '');
                  }} />
                </div>
              )}

              {msg.svgCode && (
                <div className="mt-2 text-xs border border-zinc-300 dark:border-zinc-800 rounded overflow-hidden">
                  <details className="group">
                    <summary className="bg-zinc-100 dark:bg-zinc-900 px-3 py-2 cursor-pointer list-none flex items-center justify-between text-zinc-600 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-300">
                      <span>View SVG Code</span>
                      <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="p-3 bg-zinc-950 overflow-x-auto max-h-60">
                      <pre className="text-[10px] text-zinc-500 whitespace-pre-wrap font-mono"><code>{msg.svgCode}</code></pre>
                    </div>
                  </details>
                </div>
              )}

              {msg.role === 'model' && !msg.isGenerating && (
                <div className="mt-2 pt-2 border-t border-zinc-300 dark:border-zinc-800/50 text-[9px] text-zinc-500 font-medium select-none">
                  Check important information
                </div>
              )}
            </div>

            {msg.snippet && (
              <div className="mt-3 flex gap-2 w-full">
                <button 
                  onClick={() => addSnippetToDoc(msg.snippet!, msg.snippetLineNumber)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-1.5 px-4 text-[10px] rounded flex items-center justify-center font-semibold transition-colors text-white"
                >
                  <Plus className="w-3 h-3 inline-block mr-1" />
                  {msg.snippetLineNumber ? t(language, 'replaceLine', { line: `${msg.snippetLineNumber}`}) : t(language, 'addSnippet')}
                </button>
              </div>
            )}

            {msg.glossaryTerms && msg.glossaryTerms.length > 0 && (
              <div className="mt-3 w-full flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Suggested Glossary Terms</span>
                {msg.glossaryTerms.map((term, i) => (
                  <div key={i} className="flex flex-col bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 p-2 rounded relative group">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{term.term}</span>
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-1">{term.definition}</span>
                    <button 
                      onClick={() => addGlossaryTerm(term.term, term.definition)}
                      className="absolute right-2 top-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Add to Glossary
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Sparkles className="w-4 h-4 animate-pulse text-purple-500" />
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-zinc-300 dark:border-zinc-800 shrink-0">
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t(language, 'askAboutBook')}
            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-full px-4 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1.5 p-1 text-zinc-500 hover:text-indigo-400 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
