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
    const { labResults, imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `أنت مساعد طبي ذكي متخصص في تحليل نتائج التحاليل المخبرية. مهمتك:
1. تحليل نتائج التحاليل المقدمة
2. مقارنة القيم مع النطاقات الطبيعية
3. تحديد مستوى الإلحاح (normal, attention, urgent, critical)
4. تقديم توصيات واضحة وبسيطة بالعربية

مستويات الإلحاح:
- normal: جميع القيم طبيعية
- attention: بعض القيم تحتاج متابعة
- urgent: قيم غير طبيعية تستوجب زيارة الطبيب قريباً
- critical: حالة طوارئ تستوجب تدخل فوري

أجب بتنسيق JSON التالي:
{
  "urgency_level": "normal|attention|urgent|critical",
  "analysis": "تحليل مفصل للنتائج",
  "recommendations": ["توصية 1", "توصية 2"],
  "abnormal_values": [{"name": "اسم التحليل", "value": "القيمة", "normal_range": "النطاق الطبيعي", "status": "high|low"}]
}`;

    let messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "حلل نتائج التحاليل في هذه الصورة وحدد مستوى الإلحاح:" },
          { type: "image_url", image_url: { url: imageBase64 } }
        ]
      });
    } else if (labResults) {
      messages.push({
        role: "user",
        content: `حلل نتائج التحاليل التالية وحدد مستوى الإلحاح:\n${labResults}`
      });
    } else {
      throw new Error('No lab results provided');
    }

    console.log('Calling Lovable AI for lab analysis...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
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
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار في استخدام الخدمة" }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    console.log('AI Response:', aiResponse);

    // Try to parse JSON from response
    let parsedResult;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        parsedResult = {
          urgency_level: "attention",
          analysis: aiResponse,
          recommendations: ["يرجى مراجعة طبيب للتقييم"],
          abnormal_values: []
        };
      }
    } catch {
      parsedResult = {
        urgency_level: "attention",
        analysis: aiResponse,
        recommendations: ["يرجى مراجعة طبيب للتقييم"],
        abnormal_values: []
      };
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in analyze-lab-results:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
