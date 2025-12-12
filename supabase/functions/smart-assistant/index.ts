import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // جلب بيانات المستخدم والأطباء المتاحين
    let userProfile = null;
    let availableDoctors: any[] = [];
    let pharmaciesOnDuty: any[] = [];
    let specialties: any[] = [];

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      userProfile = profile;
    }

    // جلب الأطباء المتاحين مع سعتهم
    const today = new Date().toISOString().split('T')[0];
    const { data: doctors } = await supabase
      .from('doctors')
      .select(`
        *,
        specialties(name_ar, name_fr),
        doctor_capacity(max_appointments, current_appointments, date)
      `)
      .eq('is_available', true)
      .eq('is_verified', true);

    if (doctors) {
      availableDoctors = doctors.filter((d: any) => {
        const todayCapacity = d.doctor_capacity?.find((c: any) => c.date === today);
        if (!todayCapacity) return true;
        return todayCapacity.current_appointments < todayCapacity.max_appointments;
      });
    }

    // جلب الصيدليات المناوبة
    const { data: pharmacies } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('is_on_duty', true);
    pharmaciesOnDuty = pharmacies || [];

    // جلب التخصصات
    const { data: specs } = await supabase
      .from('specialties')
      .select('*');
    specialties = specs || [];

    const systemPrompt = `أنت مساعد ذكي لمنصة MEDLINK DZ الطبية الجزائرية. 

🏢 معلومات المنصة:
- صاحب المنصة ومؤسسها: حسيني محمد حسام
- عند السؤال عن المالك أو صاحب الفكرة أو المؤسس، أجب: "منصة MEDLINK DZ من تأسيس وتطوير حسيني محمد حسام"

🎯 المهام الرئيسية:
1. إرشاد المستخدمين في استخدام المنصة
2. مساعدتهم في حجز المواعيد مع الأطباء المتاحين
3. توجيههم لأقرب صيدلية مناوبة
4. شرح كيفية رفع التحاليل للمراجعة من الطبيب
5. الإجابة على الأسئلة العامة عن الصحة (توعية فقط، ليس تشخيص)

⚠️ تنبيه مهم:
- لا تقدم تشخيصات طبية أبداً
- وجّه المستخدم للطبيب دائماً للتشخيص
- التحاليل يقيّمها الأطباء وليس الذكاء الاصطناعي

📊 البيانات المتاحة:
- الأطباء المتاحون للحجز اليوم: ${availableDoctors.length} طبيب
- الصيدليات المناوبة: ${pharmaciesOnDuty.length} صيدلية
- التخصصات المتاحة: ${specialties.map((s: any) => s.name_ar).join('، ')}

${userProfile ? `
👤 معلومات المستخدم:
- الاسم: ${userProfile.full_name || 'غير محدد'}
- الولاية: ${userProfile.wilaya || 'غير محددة'}
` : ''}

${context === 'booking' ? `
🗓️ للحجز، اسأل المستخدم عن:
1. التخصص المطلوب
2. الولاية المفضلة
3. التاريخ المناسب
ثم اقترح الأطباء المتاحين.
` : ''}

أجب بالعربية الجزائرية/الفصحى المبسطة. كن ودوداً ومساعداً.

إذا طلب المستخدم حجز موعد، أجب بتنسيق JSON:
{
  "action": "booking_request",
  "specialty": "التخصص المطلوب",
  "wilaya": "الولاية",
  "message": "رسالة للمستخدم"
}

إذا كان سؤال عادي، أجب بتنسيق JSON:
{
  "action": "response",
  "message": "الرد"
}`;

    console.log('Smart Assistant - Processing message:', message);

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
          { role: "user", content: message }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          action: "error",
          message: "عذراً، المساعد مشغول حالياً. حاول مرة أخرى بعد قليل." 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    console.log('Smart Assistant Response:', aiResponse);

    let parsedResult;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        parsedResult = {
          action: "response",
          message: aiResponse
        };
      }
    } catch {
      parsedResult = {
        action: "response",
        message: aiResponse
      };
    }

    // إضافة معلومات إضافية حسب الإجراء
    if (parsedResult.action === 'booking_request') {
      // جلب الأطباء المناسبين
      const matchingDoctors = availableDoctors.filter((d: any) => {
        const matchSpecialty = !parsedResult.specialty || 
          d.specialties?.name_ar?.includes(parsedResult.specialty);
        const matchWilaya = !parsedResult.wilaya || 
          d.wilaya === parsedResult.wilaya;
        return matchSpecialty && matchWilaya;
      }).slice(0, 5);

      parsedResult.suggested_doctors = matchingDoctors.map((d: any) => ({
        id: d.id,
        name: d.user_id, // نحتاج جلب اسم الطبيب من profiles
        specialty: d.specialties?.name_ar,
        wilaya: d.wilaya,
        clinic: d.clinic_name,
        price: d.consultation_price,
        available_slots: d.doctor_capacity?.[0]?.max_appointments - 
          (d.doctor_capacity?.[0]?.current_appointments || 0) || 20
      }));
    }

    // إضافة الصيدليات المناوبة إذا طلبها
    if (message.includes('صيدلية') || message.includes('دواء')) {
      parsedResult.pharmacies_on_duty = pharmaciesOnDuty.slice(0, 5).map((p: any) => ({
        name: p.name,
        address: p.address,
        wilaya: p.wilaya,
        phone: p.phone
      }));
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in smart-assistant:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      action: "error",
      message: "عذراً، حدث خطأ. حاول مرة أخرى." 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
