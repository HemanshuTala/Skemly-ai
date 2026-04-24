import crypto from 'crypto';
import Groq from 'groq-sdk';
import { Diagram, IDiagram } from '../models/diagram.model';
import { DiagramVersion } from '../models/diagram-version.model';
import { Note } from '../models/note.model';
import { Workspace } from '../models/workspace.model';
import { User, PLAN_LIMITS, IAIUsage } from '../models/user.model';
import { AuditLog } from '../models/audit-log.model';
import { ApiError } from '../middleware/errorHandler';
import { workspaceService } from './workspace.service';
import logger from '../utils/logger';

/**
 * §10 AI Integration Service
 * Groq integration with reasoning model for diagram generation, explanation, and improvement
 */
class AIService {
  private groq: Groq | null = null;
  // Using llama-3.3-70b-versatile - high performance model for reasoning tasks
  private readonly model = 'llama-3.3-70b-versatile';

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && apiKey !== 'your-groq-api-key-here') {
      this.groq = new Groq({ apiKey });
      logger.info('Groq API initialized with reasoning model: ' + this.model);
    } else {
      logger.warn('Groq API key not configured - AI features disabled');
    }
  }

  private checkAPIAvailable(): void {
    if (!this.groq) {
      throw new ApiError(
        503,
        'AI_UNAVAILABLE',
        'AI service is not configured. Please add GROQ_API_KEY to environment variables.'
      );
    }
  }

  private mapAIProviderError(error: any, fallbackMessage: string): never {
    const status = error?.status || error?.response?.status || 500;
    const providerMessage = String(
      error?.message || error?.response?.data?.error?.message || ''
    ).toLowerCase();

    logger.error(`Groq API Error [Status ${status}]: ${providerMessage}`, error);

    if (status === 429) {
      throw new ApiError(
        429,
        'AI_UNAVAILABLE',
        'AI service is currently busy or rate-limited. Please try again shortly.'
      );
    }
    
    if (status === 401 || status === 403) {
      throw new ApiError(
        403,
        'AI_UNAVAILABLE',
        'AI API authentication failed or permission denied.'
      );
    }

    if (status === 400 && (providerMessage.includes('token') || providerMessage.includes('context'))) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Prompt too long. Please simplify your request.');
    }

    throw new ApiError(500, 'INTERNAL_ERROR', fallbackMessage + ' DETAILS: ' + providerMessage + ' STATUS: ' + status);
  }

  /**
   * §10.1 System prompt for diagram generation
   */
  private getSystemPrompt(diagramType: string): string {
    return `You are a diagram generation assistant. Convert user descriptions into valid diagram syntax.

Output ONLY the raw syntax, no explanation, no markdown code blocks, no preamble.

Diagram type: ${diagramType}

Syntax format:
- Flowchart: [Node] --> [Another Node], {Decision} -- Yes --> [End]
- Sequence: @sequence\\nActor1 -> Actor2: Message\\nActor2 --> Actor1: Response
- System Design: [Service A] --> [Database], [API Gateway] ==> [Service B]

Rules:
1. Use square brackets [Label] for process nodes
2. Use curly braces {Label} for decision nodes
3. Use --> for solid arrows, ==> for thick arrows, -.-> for dashed
4. Keep labels concise and clear
5. If unclear, generate a reasonable interpretation
6. Support Unicode and emoji in labels

Generate ONLY the diagram syntax, nothing else.`;
  }

  /**
   * §AI-01 Generate diagram from prompt using Groq reasoning model
   */
  async generateDiagram(
    userId: string,
    prompt: string,
    diagramType: string,
    existingSyntax?: string
  ): Promise<{ syntax: string; conversationTurn: any }> {
    this.checkAPIAvailable();

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');

    if (!user.canUseAI('generate')) {
      throw new ApiError(
        429,
        'AI_LIMIT_REACHED',
        `Monthly AI generation limit reached. You have ${user.getRemainingAI('generate')} generations remaining.`
      );
    }

    const userContent = existingSyntax
      ? `Current diagram:\n\`\`\`\n${existingSyntax}\n\`\`\`\n\nUser request: ${prompt}`
      : prompt;

    try {
      const response = await this.groq!.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(diagramType),
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content?.trim() ?? '';
      // Remove reasoning tags if present (<think>...</think>)
      const syntax = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim().replace(/^```\w*\n|```$/g, '') ?? '';

      await this.incrementAIUsage(userId, 'generate');

      const conversationTurn = {
        role: 'assistant' as const,
        content: syntax,
        createdAt: new Date(),
      };

      logger.info(`AI diagram generated for user ${userId} using Groq reasoning model`);
      return { syntax, conversationTurn };
    } catch (error: any) {
      this.mapAIProviderError(error, 'AI generation failed. Please try again.');
    }
  }

  /**
   * §AI-01 Stream diagram generation (real-time updates) using Groq
   */
  async *streamDiagramGeneration(
    userId: string,
    prompt: string,
    diagramType: string,
    existingSyntax?: string
  ): AsyncGenerator<string, void, unknown> {
    this.checkAPIAvailable();

    const user = await User.findById(userId);
    if (!user || !user.canUseAI('generate')) {
      throw new ApiError(429, 'AI_LIMIT_REACHED', 'Monthly AI generation limit reached.');
    }

    const userContent = existingSyntax
      ? `Current diagram:\n\`\`\`\n${existingSyntax}\n\`\`\`\n\nUser request: ${prompt}`
      : prompt;

    try {
      const stream = await this.groq!.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(diagramType),
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
        temperature: 0.1,
        max_tokens: 4096,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        // Skip reasoning tags in streaming output
        if (content && !content.includes('<thinking') && !content.includes('</thinking')) {
          yield content;
        }
      }

      await this.incrementAIUsage(userId, 'generate');
    } catch (error: any) {
      this.mapAIProviderError(error, 'AI streaming failed.');
    }
  }

  /**
   * §AI-06 Explain diagram using Groq
   */
  async explainDiagram(
    userId: string,
    diagram: IDiagram,
    nodeId?: string
  ): Promise<string> {
    this.checkAPIAvailable();

    const user = await User.findById(userId);
    if (!user || !user.canUseAI('explain')) {
      throw new ApiError(429, 'AI_LIMIT_REACHED', 'Monthly AI explain limit reached.');
    }

    const targetNode = nodeId ? diagram.nodes.find(n => n.id === nodeId) : null;

    const prompt = targetNode
      ? `Explain this specific component in the diagram:\n\nComponent: ${targetNode.data.label}\nType: ${targetNode.type}\n\nFull diagram context:\n\`\`\`\n${diagram.syntax}\n\`\`\`\n\nProvide a clear, concise explanation of what this component does and how it fits in the overall system.`
      : `Explain what this diagram represents:\n\n\`\`\`\n${diagram.syntax}\n\`\`\`\n\nProvide a clear, concise explanation in plain English.`;

    try {
      const response = await this.groq!.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that explains diagrams clearly and concisely.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content?.trim() ?? '';
      // Remove reasoning tags if present
      const explanation = content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
      await this.incrementAIUsage(userId, 'explain');
      return explanation;
    } catch (error: any) {
      this.mapAIProviderError(error, 'AI explanation failed.');
    }
  }

  /**
   * §AI-08 Improve diagram suggestions using Groq
   */
  async improveDiagram(
    userId: string,
    diagram: IDiagram
  ): Promise<{ suggestions: string[]; improvedSyntax?: string }> {
    this.checkAPIAvailable();

    const user = await User.findById(userId);
    if (!user || !user.canUseAI('improve')) {
      throw new ApiError(429, 'AI_LIMIT_REACHED', 'Monthly AI improve limit reached.');
    }

    const prompt = `Analyze this diagram and provide improvement suggestions:\n\n\`\`\`\n${diagram.syntax}\n\`\`\`\n\nProvide:\n1. Layout improvements\n2. Missing nodes or connections\n3. Naming inconsistencies\n4. Best practices\n\nFormat as a numbered list of actionable suggestions.`;

    try {
      const response = await this.groq!.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a diagram analysis expert that provides actionable improvement suggestions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content?.trim() ?? '';
      // Remove reasoning tags if present
      const cleanContent = content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
      const suggestions = cleanContent.split('\n').filter(line => line.trim().match(/^\d+\./));

      await this.incrementAIUsage(userId, 'improve');
      return { suggestions };
    } catch (error: any) {
      this.mapAIProviderError(error, 'AI improvement analysis failed.');
    }
  }

  /**
   * §AI-10 Auto-fix syntax errors using Groq
   */
  async autofixSyntax(
    userId: string,
    syntax: string,
    errorMessage: string
  ): Promise<{ fixedSyntax: string; explanation: string }> {
    this.checkAPIAvailable();

    const user = await User.findById(userId);
    if (!user || !user.canUseAI('autofix')) {
      throw new ApiError(429, 'AI_LIMIT_REACHED', 'Monthly AI autofix limit reached.');
    }

    const prompt = `Fix this diagram syntax error:\n\nOriginal syntax:\n\`\`\`\n${syntax}\n\`\`\`\n\nError: ${errorMessage}\n\nProvide:\n1. The corrected syntax (in a code block)\n2. A brief explanation of what was fixed\n\nFormat:\n\`\`\`\n[corrected syntax]\n\`\`\`\n\nExplanation: [what was fixed]`;

    try {
      const response = await this.groq!.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a diagram syntax expert that fixes errors and explains the corrections.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content?.trim() ?? '';
      // Remove reasoning tags if present
      const cleanContent = content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();

      const codeBlockMatch = cleanContent.match(/```[\s\S]*?\n([\s\S]*?)```/);
      const fixedSyntax = codeBlockMatch ? codeBlockMatch[1].trim() : syntax;

      const explanationMatch = cleanContent.match(/Explanation:\s*(.+)/i);
      const explanation = explanationMatch ? explanationMatch[1].trim() : 'Syntax has been corrected.';

      await this.incrementAIUsage(userId, 'autofix');
      return { fixedSyntax, explanation };
    } catch (error: any) {
      this.mapAIProviderError(error, 'AI autofix failed.');
    }
  }

  /**
   * Increment AI usage counter with monthly reset
   */
  private async incrementAIUsage(userId: string, feature: keyof typeof User.prototype.aiUsage): Promise<void> {
    const user = await User.findById(userId);
    if (!user) return;

    const now   = new Date();
    const featureStr = String(feature);
    const usage = user.aiUsage[featureStr as keyof IAIUsage];

    if (usage.resetAt.getMonth() !== now.getMonth() || usage.resetAt.getFullYear() !== now.getFullYear()) {
      usage.count   = 0;
      usage.resetAt = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    usage.count += 1;
    await user.save();
  }

  /**
   * §AI-CODE Convert code to diagram
   */
  async codeToDiagram(
    userId: string,
    code: string,
    language: string,
    diagramType: string = 'flowchart'
  ): Promise<{ syntax: string }> {
    this.checkAPIAvailable();

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');

    if (!user.canUseAI('generate')) {
      throw new ApiError(
        429,
        'AI_LIMIT_REACHED',
        `Monthly AI generation limit reached. You have ${user.getRemainingAI('generate')} generations remaining.`
      );
    }

    if (!code || code.trim().length === 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Code cannot be empty');
    }

    if (code.length > 10000) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Code too long. Maximum 10000 characters.');
    }

    const systemPrompt = `You are a code analysis assistant that converts programming code into diagram syntax.

Analyze the provided ${language} code and generate a ${diagramType} diagram that represents:
- For flowcharts: Control flow, function calls, conditions, loops
- For sequence diagrams: Function/method interactions, API calls, data flow
- For system design: Architecture, components, dependencies, data stores

Output ONLY the raw diagram syntax, no explanation, no markdown code blocks, no preamble.

Diagram syntax format:
- Flowchart: [Node] --> [Another Node], {Decision} -- Yes --> [End]
- Sequence: @sequence\\nActor1 -> Actor2: Message\\nActor2 --> Actor1: Response
- System Design: [Service A] --> [Database], [API Gateway] ==> [Service B]

Rules:
1. Use square brackets [Label] for process nodes/functions
2. Use curly braces {Label} for decision nodes/conditions
3. Use --> for solid arrows, ==> for thick arrows, -.-> for dashed
4. Keep labels concise and clear
5. Focus on the main logic flow, not every single line
6. Group related operations into single nodes

Generate ONLY the diagram syntax, nothing else.`;

    try {
      const response = await this.groq!.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Analyze this ${language} code and generate a ${diagramType} diagram:\n\n\`\`\`${language}\n${code}\n\`\`\``,
          },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content?.trim() ?? '';
      // Remove reasoning tags and code blocks if present
      const syntax = content
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
        .trim()
        .replace(/^```\w*\n|```$/g, '')
        .trim();

      await this.incrementAIUsage(userId, 'generate');

      logger.info(`Code-to-diagram generated for user ${userId} (${language} → ${diagramType})`);
      return { syntax };
    } catch (error: any) {
      this.mapAIProviderError(error, 'Code-to-diagram conversion failed. Please try again.');
    }
  }

  /**
   * Validate and sanitize user prompt
   */
  validatePrompt(prompt: string): void {
    if (!prompt || prompt.trim().length === 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Prompt cannot be empty');
    }
    if (prompt.length > 2000) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Prompt too long. Maximum 2000 characters.');
    }
    const harmful = ['<script', 'javascript:', 'onerror=', 'onclick='];
    if (harmful.some(p => prompt.toLowerCase().includes(p))) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid prompt content');
    }
  }
}

export const aiService = new AIService();
