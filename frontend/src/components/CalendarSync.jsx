import React, { useState, useEffect } from 'react';
import { Paper, Button, Badge, Group, Stack, Text, Loader, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Calendar, CalendarCheck, CalendarX, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';

export default function CalendarSync({ tripId, tripName }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [removing, setRemoving] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/calendar/status/${tripId}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Calendar status fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [tripId]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/calendar/sync/${tripId}`, { method: 'POST' });
      const data = await res.json();
      
      if (data.status === 'needs_reauth') {
        notifications.show({
          title: 'Google Calendar Access Needed',
          message: 'Redirecting you to Google to grant calendar permissions.',
          color: 'yellow',
          autoClose: 5000
        });
        if (data.auth_url) {
          // Open the auth URL in a new window or redirect
          window.location.href = data.auth_url;
        }
        return;
      }
      
      if (data.status === 'synced') {
        notifications.show({
          title: 'Trip Calendar Synced!',
          message: `${data.event_count} events for the trip "${tripName}" successfully added to Google Calendar.`,
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Sync Failed',
          message: data.message || 'Unable to sync to Google Calendar.',
          color: 'red',
        });
      }
      await fetchStatus();
    } catch (e) {
      notifications.show({
        title: 'Error',
        message: 'Something went wrong while syncing.',
        color: 'red',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch(`/api/calendar/remove/${tripId}`, { method: 'DELETE' });
      const data = await res.json();
      
      notifications.show({
        title: 'Calendar Cleared',
        message: data.message || 'Events removed successfully.',
        color: 'blue',
      });
      await fetchStatus();
    } catch (e) {
      notifications.show({
        title: 'Error',
        message: 'Could not remove calendar events.',
        color: 'red',
      });
    } finally {
      setRemoving(false);
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(isoString).toLocaleDateString('en-IN');
  };

  const isSynced = status?.sync_status === 'synced';
  const isError = status?.sync_status === 'error';

  return (
    <Paper p="lg" radius="xl" withBorder className="bg-white border-slate-200/80 shadow-sm mt-8">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSynced ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <Text fw={700} size="sm" className="text-slate-800">Google Calendar Synchronization</Text>
              <Text size="xs" c="dimmed">Add your trip timeline events automatically to your calendar.</Text>
            </div>
          </Group>
          {loading ? (
            <Loader size="xs" />
          ) : isSynced ? (
            <Badge variant="light" color="teal" size="sm" radius="md">✓ Synced</Badge>
          ) : isError ? (
            <Badge variant="light" color="red" size="sm" radius="md">✗ Error</Badge>
          ) : (
            <Badge variant="light" color="gray" size="sm" radius="md">Not Synced</Badge>
          )}
        </Group>

        {isSynced && status?.last_sync && (
          <Text size="xs" c="dimmed" className="flex items-center gap-1">
            <span>Last Synced:</span>
            <span className="font-semibold text-slate-700">{formatRelativeTime(status.last_sync)}</span>
          </Text>
        )}

        <Group gap="sm" mt="xs">
          <Button
            variant={isSynced ? "light" : "filled"}
            color="blue"
            size="xs"
            radius="md"
            loading={syncing}
            disabled={removing}
            leftSection={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={handleSync}
            className="font-semibold"
          >
            {isSynced ? 'Sync Calendar Updates' : 'Add Entire Trip to Calendar'}
          </Button>

          {isSynced && (
            <Button
              variant="subtle"
              color="red"
              size="xs"
              radius="md"
              loading={removing}
              disabled={syncing}
              leftSection={<CalendarX className="w-3.5 h-3.5" />}
              onClick={handleRemove}
              className="font-semibold"
            >
              Remove Calendar Events
            </Button>
          )}

          <Button
            variant="outline"
            color="gray"
            size="xs"
            radius="md"
            component="a"
            href="https://calendar.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            leftSection={<ExternalLink className="w-3.5 h-3.5" />}
            className="font-semibold text-slate-700 hover:bg-slate-50 border-slate-200"
          >
            Open Google Calendar
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
