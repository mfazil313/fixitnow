import Link from 'next/link';
import { Worker } from '@/lib/types';
import { TRADE_CONFIG } from '@/lib/types';
import { StarIcon, AwardIcon, MapPinIcon, BuildingIcon, CheckBadgeIcon, getTradeIcon } from '@/components/Icons';
import styles from './WorkerCard.module.css';
import { useLanguage } from '@/context/LanguageContext';

interface WorkerCardProps {
  worker: Worker & { profiles?: { full_name: string; avatar_url: string | null; city: string | null } };
  distanceKm?: number;
  jobId?: string;
}

export default function WorkerCard({ worker, distanceKm, jobId }: WorkerCardProps) {
  const { t } = useLanguage();
  const trade = TRADE_CONFIG[worker.trade];
  const initials = worker.profiles?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?';

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <Link href={`/worker/${worker.id}`} className={styles.avatarWrap} title={`View ${worker.profiles?.full_name || 'Worker'}'s Profile`}>
          {worker.profiles?.avatar_url ? (
            <img src={worker.profiles.avatar_url} alt={worker.profiles.full_name} className={styles.avatar} />
          ) : (
            <div className={styles.avatarFallback}>{initials}</div>
          )}
          <span className={`${styles.statusDot} ${worker.is_available ? styles.online : styles.offline}`} />
        </Link>

        <div className={styles.info}>
          <div className={styles.nameRow}>
            <Link href={`/worker/${worker.id}`} title={`View ${worker.profiles?.full_name || 'Worker'}'s Profile`}>
              <h3 className={styles.name}>{worker.profiles?.full_name || 'Worker'}</h3>
            </Link>
            {worker.is_verified && (
              <span className={styles.verified} title="Verified Worker">
                <CheckBadgeIcon size={12} /> {t('card.verified')}
              </span>
            )}
          </div>
          <div className={styles.tradeBadge} style={{ background: trade.bg, color: trade.color }}>
            {getTradeIcon(worker.trade, 14)} {t(`trade.${worker.trade}`)}
          </div>
        </div>

        <div className={styles.rateWrap}>
          <div className={styles.rate}>₹{worker.hourly_rate}<span>/hr</span></div>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statIconWrapper} style={{ color: '#f59e0b', background: '#fef3c7' }}>
            <StarIcon size={14} />
          </span>
          <span className={styles.statVal}>{(Number(worker.rating) || 4.8).toFixed(1)}</span>
          <span className={styles.statLbl}>({worker.total_reviews ?? 0} {t('card.reviews')})</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statIconWrapper} style={{ color: '#4f46e5', background: '#eef2ff' }}>
            <AwardIcon size={14} />
          </span>
          <span className={styles.statVal}>{worker.experience_years}y</span>
          <span className={styles.statLbl}>{t('card.experience')}</span>
        </div>
        {distanceKm !== undefined && (
          <div className={styles.stat}>
            <span className={styles.statIconWrapper} style={{ color: '#0ea5e9', background: '#e0f2fe' }}>
              <MapPinIcon size={14} />
            </span>
            <span className={styles.statVal}>{distanceKm < 1 ? '<1' : distanceKm.toFixed(1)}km</span>
            <span className={styles.statLbl}>{t('card.away')}</span>
          </div>
        )}
        {worker.profiles?.city && (
          <div className={styles.stat}>
            <span className={styles.statIconWrapper} style={{ color: '#8b5cf6', background: '#ede9fe' }}>
              <BuildingIcon size={14} />
            </span>
            <span className={styles.statLbl}>{worker.profiles.city}</span>
          </div>
        )}
      </div>

      {/* Bio */}
      {worker.bio && (
        <p className={styles.bio}>{worker.bio}</p>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <Link
          href={`/worker/${worker.id}`}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1 }}
        >
          {t('card.view_profile')}
        </Link>
        <Link
          href={jobId ? `/book/${jobId}?workerId=${worker.id}` : `/book/new?workerId=${worker.id}`}
          className="btn btn-primary btn-sm"
          style={{ flex: 2 }}
        >
          {t('card.book_now')} →
        </Link>
      </div>
    </div>
  );
}
