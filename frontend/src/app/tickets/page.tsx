'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Ticket {
  id: number;
  type: string;
  status: string;
  priority: string;
  title: string;
  created_at: string;
  created_by: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch tickets from API
    setLoading(false);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <Link href="/tickets/create" className="btn-primary">
          Create Ticket
        </Link>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No tickets yet
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="divide-y">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{ticket.title}</h3>
                    <p className="text-sm text-gray-600">
                      {ticket.type} • Created by {ticket.created_by}
                    </p>
                  </div>
                  <span className={`status-badge ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}