'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Job, TRADE_CONFIG, TradeType } from '@/lib/types';
import WorkerCard from '@/components/WorkerCard';
import {
  MapPinIcon,
  RulerIcon,
  AlertTriangleIcon,
  WrenchToolsIcon,
  GearIcon,
  ClipboardCheckIcon,
  ClockIcon,
  SparklesIcon,
  getTradeIcon
} from '@/components/Icons';
import styles from './results.module.css';

export default function ResultsPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const [job, setJob] = useState<Job | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Chatbot Assistant State
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: 'ai' | 'user'; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading, chatOpen]);

  useEffect(() => {
    const fetchJob = async () => {
      let jobData: Job | null = null;

      // First try sessionStorage
      try {
        const cached = sessionStorage.getItem(`job-${jobId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.media_url) {
            jobData = parsed;
          }
        }
      } catch {}

      // If not in sessionStorage or missing media_url, fetch from API
      if (!jobData || !jobData.media_url) {
        try {
          const res = await fetch(`/api/jobs/${jobId}`);
          const data = await res.json();
          if (res.ok && data.job) {
            jobData = data.job;
          }
        } catch (err) {
          console.error('Failed to fetch job from API:', err);
        }
      }

      if (jobData) {
        setJob(jobData);

        // Pre-fill initial AI greeting message
        const initialTitle = jobData.ai_problem_title || 'repair issue';
        setChatMessages([
          {
            id: 'init-1',
            role: 'ai',
            text: `I've analyzed your **${initialTitle}**. You can ask me to **recommend the best verified worker**, calculate **detailed repair & parts costs**, assess **DIY vs professional feasibility**, or provide **instant emergency containment steps**!`
          }
        ]);

        // Fetch matching workers strictly for the required trade category
        const searchParams = new URLSearchParams();
        const reqTrade = jobData.ai_trade_required || 'other';
        searchParams.set('trade', reqTrade);
        if (jobData.location_lat) searchParams.set('lat', jobData.location_lat.toString());
        if (jobData.location_lng) searchParams.set('lng', jobData.location_lng.toString());

        try {
          const wRes = await fetch(`/api/workers?${searchParams.toString()}`);
          const wData = await wRes.json();
          setWorkers(wData.workers || []);
        } catch {
          setWorkers([]);
        }
      }

      setLoading(false);
    };
    fetchJob();
  }, [jobId]);

  const handleSendChatMessage = async (userText: string) => {
    const textToSend = userText.trim();
    if (!textToSend || !job || chatLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMessages = [...chatMessages, { id: userMsgId, role: 'user' as const, text: textToSend }];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/results-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: job.ai_problem_title,
          jobDesc: job.ai_description,
          trade: job.ai_trade_required,
          severity: job.ai_severity,
          dimension: job.ai_dimension,
          userMessage: textToSend,
          chatHistory: chatMessages.slice(-8),
          workers: workers.map((w: any) => ({
            id: w.id,
            name: w.profiles?.full_name || 'Specialist',
            trade: w.trade,
            rating: w.rating,
            reviews: w.total_reviews,
            hourly_rate: w.hourly_rate,
            experience_years: w.experience_years,
            is_verified: w.is_verified,
            distance_km: w.distance_km,
            city: w.profiles?.city || ''
          }))
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setChatMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'ai', text: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'ai', text: 'I am here to help! Feel free to ask about safety precautions, materials, or repair cost estimates.' }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'ai', text: 'For temporary safety: turn off main supply valves or electrical breakers before inspecting damage further.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={`container ${styles.container}`}>
          <div className={styles.loadingState}>
            <div className="spinner spinner-lg" />
            <p>Loading analysis results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className={styles.page}>
        <div className={`container ${styles.container}`}>
          <div className={styles.loadingState}>
            <p>Job not found.</p>
            <Link href="/upload" className="btn btn-primary">Upload New Problem</Link>
          </div>
        </div>
      </div>
    );
  }

  const tradeKey = (job.ai_trade_required as TradeType) || 'other';
  const trade = TRADE_CONFIG[tradeKey] || TRADE_CONFIG.other;
  const severityColors: Record<string, string> = { minor: '#10b981', moderate: '#f59e0b', urgent: '#f43f5e' };

  /** Rich structured Markdown → JSX renderer for AI chat bubbles */
  function renderMarkdown(text: string) {
    const lines = text.split('\n');
    return lines.map((line, li) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={li} style={{ height: '8px' }} />;
      }

      // 1. Heading check: ###, ##, #
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const titleText = headingMatch[2];
        return (
          <div
            key={li}
            style={{
              fontWeight: 800,
              fontSize: level <= 2 ? '14.5px' : '13.5px',
              color: '#1e1b4b',
              marginTop: li === 0 ? '0' : '10px',
              marginBottom: '4px',
              letterSpacing: '-0.2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {renderInlineMarkdown(titleText)}
          </div>
        );
      }

      // 2. Numbered list check: 1. , 2. , etc.
      const numberMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (numberMatch) {
        const num = numberMatch[1];
        const itemText = numberMatch[2];
        return (
          <div
            key={li}
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              margin: '5px 0',
              lineHeight: 1.5
            }}
          >
            <span
              style={{
                minWidth: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#e0e7ff',
                color: '#4338ca',
                fontSize: '11px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}
            >
              {num}
            </span>
            <div style={{ flex: 1 }}>{renderInlineMarkdown(itemText)}</div>
          </div>
        );
      }

      // 3. Bullet point check: • , * , -
      const bulletMatch = line.match(/^(\*|-|•)\s+(.+)$/);
      if (bulletMatch) {
        const itemText = bulletMatch[2];
        return (
          <div
            key={li}
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              margin: '4px 0',
              lineHeight: 1.5
            }}
          >
            <span
              style={{
                color: '#4f46e5',
                fontSize: '14px',
                fontWeight: 900,
                lineHeight: 1,
                marginTop: '4px',
                flexShrink: 0
              }}
            >
              •
            </span>
            <div style={{ flex: 1 }}>{renderInlineMarkdown(itemText)}</div>
          </div>
        );
      }

      // 4. Standard Paragraph
      return (
        <div key={li} style={{ margin: '3px 0', lineHeight: 1.55 }}>
          {renderInlineMarkdown(line)}
        </div>
      );
    });
  }

  /** Parses inline **bold**, *italic*, and `code` tags */
  function renderInlineMarkdown(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
    let last = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) {
        parts.push(text.slice(last, match.index));
      }
      if (match[1] !== undefined) {
        // **bold**
        parts.push(
          <strong key={match.index} style={{ fontWeight: 750, color: '#0f172a' }}>
            {match[1]}
          </strong>
        );
      } else if (match[2] !== undefined) {
        // *italic*
        parts.push(<em key={match.index}>{match[2]}</em>);
      } else if (match[3] !== undefined) {
        // `code` badge
        parts.push(
          <code
            key={match.index}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              padding: '2px 5px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            {match[3]}
          </code>
        );
      }
      last = match.index + match[0].length;
    }

    if (last < text.length) {
      parts.push(text.slice(last));
    }

    return parts;
  }

  const quickChips = [
    {
      icon: (
        <span className={styles.chipIconContainer} style={{ background: '#e0e7ff', color: '#4338ca' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </span>
      ),
      label: `Who is the best ${trade.label.toLowerCase()} recommended for this job?`
    },
    {
      icon: (
        <span className={styles.chipIconContainer} style={{ background: '#d1fae5', color: '#059669' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </span>
      ),
      label: `Estimated repair cost & labor charges`
    },
    {
      icon: (
        <span className={styles.chipIconContainer} style={{ background: '#fef3c7', color: '#d97706' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </span>
      ),
      label: `Can I DIY fix this or should I call a pro?`
    },
    {
      icon: (
        <span className={styles.chipIconContainer} style={{ background: '#ffe4e6', color: '#e11d48' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </span>
      ),
      label: `What emergency containment steps should I take now?`
    }
  ];



  return (
    <div className={styles.page}>
      <div className={`container ${styles.container}`}>
        {/* AI Result Card */}
        <div className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <div className={styles.aiTag}>
              <span className={styles.aiPulse} />
              AI Analysis Complete
            </div>
            {job.ai_confidence && (
              <div className={styles.confidence}>
                {Math.round(job.ai_confidence * 100)}% confident
              </div>
            )}
          </div>

          <div className={styles.resultBody}>
            {/* Top Hero Section: Media + Title/Desc */}
            <div className={styles.heroSection}>
              {job.media_url && (
                <div className={styles.heroMediaPreview}>
                  {job.media_type === 'video' ? (
                    <video src={job.media_url} controls className={styles.media} />
                  ) : (
                    <img src={job.media_url} alt="Problem" className={styles.media} />
                  )}
                </div>
              )}

              <div className={styles.heroDetails}>
                <div className={styles.detailsHeaderRow}>
                  <div className={styles.tradeBadgeLg} style={{ background: trade.bg, color: trade.color }}>
                    {getTradeIcon(tradeKey, 14)}
                    <span>{trade.label} Required</span>
                  </div>

                  <Link href="/upload" className={styles.cancelUploadBtn} title="Cancel and upload a different photo">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    <span className={styles.cancelUploadText}>Cancel &amp; Upload New</span>
                  </Link>
                </div>

                <h1 className={styles.problemTitle}>{job.ai_problem_title || 'Problem Detected'}</h1>
                <p className={styles.problemDesc}>{job.ai_description}</p>
              </div>
            </div>

            <div className={styles.sectionDivider} />

            {/* Full Width Metadata Grid */}
            <div className={styles.metaGrid}>
              {job.ai_dimension && (
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon}>
                    <RulerIcon size={18} style={{ color: '#4f46e5' }} />
                  </span>
                  <div>
                    <div className={styles.metaLabel}>Estimated Size</div>
                    <div className={styles.metaValue}>{job.ai_dimension}</div>
                  </div>
                </div>
              )}
              {job.ai_severity && (
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon} style={{
                    background: job.ai_severity === 'urgent' ? 'rgba(244,63,94,0.08)' : job.ai_severity === 'moderate' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                    borderColor: job.ai_severity === 'urgent' ? 'rgba(244,63,94,0.2)' : job.ai_severity === 'moderate' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'
                  }}>
                    <AlertTriangleIcon size={18} style={{ color: severityColors[job.ai_severity] }} />
                  </span>
                  <div>
                    <div className={styles.metaLabel}>Severity</div>
                    <div className={styles.metaValue} style={{ color: severityColors[job.ai_severity] }}>
                      {job.ai_severity.charAt(0).toUpperCase() + job.ai_severity.slice(1)}
                    </div>
                  </div>
                </div>
              )}
              {job.location_address && (
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon}>
                    <MapPinIcon size={18} style={{ color: '#4f46e5' }} />
                  </span>
                  <div>
                    <div className={styles.metaLabel}>Location</div>
                    <div className={styles.metaValue}>{job.location_address}</div>
                  </div>
                </div>
              )}
              {job.ai_model && (
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon}>
                    <SparklesIcon size={18} style={{ color: '#0d9488' }} />
                  </span>
                  <div>
                    <div className={styles.metaLabel}>AI Model Engine</div>
                    <div className={styles.metaValue}>
                      {job.ai_model?.toLowerCase().includes('gemini') || job.ai_model?.toLowerCase().includes('google')
                        ? 'FixItNow Vision AI'
                        : job.ai_model}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Specialized AI Metrics & Calculation Card */}
            {job.specialized_metrics && (
              <div className={styles.specializedCard}>
                <h3 className={styles.specializedHeader}>
                  <GearIcon size={18} style={{ color: '#4f46e5' }} />
                  <span>AI Engineering &amp; Material Calculations</span>
                </h3>
                <div className={styles.specializedGrid}>
                  {job.specialized_metrics.land_size_sqft && (
                    <div className={styles.specItem}>
                      <span className={styles.specIcon}><RulerIcon size={16} style={{ color: '#10b981' }} /></span>
                      <div>
                        <div className={styles.specLabel}>Estimated Land / Lawn Size</div>
                        <div className={styles.specValue}>{job.specialized_metrics.land_size_sqft}</div>
                      </div>
                    </div>
                  )}
                  {job.specialized_metrics.fuel_required_liters && (
                    <div className={styles.specItem}>
                      <span className={styles.specIcon}><GearIcon size={16} style={{ color: '#f59e0b' }} /></span>
                      <div>
                        <div className={styles.specLabel}>Fuel / Power Required</div>
                        <div className={styles.specValue}>{job.specialized_metrics.fuel_required_liters}</div>
                      </div>
                    </div>
                  )}
                  {job.specialized_metrics.tank_capacity_liters && (
                    <div className={styles.specItem}>
                      <span className={styles.specIcon}><WrenchToolsIcon size={16} style={{ color: '#0ea5e9' }} /></span>
                      <div>
                        <div className={styles.specLabel}>Tank Storage Capacity</div>
                        <div className={styles.specValue}>{job.specialized_metrics.tank_capacity_liters}</div>
                      </div>
                    </div>
                  )}
                  {job.specialized_metrics.chemical_cleaning_needed && (
                    <div className={styles.specItem}>
                      <span className={styles.specIcon}><WrenchToolsIcon size={16} style={{ color: '#8b5cf6' }} /></span>
                      <div>
                        <div className={styles.specLabel}>Sanitizer / Chemical Required</div>
                        <div className={styles.specValue}>{job.specialized_metrics.chemical_cleaning_needed}</div>
                      </div>
                    </div>
                  )}
                  {job.specialized_metrics.brick_count_estimate && (
                    <div className={styles.specItem}>
                      <span className={styles.specIcon}><WrenchToolsIcon size={16} style={{ color: '#d97706' }} /></span>
                      <div>
                        <div className={styles.specLabel}>Interlock Bricks Required</div>
                        <div className={styles.specValue}>{job.specialized_metrics.brick_count_estimate}</div>
                      </div>
                    </div>
                  )}
                  {job.specialized_metrics.sand_base_cubic_ft && (
                    <div className={styles.specItem}>
                      <span className={styles.specIcon}><ClockIcon size={16} style={{ color: '#64748b' }} /></span>
                      <div>
                        <div className={styles.specLabel}>Sand Base Volume</div>
                        <div className={styles.specValue}>{job.specialized_metrics.sand_base_cubic_ft}</div>
                      </div>
                    </div>
                  )}
                  {job.specialized_metrics.pressure_washer_psi && (
                    <div className={styles.specItem}>
                      <span className={styles.specIcon}><WrenchToolsIcon size={16} style={{ color: '#0284c7' }} /></span>
                      <div>
                        <div className={styles.specLabel}>Pressure Washer Rating</div>
                        <div className={styles.specValue}>{job.specialized_metrics.pressure_washer_psi}</div>
                      </div>
                    </div>
                  )}
                  {job.specialized_metrics.estimated_time_hours && (
                    <div className={styles.specItem}>
                      <span className={styles.specIcon}><ClockIcon size={16} style={{ color: '#4f46e5' }} /></span>
                      <div>
                        <div className={styles.specLabel}>Estimated Duration</div>
                        <div className={styles.specValue}>{job.specialized_metrics.estimated_time_hours}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step-by-Step AI Solution Plan */}
                {job.specialized_metrics.solution_steps && job.specialized_metrics.solution_steps.length > 0 && (
                  <div className={styles.solutionBox}>
                    <div className={styles.solutionTitle}>
                      <ClipboardCheckIcon size={18} style={{ color: '#4f46e5' }} />
                      <span>AI Step-by-Step Resolution Plan</span>
                    </div>
                    <div className={styles.solutionList}>
                      {job.specialized_metrics.solution_steps.map((step: string, idx: number) => (
                        <div key={idx} className={styles.solutionStepItem}>
                          <span className={styles.stepNumberBadge}>{idx + 1}</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Workers Section */}
        <div className={styles.workersSection}>
          <div className={styles.workersHead}>
            <h2 className={styles.workersTitle}>
              <WrenchToolsIcon size={22} style={{ color: '#4f46e5' }} />
              <span>Available {trade.label}s Nearby</span>
            </h2>
            <span className={styles.workersCount}>{workers.length} found</span>
          </div>

          {workers.length > 0 ? (
            <div className={styles.workersGrid}>
              {workers.map((w: any) => (
                <WorkerCard
                  key={w.id}
                  worker={w}
                  distanceKm={w.distance_km}
                  jobId={jobId}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noWorkers}>
              <p>No workers found nearby for this trade. Try browsing all workers.</p>
              <Link href="/workers" className="btn btn-secondary">Browse All Workers</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── FLOATING AI CHATBOT POPUP WIDGET ── */}
      <button
        type="button"
        className={`${styles.floatingAiBtn} ${chatOpen ? styles.floatingAiBtnActive : ''}`}
        onClick={() => setChatOpen(o => !o)}
        title={chatOpen ? 'Close AI Chat' : 'Chat with AI Assistant'}
        aria-label="Toggle AI Chat"
      >
        {chatOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <>
            <SparklesIcon size={18} />
            <span>Chat with AI</span>
            <span className={styles.floatingPulseDot} />
          </>
        )}
      </button>

      {/* Popup Chat Box */}
      {chatOpen && (
        <div className={styles.chatPopup} role="dialog" aria-label="AI Chat Assistant">
          {/* Header */}
          <div className={styles.chatPopupHeader}>
            <div className={styles.chatPopupHeaderLeft}>
              <div className={styles.chatPopupAvatar}>
                <SparklesIcon size={18} style={{ color: '#ffffff' }} />
              </div>
              <div>
                <p className={styles.chatPopupTitle}>FixItNow AI Assistant</p>
                <p className={styles.chatPopupSubtitle}>Ask about this {trade.label.toLowerCase()} issue</p>
              </div>
            </div>
            <div className={styles.chatPopupBadge}>
              <span className={styles.aiChatDot} />
              <span>Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.chatPopupMessages}>
            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`${styles.chatMessage} ${msg.role === 'user' ? styles.chatMessageUser : styles.chatMessageAi}`}
              >
                <div className={`${styles.msgAvatar} ${msg.role === 'user' ? styles.msgAvatarUser : styles.msgAvatarAi}`}>
                  {msg.role === 'user' ? 'YOU' : <SparklesIcon size={13} />}
                </div>
                <div className={`${styles.msgBubble} ${msg.role === 'user' ? styles.msgBubbleUser : styles.msgBubbleAi}`}>
                  {msg.role === 'ai' ? renderMarkdown(msg.text) : msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className={`${styles.chatMessage} ${styles.chatMessageAi}`}>
                <div className={`${styles.msgAvatar} ${styles.msgAvatarAi}`}>
                  <SparklesIcon size={13} />
                </div>
                <div className={styles.typingIndicator}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Chips - Hides automatically once the user types or sends a message */}
          {!(chatMessages.length > 1 || chatInput.trim().length > 0) && (
            <div className={styles.chatPopupChips}>
              {quickChips.map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  className={styles.chipBtn}
                  onClick={() => handleSendChatMessage(chip.label)}
                  disabled={chatLoading}
                >
                  {chip.icon}
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            className={styles.chatPopupInput}
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChatMessage(chatInput);
            }}
          >
            <input
              type="text"
              className={styles.chatInput}
              placeholder={`Ask about this ${trade.label.toLowerCase()} issue...`}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              disabled={chatLoading}
              autoFocus
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={chatLoading || !chatInput.trim()}
              title="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
