'use client';

import { useVoiceCalls } from '@/hooks';
import { useEffect } from 'react';

export function VoiceCallsList() {
  const { calls, loading, error, fetchCalls, acceptCall, rejectCall, endCall } = useVoiceCalls();

  useEffect(() => {
    fetchCalls();
    const interval = setInterval(fetchCalls, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchCalls]);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const pendingCalls = calls.filter(c => c.status === 'pending');
  const activeCalls = calls.filter(c => c.status === 'active');

  return (
    <div className="space-y-4">
      {/* Incoming Calls */}
      {pendingCalls.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Incoming Calls</h3>
          <div className="space-y-2">
            {pendingCalls.map(call => (
              <div key={call.id} className="bg-yellow-100 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">Incoming call from {call.initiator_id}</p>
                  <p className="text-sm text-gray-600">Caller: {call.initiator_id}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptCall(call.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => rejectCall(call.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Calls */}
      {activeCalls.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Active Calls</h3>
          <div className="space-y-2">
            {activeCalls.map(call => (
              <div key={call.id} className="bg-green-100 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">Call in progress</p>
                  <p className="text-sm text-gray-600">
                    Duration: {call.duration_seconds || 0} seconds
                  </p>
                </div>
                <button
                  onClick={() => endCall(call.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  End Call
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingCalls.length === 0 && activeCalls.length === 0 && !loading && (
        <p className="text-gray-500">No active calls</p>
      )}

      {loading && <p className="text-gray-500">Loading...</p>}
    </div>
  );
}
