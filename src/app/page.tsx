'use client';

import React, { useState, KeyboardEvent, ChangeEvent, useEffect, useRef } from 'react';
import { Send, User, Bot } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const ChatLayout: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingDots, setTypingDots] = useState('.');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content:
          'Halo, ada yang bisa saya bantu? mau tanya tentang J1 Internship Program USA atau Study ke Australia atau negara lainnya? Silahkan kirim pesan.',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, []);

  useEffect(() => {
    if (!isTyping) return;
    const interval = setInterval(() => {
      setTypingDots((prev) => (prev.length < 3 ? prev + '.' : '.'));
    }, 500);
    return () => clearInterval(interval);
  }, [isTyping]);

  const handleSendMessage = async () => {
  if (!inputValue.trim()) return;

  const newMessage: Message = {
    id: messages.length + 1,
    role: 'user',
    content: inputValue,
    timestamp: new Date().toLocaleTimeString(),
  };
  
  const updatedMessages = [...messages, newMessage];
  setMessages(updatedMessages);
  setInputValue('');

  setIsTyping(true);
  const typingMessage: Message = {
    id: messages.length + 2,
    role: 'assistant',
    content: 'Typing',
    timestamp: new Date().toLocaleTimeString(),
  };
  setMessages(prev => [...prev, typingMessage]);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: updatedMessages.map(m => ({
          role: m.role,
          content: m.content
        }))
      }),
    });

    const data = await res.json();

    setMessages(prev =>
      prev.map(msg =>
        msg.id === typingMessage.id
          ? { ...msg, content: data.reply || 'No response from AI' }
          : msg
      )
    );
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setIsTyping(false);
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 shadow-sm">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-lg font-semibold text-gray-800">Konsultan Visa AI</h1>
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`max-w-[70%] ${message.role === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white ml-auto rounded-br-sm'
                      : 'bg-white border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  {isTyping && message.content === 'Typing'
                    ? `typing${typingDots}`
                    : message.content}
                </div>
                <p className="text-xs text-gray-500 mt-1 px-2">
                  {message.timestamp}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          {/* Invisible div to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end">
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Send a message..."
              rows={1}
              className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="absolute right-2 bottom-2 w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;