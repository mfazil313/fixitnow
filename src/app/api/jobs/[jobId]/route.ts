import { NextRequest, NextResponse } from 'next/server';
import { getJob, isSupabaseConfigured } from '@/lib/jobStore';
import { getLocalJob } from '@/lib/localJobsStore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (isSupabaseConfigured()) {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).single();
      if (error || !data) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      return NextResponse.json({ job: data });
    } else {
      // First check in-memory store (jobs created this session)
      let job = getJob(jobId);
      // Fall back to disk-persisted store (jobs from previous sessions)
      if (!job) {
        job = getLocalJob(jobId);
      }
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      return NextResponse.json({ job });
    }
  } catch (error) {
    console.error('Job fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

