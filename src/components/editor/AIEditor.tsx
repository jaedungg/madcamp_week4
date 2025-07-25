'use client';

import React, { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { motion } from 'framer-motion';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Type,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CommandPalette from './CommandPalette';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  isActive,
  disabled,
  children,
  title
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'p-2 rounded-lg transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
  >
    {children}
  </motion.button>
);

interface AIEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

type Command = { id: string; label: string; /* 필요시 추가 필드 */ };

export default function AIEditor({
  content = '',
  onChange,
  placeholder = "Start writing or type '/' for AI commands...",
  className
}: AIEditorProps) {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPalettePosition, setCommandPalettePosition] = useState({ x: 0, y: 0 });

  const handleSlashCommand = useCallback(() => {
    // Get current cursor position for command palette placement
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setCommandPalettePosition({
        x: rect.left,
        y: rect.bottom + 10
      });
    }
    setShowCommandPalette(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-neutral dark:prose-invert max-w-none',
          'min-h-[500px] w-full p-6 rounded-lg border border-border bg-background',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'text-foreground placeholder:text-muted-foreground',
          className
        ),
      },
      handleKeyDown: (view, event) => {
        // Detect "/" key to trigger command palette
        if (event.key === '/') {
          // Small delay to allow the "/" character to be inserted first
          setTimeout(() => {
            handleSlashCommand();
          }, 0);
        }
        return false; // Let the event continue
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    immediatelyRender: false, // 이 줄 추가!
  }, [handleSlashCommand]);

  const handleCommandSelect = useCallback((command: Command) => {
    if (editor) {
      // Remove the "/" character that triggered the command
      const { from } = editor.state.selection;
      editor.chain().focus().deleteRange({ from: from - 1, to: from }).run();

      // Insert template content or trigger AI action
      // TODO: Implement actual command execution
      const templateContent = getTemplateContent(command.id);
      if (templateContent) {
        editor.chain().focus().insertContent(templateContent).run();
      }
    }
    setShowCommandPalette(false);
  }, [editor]);

  const getTemplateContent = (commandId: string): string => {
    const templates: Record<string, string> = {
      'business-email': `<h3>Subject: [Your Subject Here]</h3><p>Dear [Recipient Name],</p><p>I hope this email finds you well. I am writing to...</p><p>Best regards,<br>[Your Name]</p>`,
      'personal-letter': `<p>Dear [Name],</p><p>I hope you's doing well. I wanted to reach out because...</p><p>With warm regards,<br>[Your Name]</p>`,
      'thank-you': `<p>Dear [Name],</p><p>Thank you so much for [specific reason]. Your [help/support/kindness] meant a lot to me...</p><p>Gratefully yours,<br>[Your Name]</p>`,
      'job-application': `<p>Dear Hiring Manager,</p><p>I am writing to express my interest in the [Position Title] role at [Company Name]. With my background in [relevant experience]...</p><p>Sincerely,<br>[Your Name]</p>`,
      'casual-message': `<p>Hey [Name]!</p><p>Hope you's doing great! I just wanted to [reason for message]...</p><p>Talk soon!<br>[Your Name]</p>`
    };
    return templates[commandId] || '';
  };

  if (!editor) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-muted rounded-lg mb-4"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-card border border-border rounded-lg">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 pr-2 border-r border-border">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 pr-2 border-r border-border">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Lists & Quote */}
        <div className="flex items-center gap-1 pr-2 border-r border-border">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* AI Trigger Button */}
        <div className="ml-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            onClick={() => {
              // TODO: Implement AI command palette
              console.log('AI command palette triggered');
            }}
          >
            <Type className="w-4 h-4" />
            <span className="text-sm">AI</span>
          </motion.button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <EditorContent
          editor={editor}
          placeholder={placeholder}
        />

        {/* Placeholder when empty */}
        {editor.isEmpty && (
          <div className="absolute top-6 left-6 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4">
          <span>
            {editor.storage.characterCount?.characters() || 0} characters
          </span>
          <span>
            {editor.storage.characterCount?.words() || 0} words
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Type &apos;/&apos; for AI commands</span>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onCommand={handleCommandSelect}
        position={commandPalettePosition}
      />
    </div>
  );
}