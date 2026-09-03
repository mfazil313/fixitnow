'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './upload.module.css';
import { useLanguage } from '@/context/LanguageContext';

type UploadMode = 'image' | 'video';

// Compress uploaded image client-side to ~80KB JPEG so it never exceeds browser storage quotas
function compressImageClientSide(file: File, maxDim = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || '');
      img.src = (e.target?.result as string) || '';
    };
    reader.readAsDataURL(file);
  });
}

export default function UploadPage() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<UploadMode>('image');
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'fixitnow'>('fixitnow');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [locLoading, setLocLoading] = useState(true);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();



  // Get location on mount
  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocLoading(false);
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: data.display_name || 'Location detected',
          });
        } catch {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: 'Location detected' });
        }
        setLocLoading(false);
      },
      () => setLocLoading(false),
      { timeout: 15000, enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => { requestLocation(); }, [requestLocation]);


  const handleFile = useCallback((f: File) => {
    const isImage = f.type.startsWith('image/');
    const isVideo = f.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setError('Please upload an image or video file.');
      return;
    }

    // Image size limit: 20MB, Video size limit: 20MB
    const maxSize = 20 * 1024 * 1024;
    if (f.size > maxSize) {
      setError(`File must be under 20MB.`);
      return;
    }

    setFile(f);
    setMode(isVideo ? 'video' : 'image');
    setError('');

    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      // For videos, create object URL for preview (faster than data URL)
      const url = URL.createObjectURL(f);
      setPreview(url);
    }
  }, []);

  const clearFile = useCallback(() => {
    if (preview && file?.type.startsWith('video/')) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setError('');
    // Reset file inputs
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  }, [preview, file]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setUploadProgress(file.type.startsWith('video/') ? 'Uploading video...' : 'Uploading image...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('selectedModel', selectedModel);
      if (location) {
        formData.append('locationLat', location.lat.toString());
        formData.append('locationLng', location.lng.toString());
        formData.append('locationAddress', location.address);
      }

      const modelLabel = selectedModel === 'fixitnow' ? 'FixItNow Custom AI' : 'Google Gemini AI';
      setUploadProgress(
        file.type.startsWith('video/')
          ? `🤖 ${modelLabel} is watching your video and detecting the problem...`
          : `🤖 ${modelLabel} is analyzing your photo...`
      );

      // Generate a lightweight compressed image URL for instant local display
      let compressedMediaUrl = '';
      if (file.type.startsWith('image/')) {
        try {
          compressedMediaUrl = await compressImageClientSide(file);
        } catch {}
      }

      const res = await fetch('/api/upload', { method: 'POST', body: formData });

      // Guard against HTML error pages (Next.js server errors return text/html)
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Server error (${res.status}): ${text.slice(0, 120)}`);
      }
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      // Ensure data.job has a clean, lightweight media_url
      if (compressedMediaUrl) {
        data.job.media_url = compressedMediaUrl;
      }

      // Store job data safely in sessionStorage with compressed media_url
      try {
        sessionStorage.setItem(`job-${data.job.id}`, JSON.stringify(data.job));
      } catch (e) {
        console.warn('SessionStorage warning:', e);
      }

      setUploadProgress('✅ Analysis complete! Redirecting...');

      // Navigate to results page
      router.push(`/results/${data.job.id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setUploading(false);
      setUploadProgress('');
    }
  };

  const isVideoFile = file?.type.startsWith('video/');

  const videoTips = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="5"></circle>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
        </svg>
      ),
      text: t('upload.tip_video_lighting')
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
      text: t('upload.tip_video_duration')
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="6"></circle>
          <circle cx="12" cy="12" r="2"></circle>
        </svg>
      ),
      text: t('upload.tip_video_focus')
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
      ),
      text: t('upload.tip_video_angles')
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
          <line x1="7" y1="2" x2="7" y2="22"></line>
          <line x1="17" y1="2" x2="17" y2="22"></line>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <line x1="2" y1="7" x2="7" y2="7"></line>
          <line x1="2" y1="17" x2="7" y2="17"></line>
          <line x1="17" y1="17" x2="22" y2="17"></line>
          <line x1="17" y1="7" x2="22" y2="7"></line>
        </svg>
      ),
      text: t('upload.tip_video_steady')
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21.3 20.4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1.7-.7l16.3 16.3a1 1 0 0 1 .3.8z"></path>
          <line x1="6" y1="18" x2="6" y2="16"></line>
          <line x1="8" y1="18" x2="8" y2="14"></line>
          <line x1="10" y1="18" x2="10" y2="16"></line>
          <line x1="12" y1="18" x2="12" y2="12"></line>
        </svg>
      ),
      text: t('upload.tip_video_scale')
    }
  ];

  const imageTips = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="5"></circle>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
        </svg>
      ),
      text: t('upload.tip_image_lighting')
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21.3 20.4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1.7-.7l16.3 16.3a1 1 0 0 1 .3.8z"></path>
          <line x1="6" y1="18" x2="6" y2="16"></line>
          <line x1="8" y1="18" x2="8" y2="14"></line>
          <line x1="10" y1="18" x2="10" y2="16"></line>
          <line x1="12" y1="18" x2="12" y2="12"></line>
        </svg>
      ),
      text: t('upload.tip_image_scale')
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="6"></circle>
          <circle cx="12" cy="12" r="2"></circle>
        </svg>
      ),
      text: t('upload.tip_image_focus')
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
      ),
      text: t('upload.tip_image_angles')
    }
  ];

  return (
    <div className={styles.page}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <span className="section-tag">✦ {t('upload.detect_problem')}</span>
          <h1 className="section-title">{t('upload.whats_problem')}</h1>
          <p className="section-subtitle">{t('upload.subtitle')}</p>
        </div>

        {/* Location */}
        <div className={styles.locationBar}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {locLoading ? (
            <span className={styles.locLoading}>{t('home.detecting_location')}</span>
          ) : location ? (
            <span className={styles.locAddress}>{location.address}</span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className={styles.locError}>{t('upload.location_unavailable')}</span>
              <button
                type="button"
                onClick={requestLocation}
                style={{
                  fontSize: '12px', padding: '2px 10px', borderRadius: '20px',
                  border: '1px solid #4f46e5', color: '#4f46e5', background: 'transparent',
                  cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap'
                }}
              >
                📍 Use My Location
              </button>
            </span>
          )}
        </div>

        {/* Mode Toggle */}
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${mode === 'image' && !file ? styles.modeBtnActive : ''} ${isVideoFile === false && file ? styles.modeBtnActive : ''}`}
            onClick={() => { if (!file) setMode('image'); }}
            disabled={!!file}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>{t('upload.photo_tab')}</span>
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'video' && !file ? styles.modeBtnActive : ''} ${isVideoFile ? styles.modeBtnActive : ''}`}
            onClick={() => { if (!file) setMode('video'); }}
            disabled={!!file}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            <span>{t('upload.video_tab')}</span>
          </button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={styles.fileInput}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          className={styles.fileInput}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {/* Upload Zone */}
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${preview ? styles.hasPreview : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!preview) {
              if (mode === 'video') {
                videoInputRef.current?.click();
              } else {
                imageInputRef.current?.click();
              }
            }
          }}
        >
          {preview ? (
            <div className={styles.previewWrap}>
              {isVideoFile ? (
                <video src={preview} className={styles.previewMedia} controls playsInline />
              ) : (
                <img src={preview} className={styles.previewMedia} alt="Preview" />
              )}
              <div className={styles.previewOverlay}>
                <span className={styles.mediaBadge}>
                  {isVideoFile ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  )}
                  <span>{isVideoFile ? t('upload.video_tab') : t('upload.photo_tab')}</span>
                </span>
              </div>
              <button
                className={styles.removeBtn}
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
              >
                ✕ {t('upload.remove')}
              </button>
            </div>
          ) : (
            <div className={styles.dropContent}>
              <div className={styles.dropIcon}>
                {mode === 'video' ? (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                ) : (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                )}
              </div>
              <h3 className={styles.dropTitle}>
                {mode === 'video' ? t('upload.drag_video') : t('upload.drag_photo')}
              </h3>
              <p className={styles.dropSubtitle}>
                {t('upload.drag_drop_hint')}
              </p>
              <div className={styles.dropActions}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (mode === 'video') {
                      videoInputRef.current?.click();
                    } else {
                      imageInputRef.current?.click();
                    }
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                    {mode === 'video' ? (
                      <>
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                      </>
                    ) : (
                      <>
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </>
                    )}
                  </svg>
                  {mode === 'video' ? 'Choose Video' : 'Choose Photo'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (mode === 'video') {
                      videoInputRef.current?.click();
                    } else {
                      imageInputRef.current?.click();
                    }
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                    {mode === 'video' ? (
                      <>
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                      </>
                    ) : (
                      <>
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </>
                    )}
                  </svg>
                  {mode === 'video' ? 'Record Video' : 'Take Photo'}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <div className="alert alert-error"><span>⚠️</span> {error}</div>}

        {/* Analyze CTA */}
        {file && (
          <div className={styles.analyzeCta}>
            <div className={styles.fileInfo}>
              <span className={styles.fileIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  {isVideoFile ? (
                    <>
                      <polygon points="23 7 16 12 23 17 23 7"/>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </>
                  ) : (
                    <>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </>
                  )}
                </svg>
              </span>
              <div>
                <div className={styles.fileName}>{file.name}</div>
                <div className={styles.fileSize}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {isVideoFile ? 'Video' : 'Image'}
                </div>
              </div>
            </div>

            {uploading && uploadProgress && (
              <div className={styles.progressBar}>
                <div className={styles.progressPulse} />
                <span className={styles.progressText}>{uploadProgress}</span>
              </div>
            )}

            <button
              className="btn btn-primary btn-lg btn-full"
              onClick={handleUploadAndAnalyze}
              disabled={uploading}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {uploading ? (
                <><span className="spinner" /> {isVideoFile ? 'Analyzing Video...' : 'Analyzing Photo...'}</>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v3M4.93 10.93l2.83 2.83M19.07 10.93l-2.83 2.83"/>
                    <rect x="5" y="8" width="14" height="12" rx="4"/>
                    <circle cx="9.5" cy="13" r="1.5" fill="currentColor"/>
                    <circle cx="14.5" cy="13" r="1.5" fill="currentColor"/>
                    <path d="M9.5 17h5"/>
                  </svg>
                  <span>Analyze {isVideoFile ? 'Video' : 'Photo'} with AI →</span>
                </>
              )}
            </button>

            {isVideoFile && (
              <p className={styles.videoNote}>
                💡 AI will watch the entire video to detect the problem, estimate dimensions, and assess urgency.
              </p>
            )}
          </div>
        )}

        {/* Tips */}
        <div className={styles.tips}>
          <h3 className={styles.tipsTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'text-bottom' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Tips for best results
          </h3>
          <div className={styles.tipsGrid}>
            {mode === 'video' ? (
              <>
                {videoTips.map((t, idx) => (
                  <div key={idx} className={styles.tipCard}>
                    <span className={styles.tipIconWrap}>{t.icon}</span>
                    <span>{t.text}</span>
                  </div>
                ))}
              </>
            ) : (
              <>
                {imageTips.map((t, idx) => (
                  <div key={idx} className={styles.tipCard}>
                    <span className={styles.tipIconWrap}>{t.icon}</span>
                    <span>{t.text}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
