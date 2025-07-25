'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Share, MoreHorizontal } from 'lucide-react';
import AIEditor from '@/components/editor/AIEditor';
import { useSession } from 'next-auth/react';

export default function EditorPage() {
  const { data: session } = useSession();
  if (session) {
    console.log(session.user?.email);
  } else {
    console.log("session not found");
  }

  const [content, setContent] = useState('');
  const [documentTitle, setDocumentTitle] = useState('Untitled Document');
  const [isSaving, setIsSaving] = useState(false);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    // TODO: Implement auto-save functionality
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement save functionality
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="text-lg font-semibold text-foreground bg-transparent border-none outline-none focus:ring-0 p-0"
              placeholder="Untitled Document"
            />
            <p className="text-sm text-muted-foreground">
              {isSaving ? 'Saving...' : 'Last saved 2 minutes ago'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? 'Saving...' : 'Save'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
          >
            <Share className="w-4 h-4" />
            Share
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 flex">
        {/* Main Editor Area */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <AIEditor
              content={content}
              onChange={handleContentChange}
              placeholder="Start writing or type '/' for AI commands..."
            />
          </div>
        </div>

        {/* Right Sidebar - AI Tools */}
        <div className="w-80 border-l border-border p-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">AI Tools</h3>
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-3 text-left bg-card hover:bg-accent border border-border rounded-lg transition-colors"
                >
                  <div className="font-medium">Write with AI</div>
                  <div className="text-sm text-muted-foreground">Generate content based on your prompt</div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-3 text-left bg-card hover:bg-accent border border-border rounded-lg transition-colors"
                >
                  <div className="font-medium">Improve Writing</div>
                  <div className="text-sm text-muted-foreground">Enhance clarity and style</div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-3 text-left bg-card hover:bg-accent border border-border rounded-lg transition-colors"
                >
                  <div className="font-medium">Change Tone</div>
                  <div className="text-sm text-muted-foreground">Adjust formality and emotion</div>
                </motion.button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Quick Templates</h3>
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-2 text-left text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
                >
                  Business Email
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-2 text-left text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
                >
                  Thank You Letter
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-2 text-left text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
                >
                  Apology Message
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}