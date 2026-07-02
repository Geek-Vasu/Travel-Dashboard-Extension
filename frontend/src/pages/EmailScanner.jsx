import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowRight, CheckCircle2, AlertCircle, Inbox, ShieldCheck, FileText, Loader2 } from 'lucide-react';
import { Paper, Title, Text, Button, Progress, Badge, ScrollArea, Center, Loader, Group, Stack } from '@mantine/core';

export default function EmailScanner() {
  const navigate = useNavigate();
  const [status, setStatus] = useState({
    is_scanning: false,
    processed: 0,
    total: 0,
    logs: []
  });
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);
  const logEndRef = useRef(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/scanner/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.error) {
          setError(data.error);
        }
        
        if (!data.is_scanning) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startScan = async () => {
    setError(null);
    try {
      const res = await fetch('/api/scanner/scan', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok && (data.status === 'started' || data.status === 'already_scanning')) {
        await fetchStatus();
        if (!pollingRef.current) {
          pollingRef.current = setInterval(fetchStatus, 500);
        }
      } else {
        setError(data.message || 'Failed to initiate Gmail mailbox scan.');
      }
    } catch (err) {
      setError('Connection failure: API server is currently unreachable.');
    }
  };

  useEffect(() => {
    startScan();
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [status.logs]);

  const percentage = status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0;
  const isFinished = !status.is_scanning && status.processed > 0 && status.processed === status.total;

  const getLogStatusBadge = (logStatus) => {
    switch (logStatus) {
      case 'completed': 
        return <Badge variant="light" color="teal" size="sm" radius="md">Processed</Badge>;
      case 'processing': 
        return <Badge variant="light" color="blue" size="sm" radius="md" className="animate-pulse">Syncing</Badge>;
      case 'failed': 
        return <Badge variant="light" color="red" size="sm" radius="md">Failed</Badge>;
      default: 
        return <Badge variant="light" color="gray" size="sm" radius="md">Waiting</Badge>;
    }
  };

  return (
    <div className="flex-1 py-12 px-6 md:px-16 max-w-4xl mx-auto w-full flex flex-col justify-center gap-8 select-none text-slate-800">
      
      {/* Title Header */}
      <Stack gap="xs" className="max-w-xl">
        <Group gap="xs">
          <Badge variant="light" color="blue" size="md" radius="xl" leftSection={<RefreshCw className={`w-3 h-3 ${status.is_scanning ? 'animate-spin' : ''}`} />}>
            Inbox Sync Station
          </Badge>
        </Group>
        <Title order={2} className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Scanning your travel stubs
        </Title>
        <Text size="sm" fw={500} c="dimmed">
          Syncing recent travel stubs and itineraries directly from your inbox archive.
        </Text>
      </Stack>

      {/* Progress Board */}
      <Paper p="xl" radius="xl" withBorder className="bg-white border-slate-200/80 shadow-sm">
        <Stack gap="lg">
          
          {/* Progress bar info */}
          <Stack gap="xs">
            <Group justify="space-between" align="end" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <Group gap="xs">
                {status.is_scanning ? (
                  <Loader size={14} color="blue" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
                <span className={status.is_scanning ? "text-blue-600 font-bold" : "text-slate-900 font-bold"}>
                  {status.is_scanning ? 'Scanning Gmail Inbox...' : isFinished ? 'Inbox sync completed successfully' : 'Scan inactive'}
                </span>
              </Group>
              <span className="text-slate-900 font-bold font-mono">{status.processed} / {status.total} Analysed</span>
            </Group>

            {/* Premium Mantine Progress Bar */}
            <Progress 
              value={percentage} 
              animated={status.is_scanning} 
              color={isFinished ? 'teal' : 'blue'}
              size="lg"
              radius="xl"
            />
          </Stack>

          {/* Action Controls & Filters Info */}
          <Group justify="space-between" align="center" className="border-t border-slate-100 pt-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <Group gap="xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Active Filters: Flight, Hotel, Cab, Train stubs</span>
            </Group>
            
            <Group gap="xs">
              <Button 
                variant="default"
                size="xs"
                radius="md"
                onClick={startScan}
                disabled={status.is_scanning}
                className="font-semibold text-slate-700 hover:bg-slate-50"
              >
                Re-run Scan
              </Button>

              {isFinished && (
                <Button 
                  color="blue"
                  size="xs"
                  radius="md"
                  onClick={() => navigate('/dashboard')}
                  rightSection={<ArrowRight className="w-4 h-4" />}
                  className="font-semibold shadow-sm"
                >
                  Go to Dashboard
                </Button>
              )}
            </Group>
          </Group>
        </Stack>
      </Paper>

      {error && (
        <Paper p="md" radius="lg" className="bg-red-50/50 border border-red-100/80 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>Error: {error}</span>
        </Paper>
      )}

      {/* Sync Logs Panel */}
      <Paper p="xl" radius="xl" withBorder className="bg-white border-slate-200/80 shadow-sm flex flex-col min-h-80">
        <Group gap="xs" className="border-b border-slate-100 pb-4 mb-4">
          <Inbox className="w-4.5 h-4.5 text-blue-600" />
          <Text fw={750} size="xs" className="uppercase tracking-wider text-slate-900">Extraction Pipeline logs</Text>
        </Group>

        <ScrollArea className="flex-1 max-h-96 pr-2">
          {status.logs.length === 0 ? (
            <Center py="xl" className="flex flex-col gap-4 text-slate-400 py-16">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <Text size="xs" fw={600} className="text-slate-400 tracking-wide">
                Sync standby. Initializing Gmail query connection...
              </Text>
            </Center>
          ) : (
            <Stack gap="xs">
              {status.logs.map((log, index) => (
                <Group 
                  key={log.id || index} 
                  justify="space-between"
                  align="center"
                  className="hover:bg-slate-50/80 py-2 px-3 rounded-xl transition-colors border border-transparent hover:border-slate-100"
                >
                  <Group gap="md" className="flex-1 min-w-0">
                    <Text size="xs" className="text-slate-400 font-bold font-mono w-16">
                      {new Date(log.processed_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </Text>
                    <div className="w-20">
                      {getLogStatusBadge(log.status)}
                    </div>
                    <Group gap="xs" className="min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <Text size="xs" fw={600} className="text-slate-800 truncate">
                        {log.subject}
                      </Text>
                    </Group>
                  </Group>
                  
                  {log.error_message && (
                    <Badge variant="light" color="red" size="xs" className="truncate max-w-[200px]">
                      {log.error_message}
                    </Badge>
                  )}
                </Group>
              ))}
            </Stack>
          )}
          <div ref={logEndRef} />
        </ScrollArea>
      </Paper>
    </div>
  );
}
