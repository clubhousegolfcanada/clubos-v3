'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CreateTicketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadId = searchParams.get('thread_id');

  const [formData, setFormData] = useState({
    type: 'tech',
    priority: 'medium',
    title: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // TODO: Call API to create ticket
      console.log('Creating ticket:', {
        ...formData,
        linked_thread_id: threadId,
      });
      
      router.push('/tickets');
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create Ticket</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="tech">Tech</option>
            <option value="facilities">Facilities</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            rows={4}
            required
          />
        </div>

        {threadId && (
          <p className="text-sm text-gray-600">
            Linked to thread #{threadId}
          </p>
        )}

        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            Create Ticket
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}