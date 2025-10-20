'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeSnippetProps {
  code: string;
  language?: string;
  filename?: string;
  lineNumbers?: boolean;
  className?: string;
}

export function CodeSnippet({
  code,
  language = 'text',
  filename,
  lineNumbers = false,
  className
}: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const lines = code.split('\n');

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Header */}
      {(filename || language) && (
        <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="text-sm font-medium text-foreground">{filename}</span>
            )}
            {language && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                {language}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-6 w-6 p-0"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </div>
      )}

      {/* Code Content */}
      <div className="relative">
        <pre className="overflow-x-auto p-3 text-sm bg-background">
          <code className="text-foreground">
            {lineNumbers ? (
              <div className="flex">
                <div className="select-none text-muted-foreground border-r border-border pr-3 mr-3">
                  {lines.map((_, index) => (
                    <div key={index} className="text-right min-w-[2rem]">
                      {index + 1}
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  {lines.map((line, index) => (
                    <div key={index} className="min-h-[1.25rem]">
                      {line || ' '}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              code
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}

interface InlineCodeProps {
  children: React.ReactNode;
  className?: string;
}

export function InlineCode({ children, className }: InlineCodeProps) {
  return (
    <code className={cn(
      "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm",
      className
    )}>
      {children}
    </code>
  );
}