import { useEffect, useState } from 'react';
import { getInvestors, getFunds } from '../db';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalInvestors: 0, totalShares: 0, totalInvestment: 0, companyFund: 0, reserveFund: 0, activeShares: 0, pendingShares: 0, ultraActiveShares: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const investors = await getInvestors();
      const funds = await getFunds();
      
      let shares = 0;
      let investment = 0;
      let active = 0;
      let pending = 0;
      let ultra = 0;

      investors.forEach(inv => {
        shares += parseInt(inv.shares, 10) || 0;
        investment += parseInt(inv.amount, 10) || 0;
        if (inv.investments) {
          inv.investments.forEach(s => {
            const num = parseInt(s.shares, 10) || 0;
            if (s.status === 'Active') active += num;
            else if (s.status === 'Pending') pending += num;
            else if (s.status === 'Ultra Active' || s.status === 'Ultra active') ultra += num;
          });
        }
      });

      setStats({
        totalInvestors: investors.length,
        totalShares: shares,
        totalInvestment: investment,
        companyFund: funds ? funds.companyFund : 0,
        reserveFund: funds ? funds.reserveFund : 0,
        activeShares: active,
        pendingShares: pending,
        ultraActiveShares: ultra
      });
    };
    fetchData();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Executive Dashboard</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Investors</p>
            <h3 style={{ fontSize: '24px', color: 'var(--color-text-white)', marginTop: '4px' }}>{stats.totalInvestors}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
            <Activity size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Shares Issued</p>
            <h3 style={{ fontSize: '24px', color: 'var(--color-text-white)', marginTop: '4px' }}>{stats.totalShares}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Investment</p>
            <h3 style={{ fontSize: '24px', color: 'var(--color-text-white)', marginTop: '4px' }}>৳{stats.totalInvestment.toLocaleString()}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Company Fund Balance</p>
            <h3 style={{ fontSize: '24px', color: 'var(--color-text-white)', marginTop: '4px' }}>৳{stats.companyFund.toLocaleString()}</h3>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card">
          <h3 style={{ color: 'var(--color-text-white)', marginBottom: '16px', fontSize: '18px' }}>Shares Distribution</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Active</p>
              <p style={{ color: '#3B82F6', fontSize: '20px', fontWeight: 'bold' }}>{stats.activeShares}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Pending</p>
              <p style={{ color: '#F59E0B', fontSize: '20px', fontWeight: 'bold' }}>{stats.pendingShares}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Ultra Active</p>
              <p style={{ color: '#10B981', fontSize: '20px', fontWeight: 'bold' }}>{stats.ultraActiveShares}</p>
            </div>
          </div>
          <div style={{ height: '240px' }}>
            {stats.totalShares > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active', value: stats.activeShares },
                      { name: 'Pending', value: stats.pendingShares },
                      { name: 'Ultra Active', value: stats.ultraActiveShares }
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { name: 'Active', color: '#3B82F6' },
                      { name: 'Pending', color: '#F59E0B' },
                      { name: 'Ultra Active', color: '#10B981' }
                    ].filter(c => [
                      { name: 'Active', value: stats.activeShares },
                      { name: 'Pending', value: stats.pendingShares },
                      { name: 'Ultra Active', value: stats.ultraActiveShares }
                    ].filter(d => d.value > 0).some(d => d.name === c.name)).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-white)', borderRadius: '8px' }} itemStyle={{ color: 'var(--color-text-white)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>No share data available</div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ color: 'var(--color-text-white)', marginBottom: '16px', fontSize: '18px' }}>Company Overview</h3>
          <div style={{ color: 'var(--color-text)', lineHeight: '1.8' }}>
            <p>Welcome to the Woora Institutional Management System. This portal is the central hub for managing investor relations, tracking capital influx, and managing corporate profitability.</p>
            <br/>
            <p><strong>System Highlights:</strong></p>
            <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
              <li>Track investors securely with automated date tracking.</li>
              <li>Distribute 40% of net profits back to investors seamlessly based on their active shares.</li>
              <li>Maintain 40% for the company fund and a rigorous 20% in reserve.</li>
              <li>Automatically handle investor referrals (1 free share per 4 referred investors).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
