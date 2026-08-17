import React, { useEffect, useState } from 'react';
import { notificationAPI } from '../services/api';
import { Card, Button, Loading, Empty } from '../components/common';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const TYPE_COLORS = {
  rent_reminder: 'bg-orange-50 border-orange-200 text-orange-600',
  complaint_update: 'bg-blue-50 border-blue-200 text-blue-600',
  announcement: 'bg-violet-50 border-violet-200 text-violet-600',
  payment: 'bg-emerald-50 border-emerald-200 text-emerald-600',
  system: 'bg-slate-50 border-slate-200 text-slate-500',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationAPI.getAll().then(({ data }) => setNotifications(data.data)).finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications(n => n.map(item => ({ ...item, isRead: true })));
    toast.success('All marked as read');
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-slate-900 text-2xl">Notifications</h2>
          <p className="text-slate-500 text-sm">{notifications.filter(n => !n.isRead).length} unread</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map(n => (
          <Card key={n._id} className={`p-4 transition-all ${!n.isRead ? 'border-l-4 border-l-primary-500' : 'opacity-70'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[n.type] || TYPE_COLORS.system}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 text-sm">{n.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{n.message}</p>
                <p className="text-slate-400 text-xs mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
              {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />}
            </div>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && <Empty icon={Bell} title="No notifications" description="You're all caught up!" />}
    </div>
  );
}
