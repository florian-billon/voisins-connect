import { useState, useCallback, useEffect } from 'react';

export interface VoiceCall {
  id: string;
  initiator_id: string;
  recipient_id: string;
  voice_channel_id?: string;
  status: 'pending' | 'active' | 'ended' | 'rejected';
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  created_at: string;
}

export function useVoiceCalls() {
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateCall = useCallback(async (recipientId: string, voiceChannelId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipient_id: recipientId,
          voice_channel_id: voiceChannelId 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to initiate call');
      const newCall = await response.json();
      setCalls([...calls, newCall]);
      return newCall;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calls]);

  const acceptCall = useCallback(async (callId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/calls/${callId}/accept`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to accept call');
      const updated = await response.json();
      setCalls(calls.map(c => c.id === callId ? updated : c));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calls]);

  const rejectCall = useCallback(async (callId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/calls/${callId}/reject`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to reject call');
      const updated = await response.json();
      setCalls(calls.map(c => c.id === callId ? updated : c));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calls]);

  const endCall = useCallback(async (callId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/calls/${callId}/end`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to end call');
      const updated = await response.json();
      setCalls(calls.map(c => c.id === callId ? updated : c));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calls]);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/calls');
      if (!response.ok) throw new Error('Failed to fetch calls');
      const data = await response.json();
      setCalls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    calls,
    loading,
    error,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    fetchCalls,
  };
}
