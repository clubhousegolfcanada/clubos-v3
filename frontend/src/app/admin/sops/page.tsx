'use client';

import { useState, useEffect } from 'react';

interface SOP {
  id: number;
  title: string;
  category: string;
  trigger_phrases: string[];
  primary_action: string;
  active: boolean;
}

export default function AdminSOPsPage() {
  const [sops, setSops] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    // TODO: Fetch SOPs from API
    setLoading(false);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">SOP Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          Create SOP
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Create New SOP</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g. TrackMan Reset Procedure"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option value="tech">Tech</option>
                <option value="booking">Booking</option>
                <option value="access">Access</option>
                <option value="faq">FAQ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Trigger Phrases (comma-separated)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="trackman frozen, screen stuck"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Primary Action</label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option value="reset_trackman">Reset TrackMan</option>
                <option value="unlock_door">Unlock Door</option>
                <option value="escalate">Escalate</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left p-4">Title</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Triggers</th>
                <th className="text-left p-4">Action</th>
                <th className="text-left p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sops.map((sop) => (
                <tr key={sop.id} className="hover:bg-gray-50">
                  <td className="p-4">{sop.title}</td>
                  <td className="p-4">{sop.category}</td>
                  <td className="p-4 text-sm">
                    {sop.trigger_phrases.join(', ')}
                  </td>
                  <td className="p-4">{sop.primary_action}</td>
                  <td className="p-4">
                    <span className={`status-badge ${
                      sop.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {sop.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}