import { useCallback, useRef, useState, useEffect } from 'react';
import { aiAPI } from '@/services/api.service';

export type AIGenerateStatus =
  | 'idle'
  | 'understanding'
  | 'designing'
  | 'generating'
  | 'validating'
  | 'done'
  | 'error'
  | 'cancelled';

const STATUS_LABELS: Record<AIGenerateStatus, string> = {
  idle: '',
  understanding: 'Understanding requirements…',
  designing: 'Designing service boundaries…',
  generating: 'Creating architecture…',
  validating: 'Validating output…',
  done: 'Architecture ready',
  error: 'Generation failed',
  cancelled: 'Cancelled',
};

function validateSyntax(syntax: string): boolean {
  if (!syntax || syntax.trim().length < 10) return false;
  const hasNodes = /\[.+?\]|\{.+?\}|\(.+?\)/.test(syntax);
  return hasNodes;
}

export function useAIGenerate() {
  const [status, setStatus] = useState<AIGenerateStatus>('idle');
  const [streamedText, setStreamedText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const cancelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genIdRef = useRef(0);

  const statusLabel = STATUS_LABELS[status];
  const isGenerating = ['understanding', 'designing', 'generating', 'validating'].includes(status);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus('cancelled');
    setStreamedText('');
    if (cancelTimeoutRef.current) clearTimeout(cancelTimeoutRef.current);
    cancelTimeoutRef.current = setTimeout(() => {
      setStatus('idle');
      cancelTimeoutRef.current = null;
    }, 1500);
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setStreamedText('');
    setErrorMessage('');
    if (cancelTimeoutRef.current) {
      clearTimeout(cancelTimeoutRef.current);
      cancelTimeoutRef.current = null;
    }
  }, []);

  /**
   * Generate a diagram using streaming SSE when available.
   * Returns the final syntax string, or throws on error/cancel.
   */
  const generate = useCallback(async (params: {
    prompt: string;
    diagramType?: string;
    diagramId?: string;
    existingSyntax?: string;
  }): Promise<string> => {
    if (cancelTimeoutRef.current) {
      clearTimeout(cancelTimeoutRef.current);
      cancelTimeoutRef.current = null;
    }

    // Increment generation ID
    const currentGenId = ++genIdRef.current;

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStatus('understanding');
    setStreamedText('');
    setErrorMessage('');

    // Simulate progress through phases (SSE progress not from model)
    const phaseTimer1 = setTimeout(() => {
      if (genIdRef.current === currentGenId) setStatus('designing');
    }, 1200);
    const phaseTimer2 = setTimeout(() => {
      if (genIdRef.current === currentGenId) setStatus('generating');
    }, 2500);

    try {
      // Try streaming endpoint
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';

      let fullSyntax = '';
      let streamingWorked = false;

      try {
        const response = await fetch(`${baseUrl}/ai/stream-generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            prompt: params.prompt,
            diagramType: params.diagramType || 'flowchart',
            diagramId: params.diagramId,
          }),
          signal: abortRef.current.signal,
        });

        if (response.ok && response.body) {
          streamingWorked = true;
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n');

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const json = JSON.parse(line.slice(6));
                if (json.done) {
                  fullSyntax = json.fullSyntax || fullSyntax;
                } else if (json.chunk) {
                  fullSyntax += json.chunk;
                  // Only update UI every ~10 chars to avoid excessive renders
                  if (fullSyntax.length % 10 === 0) {
                    if (genIdRef.current === currentGenId) {
                      setStreamedText(fullSyntax);
                    }
                  }
                } else if (json.error) {
                  throw new Error(json.error);
                }
              } catch { /* ignore parse errors for partial chunks */ }
            }
          }
        }
      } catch (streamError: any) {
        if (streamError?.name === 'AbortError') throw streamError;
        // Streaming failed, fall through to regular endpoint
      }

      if (!streamingWorked || !fullSyntax) {
        // Fall back to regular endpoint
        if (genIdRef.current !== currentGenId) throw new DOMException('Stale', 'AbortError');
        const res = await aiAPI.generate({
          prompt: params.prompt,
          diagramType: params.diagramType || 'flowchart',
          diagramId: params.diagramId,
        });
        fullSyntax = res.data?.data?.syntax || '';
      }

      // Stale check before applying
      if (genIdRef.current !== currentGenId) {
        throw new DOMException('Stale request', 'AbortError');
      }

      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);

      setStatus('validating');

      if (!validateSyntax(fullSyntax)) {
        // Auto-repair attempt via regular endpoint
        const repairRes = await aiAPI.generate({
          prompt: `Fix this diagram syntax to be valid: ${fullSyntax.substring(0, 500)}. Output only valid diagram syntax with [Node] --> [Node] format.`,
          diagramType: params.diagramType || 'flowchart',
        });
        const repaired = repairRes.data?.data?.syntax || '';
        if (repaired && validateSyntax(repaired)) {
          fullSyntax = repaired;
        }
      }

      if (genIdRef.current !== currentGenId) {
        throw new DOMException('Stale request', 'AbortError');
      }

      setStreamedText(fullSyntax);
      setStatus('done');
      setTimeout(() => {
        if (genIdRef.current === currentGenId) setStatus('idle');
      }, 2000);

      return fullSyntax;
    } catch (err: any) {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);

      if (err?.name === 'AbortError') {
        if (genIdRef.current === currentGenId) {
          setStatus('cancelled');
          setTimeout(() => setStatus('idle'), 1500);
        }
        throw err;
      }

      if (genIdRef.current === currentGenId) {
        setErrorMessage(err?.response?.data?.error?.message || err?.message || 'AI generation failed');
        setStatus('error');
      }
      throw err;
    }
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (cancelTimeoutRef.current) {
        clearTimeout(cancelTimeoutRef.current);
      }
    };
  }, []);

  return {
    generate,
    cancel,
    reset,
    status,
    statusLabel,
    isGenerating,
    streamedText,
    errorMessage,
  };
}
