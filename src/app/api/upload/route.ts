import { NextRequest, NextResponse } from 'next/server';
import { analyzeMediaWithGemini } from '@/lib/gemini';
import { isSupabaseConfigured, mockJobs } from '@/lib/jobStore';
import { saveLocalJob } from '@/lib/localJobsStore';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const locationLat = formData.get('locationLat') as string;
    const locationLng = formData.get('locationLng') as string;
    const locationAddress = formData.get('locationAddress') as string;

    const selectedModel = (formData.get('selectedModel') as 'gemini' | 'fixitnow') || 'gemini';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const isVideo = file.type.startsWith('video/');
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');

    const aiResult = await analyzeMediaWithGemini(base64, file.type, selectedModel, file.name);
    const aiModelName = aiResult.ai_model || 'FixItNow Vision AI';

    let dbJob = null;
    if (isSupabaseConfigured()) {
      try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        // Race Supabase with 1.2s timeout so offline mode doesn't hang waiting for network
        const userPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Offline network timeout')), 1200));
        
        const { data: { user } } = await Promise.race([userPromise, timeoutPromise]) as any;

        if (user) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('job-media')
            .upload(fileName, file, { contentType: file.type, upsert: false });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('job-media').getPublicUrl(fileName);
            const { data: insertedJob } = await supabase.from('jobs').insert({
              customer_id: user.id,
              media_url: publicUrl,
              media_type: isVideo ? 'video' : 'image',
              status: 'pending',
              location_lat: locationLat ? parseFloat(locationLat) : null,
              location_lng: locationLng ? parseFloat(locationLng) : null,
              location_address: locationAddress || null,
              ai_problem_title: aiResult.problem_title,
              ai_description: aiResult.description,
              ai_trade_required: aiResult.trade_required,
              ai_dimension: aiResult.estimated_dimension,
              ai_severity: aiResult.severity,
              ai_confidence: aiResult.confidence,
              ai_model: aiModelName,
              specialized_metrics: aiResult.specialized_metrics,
            }).select().single();

            dbJob = insertedJob;
          }
        }
      } catch (err) {
        console.warn('Supabase DB skipped (Offline mode):', err);
      }
    }

    if (dbJob) {
      return NextResponse.json({ success: true, job: dbJob, aiResult });
    }

    // Local / fallback mode
    const mediaUrl = `data:${file.type};base64,${base64}`;

    const localJob = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      customer_id: 'local-user',
      media_url: mediaUrl,
      media_type: (isVideo ? 'video' : 'image') as 'video' | 'image',
      ai_problem_title: aiResult.problem_title,
      ai_description: aiResult.description,
      ai_trade_required: aiResult.trade_required,
      ai_dimension: aiResult.estimated_dimension,
      ai_severity: aiResult.severity,
      ai_confidence: aiResult.confidence,
      ai_model: aiModelName,
      specialized_metrics: aiResult.specialized_metrics,
      status: 'pending' as const,
      location_lat: locationLat ? parseFloat(locationLat) : null,
      location_lng: locationLng ? parseFloat(locationLng) : null,
      location_address: locationAddress || null,
      assigned_worker_id: null,
      created_at: new Date().toISOString(),
    };

    mockJobs.set(localJob.id, localJob);
    saveLocalJob(localJob);
    return NextResponse.json({ success: true, job: localJob, aiResult });
  } catch (error: any) {
    console.error('Upload route error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
