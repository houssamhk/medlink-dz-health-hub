import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, age, gender, medicalHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `أنت مساعد طبي ذكي لتقييم الأعراض الأولية. مهمتك:
1. تحليل الأعراض المُدخلة
2. تحديد مستوى الإلحاح
3. اقتراح التخصص الطبي المناسب
4. تقديم نصائح أولية

مستويات الإلحاح:
- normal: حالة عادية، يمكن الانتظار لموعد عادي
- attention: تحتاج متابعة خلال أيام
- urgent: تستوجب زيارة طبيب خلال 24 ساعة
- critical: حالة طوارئ، توجه للمستشفى فوراً

أجب بتنسيق JSON:
{
  "urgency_level": "normal|attention|urgent|critical",
  "recommended_specialty": "اسم التخصص بالعربية",
  "specialty_fr": "اسم التخصص بالفرنسية",
  "assessment": "تقييم مختصر للحالة",
  "advice": ["نصيحة 1", "نصيحة 2"],
  "warning_signs": ["علامة تحذيرية تستوجب الذهاب للطوارئ فوراً"]
}

تنبيه: هذا تقييم أولي فقط وليس تشخيصاً طبياً. دائماً نصح بمراجعة الطبيب.`;

    const userMessage = `
الأعراض: ${symptoms.join('، ')}
${age ? `العمر: ${age} سنة` : ''}
${gender ? `الجنس: ${gender}` : ''}
${medicalHistory ? `التاريخ الطبي: ${medicalHistory}` : ''}

قيّم هذه الأعراض وحدد مستوى الإلحاح والتخصص المناسب.`;

    console.log('Calling Lovable AI for triage...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    console.log('AI Triage Response:', aiResponse);

    let parsedResult;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        parsedResult = {
          urgency_level: "attention",
          recommended_specialty: "طب عام",
          specialty_fr: "Médecine Générale",
          assessment: aiResponse,
          advice: ["يرجى مراجعة طبيب للتقييم"],
          warning_signs: []
        };
      }
    } catch {
      parsedResult = {
        urgency_level: "attention",
        recommended_specialty: "طب عام",
        specialty_fr: "Médecine Générale",
        assessment: aiResponse,
        advice: ["يرجى مراجعة طبيب للتقييم"],
        warning_signs: []
      };
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in ai-triage:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
