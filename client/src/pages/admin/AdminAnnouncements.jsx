import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { adminService } from '../../services/portalService';
import toast from 'react-hot-toast';
import {
  IoMegaphoneOutline,
  IoTrashOutline,
  IoRefreshOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoInformationCircleOutline,
} from 'react-icons/io5';

const typeStyles = {
  INFO: 'bg-blue-50 text-blue-800 border-blue-100',
  WARNING: 'bg-amber-50 text-amber-800 border-amber-100',
  ALERT: 'bg-red-50 text-red-800 border-red-100',
};

const typeIcons = {
  INFO: <IoInformationCircleOutline size={18} className="text-blue-500" />,
  WARNING: <IoAlertCircleOutline size={18} className="text-amber-500" />,
  ALERT: <IoAlertCircleOutline size={18} className="text-red-500" />,
};

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('INFO');
  const [expiresAt, setExpiresAt] = useState('');

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAnnouncements();
      if (res.data?.data?.announcements) {
        setAnnouncements(res.data.data.announcements);
      }
    } catch (err) {
      toast.error('Failed to load platform announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      return toast.error('Announcement Title and Body are required.');
    }
    setCreating(true);
    try {
      const res = await adminService.createAnnouncement({
        title,
        body,
        type,
        expiresAt: expiresAt || null,
      });
      if (res.data?.success) {
        toast.success('Announcement broadcasted successfully!');
        setTitle('');
        setBody('');
        setType('INFO');
        setExpiresAt('');
        fetchAnnouncements();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Broadcast failed.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement? It will immediately stop appearing on users dashboards.')) return;
    try {
      await adminService.deleteAnnouncement(id);
      toast.success('Announcement deleted.');
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error('Failed to delete announcement.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* List Area (Left 2 columns) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">Platform Announcements</h1>
            <p className="text-sm text-slate-500 mt-1">Broadcast system maintenance, news, alerts, or holiday updates.</p>
          </div>
          <button
            onClick={fetchAnnouncements}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all cursor-pointer"
          >
            <IoRefreshOutline size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white border border-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <Card hover={false} className="bg-white border border-slate-100 p-16 text-center rounded-2xl">
            <IoMegaphoneOutline size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
            <h4 className="text-sm font-bold text-slate-700">No active announcements</h4>
            <p className="text-xs text-slate-400 mt-1">Use the panel on the right to broadcast your first message.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <Card key={ann.id} hover={false} className={`border border-slate-100 bg-white p-5 rounded-2xl flex items-start justify-between gap-4`}>
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0">{typeIcons[ann.type]}</div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800">{ann.title}</h4>
                      <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full ${typeStyles[ann.type]}`}>
                        {ann.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-650 mt-1.5 leading-relaxed">{ann.body}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                      <span>Posted by: {ann.author?.name}</span>
                      <span>·</span>
                      <span>{new Date(ann.createdAt).toLocaleString()}</span>
                      {ann.expiresAt && (
                        <>
                          <span>·</span>
                          <span className="text-red-500 font-medium">Expires: {new Date(ann.expiresAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(ann.id)}
                  className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg shrink-0 cursor-pointer transition-all"
                  title="Delete Announcement"
                >
                  <IoTrashOutline size={15} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Creator Form (Right 1 column) */}
      <div>
        <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl space-y-4 sticky top-6">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-50 flex items-center gap-2">
            <IoMegaphoneOutline size={18} className="text-red-550 text-red-600" /> New Broadcast
          </h3>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 text-slate-500 uppercase tracking-wider block">Title</label>
              <input
                type="text"
                required
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-100 bg-slate-50/50 focus:outline-none focus:bg-white focus:border-red-400"
                placeholder="e.g. System Maintenance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 text-slate-500 uppercase tracking-wider block">Message Body</label>
              <textarea
                required
                rows={5}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-100 bg-slate-50/50 focus:outline-none focus:bg-white focus:border-red-400 resize-none leading-relaxed"
                placeholder="Write your broadcast statement..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-550 text-slate-500 uppercase tracking-wider block">Severity</label>
                <select
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-100 bg-white focus:outline-none focus:border-red-400"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="INFO">Info (Blue)</option>
                  <option value="WARNING">Warning (Amber)</option>
                  <option value="ALERT">Alert (Red)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-550 text-slate-500 uppercase tracking-wider block">Expiry (Optional)</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-100 bg-white focus:outline-none focus:border-red-400"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer py-2.5" disabled={creating}>
              {creating ? 'Sending...' : 'Broadcast Now'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnnouncements;
