import React, { useState, useEffect, useRef } from 'react';
import { Drawer, TextInput, ActionIcon, Text, Badge, Group, Stack, ScrollArea, Button, Divider, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Send, Trash2, Bot, HelpCircle, Plane, Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';

const SUGGESTED_PROMPTS = [
  '✈️ When is my next flight?',
  '🏨 Where am I staying?',
  '💰 How much have I spent?',
  '🎒 What should I pack?',
  '📍 Show my upcoming trips',
  '⏰ When should I leave for the airport?'
];

export default function ChatDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && !historyLoaded) {
      fetchHistory();
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto scroll to bottom
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-viewport]') || scrollRef.current;
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, loading]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/chat/history');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoaded(true);
    }
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg = { role: 'user', content: msg, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();

      const assistantMsg = {
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await fetch('/api/chat/history', { method: 'DELETE' });
      setMessages([]);
      notifications.show({
        title: 'Chat Cleared',
        message: 'Your conversation history has been cleared.',
        color: 'blue',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const formatMarkdown = (text) => {
    if (!text) return '';
    // Format bold and lists
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/• /g, '&bull; ');
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';
    // Clean assistant message of Suggested part if parsed
    let displayContent = msg.content;
    if (!isUser && displayContent.includes('**Suggested:**')) {
      displayContent = displayContent.split('**Suggested:**')[0].trim();
    }

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
      >
        <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
          {!isUser && (
            <Group gap={6} mb={4}>
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <Text size="10px" fw={700} c="dimmed" className="uppercase tracking-wider">Travelista AI</Text>
            </Group>
          )}
          <div
            className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
              isUser
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-slate-100 text-slate-800 rounded-bl-sm'
            }`}
            style={{ whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{
              __html: isUser ? msg.content : formatMarkdown(displayContent)
            }}
          />
          {msg.sources && msg.sources.length > 0 && (
            <Group gap={4} mt={6}>
              {msg.sources.map((s, i) => (
                <Badge key={i} size="xs" variant="light" color="blue" radius="md">
                  Source: {s.label}
                </Badge>
              ))}
            </Group>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      position="right"
      size="md"
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.15, blur: 2 }}
      styles={{
        body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' },
        content: { display: 'flex', flexDirection: 'column' }
      }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-white">
        <Group gap="sm">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <Text fw={750} size="sm" className="text-slate-800">Travelista Copilot</Text>
            <Text size="10px" c="dimmed">AI powered travel assistant</Text>
          </div>
        </Group>
        <Group gap={4}>
          {messages.length > 0 && (
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={clearHistory}>
              <Trash2 className="w-4 h-4" />
            </ActionIcon>
          )}
          <ActionIcon variant="subtle" color="gray" size="md" onClick={onClose}>
            <X className="w-5 h-5" />
          </ActionIcon>
        </Group>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4 py-4" style={{ flex: 1 }}>
        {messages.length === 0 && !loading ? (
          <Stack align="center" gap="lg" py="xl" className="px-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <Text fw={750} size="sm" c="dark">Welcome to your Copilot!</Text>
              <Text size="xs" c="dimmed" mt={4}>I can answer questions regarding flights, hotel reservations, spend analytics, packing lists, and timelines.</Text>
            </div>
            <Divider label="Suggested Queries" labelPosition="center" className="w-full" />
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <Button
                  key={i}
                  variant="light"
                  color="gray"
                  size="xs"
                  radius="xl"
                  onClick={() => sendMessage(prompt)}
                  className="font-medium text-slate-700 hover:text-blue-600"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </Stack>
        ) : (
          <>
            {messages.map((msg, i) => renderMessage(msg, i))}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start mb-3"
              >
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Group gap={4}>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </Group>
                </div>
              </motion.div>
            )}
          </>
        )}
      </ScrollArea>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-slate-200/80 bg-white">
        <Group gap="sm">
          <TextInput
            ref={inputRef}
            placeholder="Ask about your travels..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            radius="xl"
            size="sm"
            className="flex-1"
            disabled={loading}
            styles={{ input: { fontSize: '13px' } }}
          />
          <ActionIcon
            variant="filled"
            color="blue"
            size="md"
            radius="xl"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </ActionIcon>
        </Group>
      </div>
    </Drawer>
  );
}
