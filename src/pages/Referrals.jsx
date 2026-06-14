import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInvestors, awardFreeShareRecord } from '../db';
import { Trophy, Gift } from 'lucide-react';

const Referrals = () => {
  const [ranking, setRanking] = useState([]);

  const loadRanking = async () => {
    const allInvestors = await getInvestors();
    
    // Group by referredBy
    const refCounts = {};
    allInvestors.forEach(inv => {
      if (inv.referredBy) {
        if (!refCounts[inv.referredBy]) {
          refCounts[inv.referredBy] = { id: inv.referredBy, count: 0, awarded: 0 };
        }
        refCounts[inv.referredBy].count += 1;
      }
    });

    // We also need the referring investor's details (name, current shares)
    const rankingArray = Object.values(refCounts).map(ref => {
      const referrerInfo = allInvestors.find(i => i.id === ref.id) || { name: 'Unknown', shares: 0, awardedFreeShares: 0 };
      return {
        ...ref,
        name: referrerInfo.name,
        shares: referrerInfo.shares,
        awarded: referrerInfo.awardedFreeShares || 0
      };
    });

    // Sort by count descending
    rankingArray.sort((a, b) => b.count - a.count);
    setRanking(rankingArray);
  };

  const awardFreeShare = async (referrerId, name, awardedSoFar) => {
    try {
      await awardFreeShareRecord(referrerId, name);
      alert("Free share awarded successfully!");
      await loadRanking();
    } catch (err) {
      alert("Failed to award free share: " + err.message);
    }
  };

  useEffect(() => {
    loadRanking();
  }, []);


  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Referral Ranking</h1>
        <Link to="/free-shares" className="btn btn-primary" style={{ backgroundColor: 'var(--color-warning)', color: '#000', borderColor: 'var(--color-warning)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <Gift size={16} /> Free Share Profits
        </Link>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Trophy color="var(--color-warning)" />
          <h3 style={{ color: 'var(--color-text-white)', fontSize: '18px' }}>Leaderboard</h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Rank</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Investor ID</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Referrals</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((ref, index) => {
              const eligibleFor = Math.floor(ref.count / 4);
              const canAward = eligibleFor > ref.awarded;

              return (
                <tr key={ref.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-white)', fontWeight: 600 }}>#{index + 1}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-primary)' }}>{ref.id}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-white)' }}>{ref.name}</td>
                  <td style={{ padding: '12px 16px' }}>{ref.count}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {canAward ? (
                      <button onClick={() => awardFreeShare(ref.id, ref.name, ref.awarded)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--color-warning)', color: '#000' }}>
                        <Gift size={14} style={{ marginRight: '6px' }} /> Award Free Share
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {4 - (ref.count % 4)} more for next share
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {ranking.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No referrals found yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Referrals;
