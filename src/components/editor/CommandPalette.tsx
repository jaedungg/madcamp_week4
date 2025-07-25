'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  MessageSquare, 
  PenTool, 
  Heart, 
  Briefcase, 
  Coffee,
  Sparkles,
  Type,
  ArrowUp,
  ArrowDown,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'templates' | 'ai' | 'formatting';
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: Command) => void;
  position?: { x: number; y: number };
}

const commands: Command[] = [
  // Template Commands
  {
    id: 'business-email',
    label: 'Business Email',
    description: 'Professional email template',
    icon: Mail,
    category: 'templates',
    action: () => console.log('Business email')
  },
  {
    id: 'personal-letter',
    label: 'Personal Letter',
    description: 'Warm, personal letter template',
    icon: MessageSquare,
    category: 'templates',
    action: () => console.log('Personal letter')
  },
  {
    id: 'thank-you',
    label: 'Thank You Note',
    description: 'Express gratitude professionally',
    icon: Heart,
    category: 'templates',
    action: () => console.log('Thank you note')
  },
  {
    id: 'job-application',
    label: 'Job Application',
    description: 'Cover letter for job applications',
    icon: Briefcase,
    category: 'templates',
    action: () => console.log('Job application')
  },
  {
    id: 'casual-message',
    label: 'Casual Message',
    description: 'Friendly, informal message',
    icon: Coffee,
    category: 'templates',
    action: () => console.log('Casual message')
  },
  
  // AI Commands
  {
    id: 'improve-writing',
    label: 'Improve Writing',
    description: 'Enhance clarity and flow',
    icon: Sparkles,
    category: 'ai',
    action: () => console.log('Improve writing')
  },
  {
    id: 'change-tone',
    label: 'Change Tone',
    description: 'Adjust formality and emotion',
    icon: Type,
    category: 'ai',
    action: () => console.log('Change tone')
  },
  {
    id: 'expand-text',
    label: 'Expand Text',
    description: 'Add more detail and context',
    icon: ArrowUp,
    category: 'ai',
    action: () => console.log('Expand text')
  },
  {
    id: 'summarize',
    label: 'Summarize',
    description: 'Make text more concise',
    icon: ArrowDown,
    category: 'ai',
    action: () => console.log('Summarize')
  }
];

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  onCommand, 
  position = { x: 0, y: 0 } 
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState(commands);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter commands based on search query
  useEffect(() => {
    const filtered = commands.filter(command =>
      command.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      command.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleCommandSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleCommandSelect = (command: Command) => {
    onCommand(command);
    onClose();
    setSearchQuery('');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'templates': return '📝';
      case 'ai': return '✨';
      case 'formatting': return '🎨';
      default: return '⚡';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'templates': return 'text-blue-500';
      case 'ai': return 'text-purple-500';
      case 'formatting': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 w-96 bg-card border border-border rounded-lg shadow-2xl"
        style={{
          left: Math.min(position.x, window.innerWidth - 400),
          top: Math.min(position.y, window.innerHeight - 400),
        }}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search commands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <p>No commands found</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredCommands.map((command, index) => {
                const Icon = command.icon;
                return (
                  <motion.button
                    key={command.id}
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                    onClick={() => handleCommandSelect(command)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                      index === selectedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      getCategoryColor(command.category),
                      index === selectedIndex ? 'bg-primary/10' : 'bg-muted'
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {command.label}
                        </span>
                        <span className="text-xs">
                          {getCategoryIcon(command.category)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {command.description}
                      </p>
                    </div>
                    
                    {index === selectedIndex && (
                      <div className="text-xs text-muted-foreground">
                        ↵
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}