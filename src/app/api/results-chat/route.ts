import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      jobTitle,
      jobDesc,
      trade,
      severity,
      dimension,
      userMessage,
      chatHistory = [],
      workers = []
    } = body;

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBSTZHC4Yot5UramZm8Jy4UTrh4a0db4I8';

    // Build worker context for AI
    let workersContext = 'No specific workers listed nearby.';
    if (Array.isArray(workers) && workers.length > 0) {
      workersContext = workers.slice(0, 6).map((w: any, idx: number) => 
        `${idx + 1}. **${w.name || 'Verified Specialist'}** (${w.trade}): ⭐ ${w.rating || 4.5} (${w.reviews || 0} reviews) | ₹${w.hourly_rate || 350}/hr | ${w.experience_years || 5} yrs exp | ${w.is_verified ? 'Verified ✓' : 'Standard'}${w.distance_km ? ` | ${w.distance_km.toFixed(1)} km away` : ''}`
      ).join('\n');
    }

    const systemPrompt = `You are FixItNow AI Assistant, an elite senior engineering consultant, master technician, and intelligent dispatch advisor for the FixItNow platform.

Detected Problem Details:
- Issue: ${jobTitle || 'Home Repair Issue'}
- Description: ${jobDesc || 'N/A'}
- Trade Category: ${trade || 'general'}
- Severity: ${severity || 'moderate'}
- Estimated Dimension / Scale: ${dimension || 'Standard scale'}

Available Nearby Specialists on FixItNow:
${workersContext}

CAPABILITIES & DIRECTIVES:
1. **Worker Recommendations**: When the user asks for the "best worker", "best plumber", "top technician", "who should I hire", or recommendations:
   - Identify the highest-rated, most experienced, or best-value worker from the list above.
   - Mention their **exact name**, **star rating**, **hourly rate**, **experience**, and why they are the best choice.
   - Encourage booking them directly using the "Book Worker" card on the screen.
2. **Technical & DIY Guidance**:
   - Provide safe, practical step-by-step instructions and required tools/materials.
   - For **urgent** or high-voltage/structural issues, clearly warn about hazards and recommend professional handling.
3. **Cost & Timeline Estimation**:
   - Give realistic cost estimates in INR (₹) covering labor charges + typical replacement parts.
4. **Tone & Formatting**:
   - Jump DIRECTLY into the answer without filler greetings ("Hello", "Hi there", "Sure").
   - Use clean Markdown with **bold headers/terms**, bullet points, and concise structure.
   - Keep answers sharp, high-value, and under 200 words.`;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash'];

        const historyText = Array.isArray(chatHistory)
          ? chatHistory.map((m: any) => `${m.role === 'user' ? 'User' : 'AI Assistant'}: ${m.text}`).join('\n')
          : '';

        const fullPrompt = `${systemPrompt}\n\nRecent Chat Conversation:\n${historyText}\n\nUser: ${userMessage}\nAI Assistant:`;

        for (const modelName of modelsToTry) {
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1024,
              }
            });
            const result = await model.generateContent(fullPrompt);
            const responseText = result.response.text();
            if (responseText) {
              return NextResponse.json({ reply: responseText.trim() });
            }
          } catch (mErr) {
            console.warn(`Model ${modelName} error in results chat:`, mErr);
          }
        }
      } catch (gemErr) {
        console.warn('Gemini API error in results chat, falling back to smart engine:', gemErr);
      }
    }

    // Advanced Smart Fallback Engine (Runs if API is offline or rate-limited)
    const msgLower = userMessage.toLowerCase();
    let reply = '';

    // 1. Best worker recommendation
    if (msgLower.includes('worker') || msgLower.includes('plumber') || msgLower.includes('electrician') || msgLower.includes('technician') || msgLower.includes('who') || msgLower.includes('best') || msgLower.includes('recommend') || msgLower.includes('hire')) {
      if (Array.isArray(workers) && workers.length > 0) {
        const sorted = [...workers].sort((a, b) => (b.rating || 0) * 10 + (b.reviews || 0) - ((a.rating || 0) * 10 + (a.reviews || 0)));
        const best = sorted[0];
        reply = `Based on verified customer ratings and expertise for **${jobTitle || trade || 'this job'}**, our top recommended specialist is **${best.name}**:
• **Rating**: ⭐ **${best.rating} / 5.0** (${best.reviews} verified reviews)
• **Rate**: **₹${best.hourly_rate} / hr**
• **Experience**: **${best.experience_years} years** in ${trade || 'residential maintenance'}
• **Status**: ${best.is_verified ? '✓ Background Verified Specialist' : 'Active Worker'}

You can book **${best.name}** instantly by clicking the **"Book Worker"** button on their card above!`;
      } else {
        reply = `For **${jobTitle || 'this repair'}**, we recommend hiring a verified **${trade || 'specialist'}** with at least 5+ years of experience and high customer ratings. Browse our available specialist cards above to view rates and book directly!`;
      }
    }
    // 2. Cost estimation
    else if (msgLower.includes('cost') || msgLower.includes('price') || msgLower.includes('rate') || msgLower.includes('charge') || msgLower.includes('how much')) {
      const avgRate = workers?.[0]?.hourly_rate || 400;
      reply = `**Estimated Cost Breakdown for ${jobTitle || 'Repair'}:**
• **Labor Charges**: Approx. **₹${avgRate} - ₹${avgRate + 250}** (1.5 - 2.5 hours work)
• **Materials & Replacement Parts**: Approx. **₹300 - ₹800** (depending on damage extent)
• **Total Estimated Cost**: **₹${avgRate + 300} - ₹${avgRate + 1100}**

*Tip: You can get an exact quote by requesting a booking with any of our verified specialists above.*`;
    }
    // 3. DIY vs Pro
    else if (msgLower.includes('diy') || msgLower.includes('myself') || msgLower.includes('can i fix') || msgLower.includes('own')) {
      if (severity === 'urgent') {
        reply = `⚠️ **Professional Service Strongly Recommended**:
This issue is classified as **Urgent (${severity})**. Attempting a DIY fix without specialized tools risks personal injury, water damage, or electrical hazards. We recommend booking a certified **${trade || 'technician'}** immediately.`;
      } else {
        reply = `**DIY Feasibility Assessment:**
• **Difficulty**: Moderate
• **Tools Needed**: Standard wrench/screwdrivers, sealant/insulation tape, safety goggles.
• **Advice**: If you have basic hand tools and comfortable shutting off main lines, simple sealing is DIY-friendly. However, for permanent durable repair, booking a verified **${trade || 'specialist'}** ensures long-term warranty and safety.`;
      }
    }
    // 4. Emergency / Containment
    else if (msgLower.includes('stop') || msgLower.includes('contain') || msgLower.includes('urgent') || msgLower.includes('safety') || msgLower.includes('emergency')) {
      reply = `**Immediate Emergency Containment Steps:**
1. **Isolate Power/Supply**: ${trade === 'plumber' ? 'Turn off the main water shutoff stopcock immediately.' : trade === 'electrician' || trade === 'ac_tech' ? 'Switch OFF the dedicated MCB breaker switch in your fuse box.' : 'Isolate the affected area and keep children/pets away.'}
2. **Clear the Area**: Wipe standing moisture and remove nearby electrical appliances or furniture.
3. **Book a Specialist**: Request emergency dispatch from our highest-rated verified workers above.`;
    }
    // 5. Tools & Materials
    else if (msgLower.includes('tool') || msgLower.includes('material') || msgLower.includes('part') || msgLower.includes('what do i need')) {
      reply = `**Essential Tools & Materials Required:**
• **Diagnostic Gear**: Inspection flashlight, measurement tape, safety gloves & goggles.
• **Repair Hardware**: Replacement fittings/fixtures matching the **${dimension || 'standard dimension'}**.
• **Sealants & Adhesives**: Industrial Teflon tape, solvent weld compound, or silicone epoxy.
• *Note: All verified FixItNow workers arrive equipped with a full professional toolset.*`;
    }
    // 6. Default general answer
    else {
      reply = `Regarding **${jobTitle || 'this repair'}**:
Our AI assessment flags this as a **${severity || 'moderate'}** issue requiring a **${trade || 'certified technician'}**. You can:
• Ask me for specific **tools, costs, or DIY safety steps**
• Ask me to **recommend the best worker** from our verified list
• Click **"Book Worker"** above for direct on-site repair!`;
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate chat response' }, { status: 500 });
  }
}

