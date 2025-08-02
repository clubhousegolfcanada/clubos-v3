'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Thread {
  id: number;
  customer_id: string;
  booking_id: string;
  intent: string;
  status: string;
  confidence_score: number;
  created_at: string;
}

export default function HomePage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch threads from API
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Message Threads</h1>
      
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : threads.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No threads yet
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/threads/${thread.id}`}
              className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Customer: {thread.customer_id}</p>
                  <p className="text-sm text-gray-600">
                    Booking: {thread.booking_id || 'None'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Intent: {thread.intent}
                  </p>
                </div>
                <span className={`status-badge ${getStatusColor(thread.status)}`}>
                  {thread.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}