import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Copy, Check, Wand2, Code2, Terminal, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_PROMPT_TEMPLATES, SUGGESTED_PROMPTS } from '@/lib/aiPrompts';
import type { AIPromptTemplate } from '@/lib/aiPrompts';
import { aiAPI } from '@/services/api.service';
import toast from 'react-hot-toast';

interface AIAssistantProps {
  onGenerate: (code: string) => void;
  currentCode?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  code?: string;
  timestamp: Date;
}

type TabType = 'prompt' | 'code';

export function AIAssistant({ onGenerate }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('prompt');
  const [input, setInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [diagramType, setDiagramType] = useState('flowchart');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'I can help you create diagrams from text prompts or convert your code into diagrams.',
      timestamp: new Date(),
    },
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<AIPromptTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const handleGenerate = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    const promptText = input;
    setInput('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await aiAPI.generate({
        prompt: promptText,
        diagramType: selectedTemplate?.diagramType || 'flowchart',
      });

      const generatedCode = response.data?.data?.syntax || '';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've created a diagram based on: "${promptText}"`,
        code: generatedCode,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      toast.success('Diagram generated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to generate diagram');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error generating the diagram. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  }, [input, isGenerating, selectedTemplate]);

  const handleCodeToDiagram = useCallback(async () => {
    if (!codeInput.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Convert ${language} code to ${diagramType} diagram`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      const response = await aiAPI.codeToDiagram({
        code: codeInput,
        language,
        diagramType,
      });

      const generatedCode = response.data?.data?.syntax || '';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've converted your ${language} code into a ${diagramType} diagram`,
        code: generatedCode,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      toast.success('Code converted to diagram successfully');
      setCodeInput(''); 
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to convert code');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error converting your code. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  }, [codeInput, language, diagramType, isGenerating]);

  const handleApplyCode = (code: string) => {
    onGenerate(code);
    setIsOpen(false);
  };

  const handleCopyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTemplateSelect = (template: AIPromptTemplate) => {
    setSelectedTemplate(template);
    setShowTemplates(false);
    setInput(`Create ${template.name.toLowerCase()}: ${template.exampleInput}`);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl',
          'bg-white text-[#09090b] font-bold text-xs shadow-2xl tracking-wide uppercase',
          'hover:bg-[#e4e4e7] transition-all duration-200 select-none border border-transparent',
          isOpen && 'hidden'
        )}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>AI Copilot</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-50 w-[420px] rounded-2xl border border-white/[0.08] bg-[#0d0d10] shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[600px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0a0a0d] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.07] border border-white/[0.10] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-white">AI Copilot</h3>
                  <p className="text-[10px] text-[#52525b]">System Design Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-colors"
                aria-label="Close Assistant"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/[0.05] bg-[#0a0a0d] shrink-0 p-1">
              <button
                onClick={() => setActiveTab('prompt')}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-150',
                  activeTab === 'prompt'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-[#52525b] hover:text-[#a1a1aa] hover:bg-white/[0.03]'
                )}
              >
                Text Prompt
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-150',
                  activeTab === 'code'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-[#52525b] hover:text-[#a1a1aa] hover:bg-white/[0.03]'
                )}
              >
                Code to Diagram
              </button>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 custom-scrollbar min-h-0 bg-[#0d0d10]">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex flex-col gap-1.5',
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed',
                      message.role === 'user'
                        ? 'bg-white text-[#09090b] font-medium'
                        : 'bg-white/[0.03] text-[#a1a1aa] border border-white/[0.06]'
                    )}
                  >
                    <p>{message.content}</p>
                  </div>

                  {message.code && (
                    <div className="w-full bg-[#070709] rounded-xl border border-white/[0.06] overflow-hidden mt-1 shadow-lg">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05] bg-white/[0.02]">
                        <span className="text-[10px] font-mono text-[#52525b] tracking-wider uppercase">Generated Syntax</span>
                        <button
                          onClick={() => handleCopyCode(message.code!, message.id)}
                          className="p-1 rounded-md text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-colors"
                          aria-label="Copy code"
                        >
                          {copiedId === message.id ? <Check className="w-3 h-3 text-[#4ade80]" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <pre className="p-3 text-[11px] font-mono text-[#a1a1aa] max-h-[140px] overflow-y-auto custom-scrollbar">
                        {message.code}
                      </pre>
                      <div className="px-3 py-2 border-t border-white/[0.05] bg-white/[0.01]">
                        <button
                          onClick={() => handleApplyCode(message.code!)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/[0.06] text-white text-[12px] font-semibold hover:bg-white hover:text-[#09090b] transition-all border border-white/[0.08] hover:border-white"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          Apply to Canvas
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isGenerating && (
                <div className="flex items-center gap-2.5 text-[#52525b]">
                  <div className="flex gap-1">
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 h-1.5 rounded-full bg-[#52525b]" />
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.25 }} className="w-1.5 h-1.5 rounded-full bg-[#52525b]" />
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.5 }} className="w-1.5 h-1.5 rounded-full bg-[#52525b]" />
                  </div>
                  <span className="text-[11px] font-medium tracking-wide uppercase">AI is thinking…</span>
                </div>
              )}
            </div>

            {/* Template selector pane */}
            {showTemplates && activeTab === 'prompt' && (
              <div className="border-t border-white/[0.06] bg-[#070709] p-3 max-h-[160px] overflow-y-auto shrink-0 custom-scrollbar">
                <p className="text-[9px] font-bold text-[#52525b] uppercase tracking-[0.08em] mb-2">Prompt Presets</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {AI_PROMPT_TEMPLATES.slice(0, 4).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="text-left p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.10] hover:bg-white/[0.04] transition-all"
                    >
                      <p className="text-[11px] font-semibold text-white">{template.name}</p>
                      <p className="text-[9px] text-[#52525b] line-clamp-1 mt-0.5">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions area */}
            <div className="p-3 border-t border-white/[0.06] bg-[#0a0a0d] shrink-0">
              {activeTab === 'prompt' ? (
                <div className="space-y-2">
                  {!showTemplates && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
                      {SUGGESTED_PROMPTS.slice(0, 2).map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => handleSuggestedPrompt(prompt)}
                          className="shrink-0 text-[10px] text-[#52525b] hover:text-[#a1a1aa] bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.10] px-2.5 py-1 rounded-md transition-all truncate max-w-[200px]"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleGenerate();
                        }
                      }}
                      placeholder="Ask copilot to draw something…"
                      className="flex-1 min-h-[38px] max-h-[120px] px-3 py-2 text-[13px] bg-white/[0.03] border border-white/[0.07] rounded-xl text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.15] focus:bg-white/[0.05] transition-all resize-none custom-scrollbar"
                      rows={1}
                    />
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="text-[9px] font-bold text-[#52525b] hover:text-white uppercase tracking-[0.08em] transition-colors py-0.5 select-none"
                      >
                        {showTemplates ? 'Close' : 'Presets'}
                      </button>
                      <button
                        onClick={handleGenerate}
                        disabled={!input.trim() || isGenerating}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-[#09090b] hover:bg-[#e4e4e7] disabled:opacity-40 transition-colors shrink-0 shadow-lg"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#52525b] uppercase tracking-[0.08em]">Language</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-2 py-1.5 text-[11px] bg-white/[0.03] border border-white/[0.07] rounded-lg text-white focus:outline-none focus:border-white/[0.15] transition-all"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="csharp">C#</option>
                        <option value="go">Go</option>
                        <option value="rust">Rust</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#52525b] uppercase tracking-[0.08em]">Diagram Type</label>
                      <select
                        value={diagramType}
                        onChange={(e) => setDiagramType(e.target.value)}
                        className="w-full px-2 py-1.5 text-[11px] bg-white/[0.03] border border-white/[0.07] rounded-lg text-white focus:outline-none focus:border-white/[0.15] transition-all"
                      >
                        <option value="flowchart">Flowchart</option>
                        <option value="sequence">Sequence</option>
                        <option value="class">Class Diagram</option>
                      </select>
                    </div>
                  </div>
                  <textarea
                    ref={codeTextareaRef}
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Paste code snippet here…"
                    className="w-full h-[100px] px-3 py-2 text-[11px] font-mono bg-white/[0.03] border border-white/[0.07] rounded-xl text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.15] focus:bg-white/[0.05] transition-all resize-none custom-scrollbar"
                  />
                  <button
                    onClick={handleCodeToDiagram}
                    disabled={!codeInput.trim() || isGenerating}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white text-[#09090b] text-[12px] font-bold hover:bg-[#e4e4e7] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    Convert code to diagram
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
