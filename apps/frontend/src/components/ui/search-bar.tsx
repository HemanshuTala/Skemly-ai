import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

export function SearchBar({ placeholder = 'Search...', onSearch, className }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-2 pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.08]',
          'bg-white/[0.02] text-white',
          'text-sm placeholder:text-[#52525b]',
          'hover:border-white/[0.20] hover:bg-white/[0.03] focus:border-white/[0.20] focus:bg-white/[0.03]',
          'transition-all relative',
          className
        )}
      >
        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-sm text-[#52525b]">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono bg-white dark:bg-neutral-900 rounded border border-neutral-300 dark:border-neutral-700">
          Ã¢Å’ËœK
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
            <div className="bg-[#0d0d10] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden">
              <form onSubmit={handleSearch}>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]">
                  <svg className="w-5 h-5 text-[#52525b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <kbd className="px-2 py-1 text-xs font-mono bg-white/[0.04] text-[#a1a1aa] rounded">ESC</kbd>
                  </button>
                </div>
              </form>
              
              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto p-2">
                {query ? (
                  <div className="text-center py-8 text-neutral-500">
                    Press Enter to search for "{query}"
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    Start typing to search...
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
