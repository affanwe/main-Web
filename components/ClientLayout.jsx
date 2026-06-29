"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Users, LayoutDashboard, Calculator, Wallet, Repeat, Trophy,
  LogOut, Search, Menu, X, UserPlus, History as HistoryIcon,
  Bell, User, MessageSquare, FileCheck, FolderKanban, UserX, Globe
} from 'lucide-react';
import { getInvestors, approveShareRequest, rejectShareRequest, markNotificationAsRead, markAllNotificationsAsRead } from '../src/db';
import { supabase } from '../src/supabase';
import LocomotiveText from '../src/components/LocomotiveText';

const Sidebar = ({ isOpen, setOpen, user, pendingRequestCount, nonActivateCount }) => {
  const pathname = usePathname();
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Investors', path: '/investors', icon: Users },
    { name: 'Non-Activate', path: '/non-activate', icon: UserX, badge: nonActivateCount || 0 },
    { name: 'Unit Requests', path: '/requests', icon: FileCheck, badge: pendingRequestCount || 0 },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Company PnL', path: '/pnl', icon: Calculator },
    { name: 'Funds Details', path: '/funds', icon: Wallet },
    { name: 'Return Investment', path: '/returns', icon: Repeat },
    { name: 'Referral Ranking', path: '/referrals', icon: Trophy },
    { name: 'History', path: '/history', icon: HistoryIcon },
  ];

  if (user?.role === 'Founder') {
    navItems.push({ name: 'Site Settings', path: '/site-settings', icon: Globe });
    navItems.push({ name: 'Team Management', path: '/team', icon: UserPlus });
  }

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setOpen(false);
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }} onClick={handleNavClick}>
          <h2 className="text-locomotive"><LocomotiveText text="WOORA" /></h2>
        </Link>
        <button type="button" className="close-btn md-hidden" onClick={() => setOpen(false)}>
          <X size={24} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-item nav-item-locomotive ${pathname === item.path ? 'active' : ''}`}
              onClick={handleNavClick}
              style={{ position: 'relative' }}
            >
              <Icon size={20} />
              <LocomotiveText text={item.name} />
              {item.badge > 0 && (
                <span style={{ marginLeft: 'auto', backgroundColor: '#EF4444', color: '#FFF', fontSize: '10px', fontWeight: 700, borderRadius: '10px', minWidth: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button className="nav-item nav-item-locomotive text-red" onClick={() => {
          localStorage.removeItem('woora_logged_in');
          localStorage.removeItem('woora_user');
          localStorage.removeItem('woora_last_active');
          window.location.reload();
        }}>
          <LogOut size={20} />
          <LocomotiveText text="Logout" />
        </button>
      </div>
    </div>
  );
};

export default function ClientLayout({ children }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  const [user, setUser] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [nonActivateCount, setNonActivateCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    setSidebarOpen(window.innerWidth > 768);
    const userStr = localStorage.getItem('woora_user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Notifications are not yet implemented in Supabase, keep empty
    setNotifications([]);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const fetchPending = async () => {
      const { count, error } = await supabase
        .from('share_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');
      if (!error) setPendingRequestCount(count || 0);
    };

    const fetchNonActivated = async () => {
      const { data, error } = await supabase
        .from('investors')
        .select('id')
        .neq('status', 'Active');
      if (!error && data) {
        const seen = JSON.parse(localStorage.getItem('woora_seen_nonactivate') || '[]');
        const unseenCount = data.filter(inv => !seen.includes(inv.id)).length;
        setNonActivateCount(unseenCount);
      }
    };

    fetchPending();
    fetchNonActivated();

    const channel = supabase
      .channel('admin-share-requests')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'share_requests'
      }, () => fetchPending())
      .subscribe();

    const channelInv = supabase
      .channel('admin-investors-activation')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'investors'
      }, () => fetchNonActivated())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(channelInv);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const refreshNonActivateCount = async () => {
      const { data, error } = await supabase
        .from('investors')
        .select('id')
        .neq('status', 'Active');
      if (!error && data) {
        const seen = JSON.parse(localStorage.getItem('woora_seen_nonactivate') || '[]');
        setNonActivateCount(data.filter(inv => !seen.includes(inv.id)).length);
      }
    };
    refreshNonActivateCount();
  }, [mounted, pathname]);

  useEffect(() => {
    if (mounted) {
      const isAuth = localStorage.getItem('woora_logged_in') === 'true';
      if (!isAuth && pathname !== '/login') {
        router.push('/login');
      } else if (isAuth && pathname === '/login') {
        router.push('/');
      }
    }
  }, [mounted, pathname, router]);

  useEffect(() => {
    if (!showSearchResults) return;
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchResults]);

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-white)' }}>
        Loading Woora...
      </div>
    );
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const queryStr = searchQuery.trim().toLowerCase();
    const investors = await getInvestors();

    const exactId = investors.filter(i => i.id.toString().toLowerCase() === queryStr);
    if (exactId.length === 1) {
      router.push(`/investor/${exactId[0].id}`);
      setSearchQuery('');
      setShowSearchResults(false);
      return;
    }

    const matches = investors.filter(i =>
      i.id.toString().toLowerCase().includes(queryStr) ||
      (i.mobile || '').includes(queryStr) ||
      (i.name || '').toLowerCase().includes(queryStr)
    );

    if (matches.length === 0) {
      alert("No investor found matching your search.");
    } else if (matches.length === 1) {
      router.push(`/investor/${matches[0].id}`);
      setSearchQuery('');
      setShowSearchResults(false);
    } else {
      setSearchResults(matches);
      setShowSearchResults(true);
    }
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} user={user} pendingRequestCount={pendingRequestCount} nonActivateCount={nonActivateCount} />
      
      <main className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
        <header className="topbar no-print">
          <button type="button" className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          
          <div className="search-bar" ref={searchRef} style={{ position: 'relative' }}>
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search ID, Name, Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              className="input-field"
            />
            {showSearchResults && searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'var(--color-surface, #1a1a2e)', border: '1px solid var(--color-border, #333)', borderRadius: '10px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)', zIndex: 9999, maxHeight: '300px', overflowY: 'auto' }}>
                <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--color-text-muted, #888)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border, #333)' }}>
                  {searchResults.length} investor{searchResults.length > 1 ? 's' : ''} found
                </div>
                {searchResults.map(inv => (
                  <div key={inv.id} onClick={() => { router.push(`/investor/${inv.id}`); setSearchQuery(''); setShowSearchResults(false); }}
                    style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-white, #fff)' }}>{inv.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #888)' }}>{inv.mobile}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted, #888)', fontFamily: 'monospace' }}>ID: {inv.id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="notification-wrapper" style={{ position: 'relative', marginLeft: 'auto', marginRight: '16px' }}>
            <button 
              type="button" 
              className="notification-bell-btn" 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%', transition: 'background-color 0.2s' }}
            >
              <Bell size={22} color={unreadCount > 0 ? "var(--color-primary)" : "currentColor"} />
              {unreadCount > 0 && (
                <span className="notification-badge" style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: '#EF4444', color: '#FFF', fontSize: '9px', fontWeight: 'bold', borderRadius: '50%', minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px', border: '2px solid var(--color-surface)' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown card" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '320px', maxHeight: '400px', overflowY: 'auto', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: 0, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', border: '1px solid var(--color-border)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface-hover)' }}>
                  <h4 style={{ margin: 0, color: 'var(--color-text-white)', fontSize: '14px', fontWeight: 600 }}>Notifications</h4>
                  {unreadCount > 0 && (
                    <button 
                      onClick={async () => {
                        try {
                          await markAllNotificationsAsRead();
                        } catch (err) {
                          console.error(err);
                        }
                      }} 
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={async () => {
                          setShowNotifications(false);
                          if (!notif.read) {
                            await markNotificationAsRead(notif.id);
                          }
                          if (notif.type === 'registration' && notif.payload?.investorId) {
                            router.push(`/investor/${notif.payload.investorId}`);
                          } else if (notif.type === 'buy_request' && notif.payload) {
                            setSelectedRequest({
                              id: notif.payload.requestId || notif.id,
                              notificationId: notif.id,
                              ...notif.payload
                            });
                            setShowRejectInput(false);
                            setRejectReason('');
                          }
                        }}
                        style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer', backgroundColor: notif.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)', display: 'flex', gap: '12px', transition: 'background-color 0.2s' }}
                        className="notification-item"
                      >
                        <div style={{ marginTop: '2px', color: notif.type === 'buy_request' ? 'var(--color-primary)' : '#10B981' }}>
                          {notif.type === 'buy_request' ? <MessageSquare size={16} /> : <User size={16} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: notif.read ? 500 : 600, color: notif.read ? 'var(--color-text-muted)' : 'var(--color-text-white)' }}>{notif.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: '1.4' }}>{notif.message}</div>
                          <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        {!notif.read && (
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', alignSelf: 'center' }} />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="user-profile" onClick={() => router.push('/profile')} style={{ cursor: 'pointer', marginLeft: 0 }}>
            <div className="avatar">{user ? user.name.charAt(0).toUpperCase() : 'U'}</div>
            <span className="md-hidden-down">{user ? user.name : 'User'}</span>
          </div>
        </header>
        
        <div className="page-content">
          {children}
        </div>
      </main>

      {/* Share Request Approval Modal */}
      {selectedRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'var(--color-text-white)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <MessageSquare color="var(--color-primary)" /> Share Purchase Request
              </h2>
              <button 
                onClick={() => setSelectedRequest(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}
                disabled={processingRequest}
              >
                <X size={20}/>
              </button>
            </div>

            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px' }}>
              <p style={{ margin: '0 0 8px 0', color: 'var(--color-text-white)' }}>
                Investor: <strong>{selectedRequest.investorName} (ID: {selectedRequest.investorId})</strong>
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                Requested Shares: <strong>{selectedRequest.sharesCount} Shares</strong>
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                Total Payment: <strong>৳{parseInt(selectedRequest.amount || 0).toLocaleString()}</strong>
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                Payment Method: <strong>{selectedRequest.paymentMethod}</strong>
              </p>
              {selectedRequest.trxId && (
                <p style={{ margin: '0 0 8px 0', color: 'var(--color-primary)' }}>
                  Transaction ID / Ref: <strong>{selectedRequest.trxId}</strong>
                </p>
              )}
              <p style={{ margin: '0', color: 'var(--color-text-muted)' }}>
                Date Requested: {selectedRequest.dateRequested ? new Date(selectedRequest.dateRequested).toLocaleString() : 'N/A'}
              </p>
            </div>

            {showRejectInput ? (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Reason for Rejection</label>
                <textarea
                  className="input-field"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Enter reason..."
                  style={{ width: '100%', height: '80px', padding: '8px 12px', fontSize: '13px', resize: 'none' }}
                  required
                />
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {showRejectInput ? (
                <>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowRejectInput(false)}
                    disabled={processingRequest}
                  >
                    Back
                  </button>
                  <button 
                    type="button" 
                    className="btn" 
                    style={{ backgroundColor: '#EF4444', color: '#FFF' }}
                    onClick={async () => {
                      if (!rejectReason.trim()) {
                        alert("Please provide a rejection reason.");
                        return;
                      }
                      setProcessingRequest(true);
                      try {
                        await rejectShareRequest(selectedRequest.id, user?.id || 'System', rejectReason);
                        await markNotificationAsRead(selectedRequest.notificationId);
                        alert("Request rejected successfully.");
                        setSelectedRequest(null);
                      } catch (err) {
                        alert("Failed to reject request: " + err.message);
                      }
                      setProcessingRequest(false);
                    }}
                    disabled={processingRequest}
                  >
                    Confirm Reject
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowRejectInput(true)}
                    disabled={processingRequest}
                  >
                    Reject Request
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={async () => {
                      setProcessingRequest(true);
                      try {
                        await approveShareRequest(selectedRequest.id, user?.id || 'System');
                        await markNotificationAsRead(selectedRequest.notificationId);
                        alert("Request approved successfully! Shares added to investor.");
                        setSelectedRequest(null);
                      } catch (err) {
                        alert("Failed to approve request: " + err.message);
                      }
                      setProcessingRequest(false);
                    }}
                    disabled={processingRequest}
                  >
                    Approve & Add Units
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
