import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `أنت مساعد شخصي ذكي باللغة العربية، متخصص في:
- تنظيم المهام والأولويات
- التخطيط اليومي والأسبوعي
- تقسيم المهام الكبيرة لخطوات صغيرة
- متابعة الأهداف الشهرية والأسبوعية واليومية
- تذكير الأدوية ومتابعة الجرعات
- متابعة تقدم الكورسات والتعلم
- تحليل المزاج وتقديم نصائح نفسية بناءً على اليوميات
- تقديم نصائح مالية وتحليل المصروفات
- تقديم نصائح الإنتاجية والصحة

قواعد مهمة:
1. تحدث بالعربية الفصحى السهلة أو اللهجة الخليجية حسب أسلوب المستخدم
2. كن مختصراً وعملياً
3. استخدم الإيموجي بشكل معتدل
4. قدم نصائح قابلة للتنفيذ فوراً
5. شجع المستخدم وحفزه
6. إذا طلب ترتيب اليوم، اقترح جدول واضح بالأوقات مع مراعاة الالتزامات
7. إذا طلب تقسيم مهمة، قسمها لخطوات صغيرة (15-30 دقيقة)
8. امنع التشتت - إذا أراد إضافة مشروع جديد، اسأله: "وش بنوقف مقابله؟"
9. عند الحديث عن الأدوية، ذكّره بالجرعات المتبقية وأهمية الانتظام
10. عند الحديث عن الكورسات، شجعه على إكمال الدروس وقدم خطة دراسة
11. عند الحديث عن المالية، حلل الإنفاق وقدم نصائح توفير
12. استخدم بيانات اليوميات والمزاج لتقديم نصائح مخصصة
13. ضع المهام الصعبة في أوقات الطاقة العالية`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext, generatePlan } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let enhancedSystemPrompt = SYSTEM_PROMPT;
    
    if (userContext) {
      enhancedSystemPrompt += `\n\n--- معلومات المستخدم الحالية ---\n${userContext}`;
    }

    if (generatePlan) {
      enhancedSystemPrompt += `\n\n🎯 المطلوب: إنشاء خطة يوم هجينة تحترم الالتزامات الثابتة وتوزع المهام المرنة حولها.
اقترح جدول:
⏰ [الوقت] - [النشاط/المهمة] - [المدة]
مع مراعاة فترات الراحة وأوقات الطاقة وأوقات الأدوية إن وجدت.`;
    }

    const chatMessages = [
      { role: "system", content: enhancedSystemPrompt },
      ...messages,
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: chatMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "تجاوزت الحد المسموح من الطلبات، حاول مرة أخرى لاحقاً" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إضافة رصيد لحساب Lovable AI" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", status, errorText);
      return new Response(
        JSON.stringify({ error: "حدث خطأ في الاتصال بالذكاء الاصطناعي" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
