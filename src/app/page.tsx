'use client';

import React, { useState, KeyboardEvent, ChangeEvent, useEffect } from 'react';
import {
  Send,
  User,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatHistoryItem {
  id: number;
  title: string;
  active: boolean;
}

const ChatLayout: React.FC = () => {
const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: 'Hello! How can I help you today?',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  }, []);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = async () => {
  if (!inputValue.trim()) return;

  const newMessage: Message = {
    id: messages.length + 1,
    role: 'user',
    content: inputValue,
    timestamp: new Date().toLocaleTimeString()
  };
  setMessages((prev) => [...prev, newMessage]);
  setInputValue('');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: inputValue })
    });

    const data = await res.json();
    // console.log(data.debug);

    const aiResponse: Message = {
      id: messages.length + 2,
      role: 'assistant',
      content: data.reply || 'No response from AI',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, aiResponse]);
  } catch (error) {
    console.error('Error:', error);
    const aiResponse: Message = {
      id: messages.length + 2,
      role: 'assistant',
      content: 'Error contacting AI',
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages((prev) => [...prev, aiResponse]);
  }
};


  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="flex h-screen bg-muted/20">
      

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-background border-b px-4 py-3 flex items-center gap-3">
          <h1 className="text-lg font-semibold">Konsultan Visa AI</h1>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-4 mb-6',
                  message.role === 'user' && 'justify-end'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 bg-green-500 text-white">
                    <AvatarFallback>
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    'max-w-[70%]',
                    message.role === 'user' && 'order-first'
                  )}
                >
                  <div
                    className={cn(
                      'p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-background border'
                    )}
                  >
                    {message.content}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 px-2">
                    {message.timestamp}
                  </p>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 bg-primary text-white">
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-background p-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end">
              <Textarea
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Send a message..."
                rows={1}
                className="pr-12 resize-none"
              />
              <Button
                size="icon"
                className="absolute right-2 bottom-2"
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send, Shift + Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;
