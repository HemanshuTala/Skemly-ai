import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Copy, Check, Wand2, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
      toast.success('Code converted to diagram successfully!');
      setCodeInput(''); // Clear code input after successful conversion
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl',
          'bg-white text-[#18181b] font-semibold text-sm shadow-2xl',
          'hover:shadow-white/30 transition-all',
          isOpen && 'hidden'
        )}
      >
        <Sparkles className="w-4 h-4" />
        <span>AI Assistant</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] rounded-2xl border border-[#3f3f46] bg-[#18181b] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">AI Assistant</h3>
                  <p className="text-[10px] text-[#71717a]">Generate diagrams with AI</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#27272a] bg-[#09090b]">
              <button
                onClick={() => setActiveTab('prompt')}
                className={cn(
                  'flex-1 px-4 py-2.5 text-xs font-medium transition-colors',
                  activeTab === 'prompt'
                    ? 'text-white border-b-2 border-white'
                    : 'text-[#71717a] hover:text-white'
                )}
              >
                <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
                Text Prompt
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={cn(
                  'flex-1 px-4 py-2.5 text-xs font-medium transition-colors',
                  activeTab === 'code'
                    ? 'text-white border-b-2 border-white'
                    : 'text-[#71717a] hover:text-white'
                )}
              >
                <Code2 className="w-3.5 h-3.5 inline mr-1.5" />
                Code to Diagram
              </button>
            </div>

            <div className="h-[280px] overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex flex-col gap-2',
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm',
                      message.role === 'user'
                        ? 'bg-white text-[#18181b] rounded-br-md'
                        : 'bg-[#27272a] text-white border border-[#3f3f46] rounded-bl-md'
                    )}
                  >
                    <p className="leading-relaxed">{message.content}</p>
                  </div>

                  {message.code && (
                    <div className="w-full bg-[#09090b] rounded-xl border border-[#27272a] overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-[#27272a] bg-[#18181b]">
                        <span className="text-[10px] font-medium text-[#71717a] uppercase">Diagram Code</span>
                        <button
                          onClick={() => handleCopyCode(message.code!, message.id)}
                          className="p-1 rounded-md text-[#71717a] hover:text-white hover:bg-[#27272a]"
                        >
                          {copiedId === message.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <pre className="p-3 text-[11px] font-mono text-[#a1a1aa] max-h-[100px] overflow-y-auto">
                        {message.code}
                      </pre>
                      <div className="px-3 py-2 border-t border-[#27272a] bg-[#18181b]">
                        <Button size="sm" onClick={() => handleApplyCode(message.code!)} className="w-full">
                          <Wand2 className="w-3.5 h-3.5 mr-2" />
                          Apply to Editor
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isGenerating && (
                <div className="flex items-center gap-3 text-[#71717a]">
                  <div className="flex gap-1">
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-2 h-2 rounded-full bg-white" />
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 rounded-full bg-white" />
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <span className="text-xs">Generating...</span>
                </div>
              )}
            </div>

            {showTemplates && (
              <div className="border-t border-[#27272a] bg-[#09090b] p-3 max-h-[180px] overflow-y-auto">
                <p className="text-[10px] font-semibold text-[#71717a] uppercase mb-2">Templates</p>
                <div className="grid grid-cols-2 gap-2">
                  {AI_PROMPT_TEMPLATES.slice(0, 4).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="text-left p-2.5 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] transition-colors"
                    >
                      <p className="text-xs font-medium text-white">{template.name}</p>
                      <p className="text-[10px] text-[#71717a] line-clamp-1">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 border-t border-[#27272a] bg-[#18181b]">
              {activeTab === 'prompt' ? (
                <>
                  {!showTemplates && SUGGESTED_PROMPTS.slice(0, 2).map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="w-full text-left px-3 py-2 text-xs text-[#71717a] hover:text-white hover:bg-[#27272a] rounded-lg transition-colors mb-1 truncate"
                    >
                      {prompt}
                    </button>
                  ))}

                  <div className="flex items-end gap-2 mt-2">
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
                      placeholder="Describe your diagram..."
                      className="flex-1 min-h-[44px] max-h-[120px] px-3 py-2.5 text-sm bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder:text-[#71717a] focus:outline-none focus:border-white resize-none"
                      rows={1}
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="px-2 py-1 text-[10px] font-medium text-[#71717a] hover:text-white transition-colors"
                      >
                        {showTemplates ? 'Hide' : 'Templates'}
                      </button>
                      <button
                        onClick={handleGenerate}
                        disabled={!input.trim() || isGenerating}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-[#18181b] hover:bg-[#e4e4e7] disabled:opacity-40 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2 mb-3">
                    <div className="flex gap-2">
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-[#27272a] border border-[#3f3f46] rounded-lg text-white focus:outline-none focus:border-white"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="csharp">C#</option>
                        <option value="go">Go</option>
                        <option value="rust">Rust</option>
                        <option value="php">PHP</option>
                        <option value="ruby">Ruby</option>
                      </select>
                      <select
                        value={diagramType}
                        onChange={(e) => setDiagramType(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-[#27272a] border border-[#3f3f46] rounded-lg text-white focus:outline-none focus:border-white"
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
                    placeholder="Paste your code here..."
                    className="w-full h-[120px] px-3 py-2.5 text-xs font-mono bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder:text-[#71717a] focus:outline-none focus:border-white resize-none mb-2"
                  />
                  <Button
                    onClick={handleCodeToDiagram}
                    disabled={!codeInput.trim() || isGenerating}
                    className="w-full"
                    size="sm"
                  >
                    {isGenerating ? 'Converting...' : 'Convert to Diagram'}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
