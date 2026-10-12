'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Calendar, Building2, Users, Settings, 
  CheckCircle, XCircle, Eye, Edit3, Trash2, Plus,
  TrendingUp, BarChart3, Globe, LogOut
} from 'lucide-react';
import { sampleEvents } from '@/data/events';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [events, setEvents] = useState(sampleEvents);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
        } else {
          router.push('/admin/login');
        }
      })
      .catch(() => router.push('/admin/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) return null;

  const totalEvents = events.length;
  const publishedEvents = events.filter(e => e.status === 'published').length;
  const pendingEvents = events.filter(e => e.status === 'pending_review').length;
  const featuredEvents = events.filter(e => e.featured).length;

  const handleApprove = (id: string) => {
    setEvents(events.map(e => e.id === id ? { ...e, status: 'published' } : e));
  };

  const handleReject = (id: string) => {
    setEvents(events.map(e => e.id === id ? { ...e, status: 'rejected' } : e));
  };

  const handleToggleFeatured = (id: string) => {
    setEvents(events.map(e => e.id === id ? { ...e, featured: !e.featured } : e));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-lg">Y</span>
            </div>
            <span className="font-bold text-xl text-white">
              yukgo<span className="text-blue-500">.live</span>
            </span>
          </Link>
          <p className="text-xs text-gray-500 mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('events')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'events' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <Calendar size={18} /> Events
            {pendingEvents > 0 && <span className="ml-auto bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">{pendingEvents}</span>}
          </button>
          <button onClick={() => setActiveTab('venues')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'venues' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <Building2 size={18} /> Venues
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'analytics' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <BarChart3 size={18} /> Analytics
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <Settings size={18} /> Settings
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
            <Globe size={16} /> View Website
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'events' && 'Event Management'}
                {activeTab === 'venues' && 'Venue Management'}
                {activeTab === 'analytics' && 'Analytics'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
              <p className="text-sm text-gray-500">Manage your yukgo.live platform</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Welcome, {user?.name || 'Admin'}</span>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{user?.name?.[0] || 'A'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><Calendar size={24} className="text-blue-600" /></div>
                    <TrendingUp size={20} className="text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{totalEvents}</p>
                  <p className="text-sm text-gray-500">Total Events</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><CheckCircle size={24} className="text-green-600" /></div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{publishedEvents}</p>
                  <p className="text-sm text-gray-500">Published</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center"><Eye size={24} className="text-yellow-600" /></div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{pendingEvents}</p>
                  <p className="text-sm text-gray-500">Pending Review</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><Users size={24} className="text-purple-600" /></div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{featuredEvents}</p>
                  <p className="text-sm text-gray-500">Featured</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Recent Events</h2>
                  <button onClick={() => setActiveTab('events')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</button>
                </div>
                <div className="divide-y divide-gray-100">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden">
                          {event.image_url && <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                          <p className="text-xs text-gray-500">{event.date} • {event.venue_name || 'TBD'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {event.status === 'published' ? 'Published' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <select className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm">
                    <option>All Status</option>
                    <option>Published</option>
                    <option>Pending Review</option>
                    <option>Rejected</option>
                  </select>
                  <select className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm">
                    <option>All Categories</option>
                    <option>Tech</option>
                    <option>Business</option>
                    <option>Arts & Culture</option>
                    <option>Music</option>
                  </select>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors">
                  <Plus size={18} /> Add Event
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                              {event.image_url && <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                              <p className="text-xs text-gray-500">{event.venue_name || 'No venue'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{event.date}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium capitalize">{event.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.status === 'published' ? 'bg-green-100 text-green-700' : event.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {event.status === 'published' ? 'Published' : event.status === 'pending_review' ? 'Pending' : 'Rejected'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => handleToggleFeatured(event.id)} className={`w-10 h-6 rounded-full transition-colors ${event.featured ? 'bg-blue-500' : 'bg-gray-200'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${event.featured ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {event.status === 'pending_review' && (
                              <>
                                <button onClick={() => handleApprove(event.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve"><CheckCircle size={18} /></button>
                                <button onClick={() => handleReject(event.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject"><XCircle size={18} /></button>
                              </>
                            )}
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Edit"><Edit3 size={18} /></button>
                            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'venues' && (
            <div className="text-center py-20">
              <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Venue Management</h3>
              <p className="text-gray-500">Coming soon — manage venues and vendor listings</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="text-center py-20">
              <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-gray-500">Coming soon — track views, clicks, and engagement</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-20">
              <Settings size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-500">Coming soon — configure platform settings</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
