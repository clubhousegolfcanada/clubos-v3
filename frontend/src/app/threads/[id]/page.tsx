'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      // TODO: Call API to execute action
      console.log('Executing action:', action);
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    setLoading(true);
    try {
      // TODO: Call API to escalate to Slack
      console.log('Escalating to Slack');
    } catch (error) {
      console.error('Escalation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = () => {
    router.push(`/tickets/create?thread_id=${params.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Thread #{params.id}</h1>
        
        {/* Thread info placeholder */}
        <div className="space-y-2 mb-6">
          <p><span className="font-medium">Customer:</span> +1234567890</p>
          <p><span className="font-medium">Booking:</span> BK-123</p>
          <p><span className="font-medium">Intent:</span> tech_issue</p>
          <p><span className="font-medium">Status:</span> in_progress</p>
        </div>

        {/* Messages placeholder */}
        <div className="border-t pt-4 mb-6">
          <h2 className="font-medium mb-4">Messages</h2>
          <div className="space-y-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Customer</p>
              <p>TrackMan isn&apos;t working in bay 2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={() => handleAction('reset_trackman')}
              disabled={loading}
              className="btn-primary"
            >
              Reset TrackMan
            </button>
            <button
              onClick={() => handleAction('unlock_door')}
              disabled={loading}
              className="btn-secondary"
            >
              Unlock Door
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCreateTicket}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700"
            >
              Create Ticket
            </button>
            <button
              onClick={handleEscalate}
              disabled={loading}
              className="btn-danger"
            >
              Escalate to Slack
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}