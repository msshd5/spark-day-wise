import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `أنت مساعد شخصي ذكي باللغة العربية، متخصص في:
- تنظيم المهام والأولويات
- التخطيط اليومي والأسبوعي
- تقسيم المهام الكبيرة لخطوات صغيرة
- تقديم نصائح الإنتاجية
- المساعدة في التركيز وإدارة الوقت

قواعد مهمة:
1. دائماً تحدث بالعربية الفصحى السهلة أو باللهجة الخليجية حسب أسلوب المستخدم
2. كن مختصراً وعملياً
3. استخدم الإيموجي بشكل معتدل لتوضيح النقاط
4. قدم نصائح قابلة للتنفيذ فوراً
5. شجع المستخدم وحفزه
6. إذا طلب ترتيب اليوم، اقترح جدول واضح بالأوقات مع مراعاة الالتزامات الثابتة
7. إذا طلب تقسيم مهمة، قسمها لخطوات صغيرة (15-30 دقيقة لكل خطوة)
8. امنع التشتت - إذا أراد إضافة مشروع جديد، اسأله: "وش بنوقف مقابله؟"
9. عند إنشاء خطة يوم، راعِ أوقات الدوام والالتزامات الثابتة
10. ضع المهام الصعبة في أوقات الطاقة العالية (عادة الصباح)`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext, generatePlan } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // إضافة سياق المستخدم للـ System Prompt
    let enhancedSystemPrompt = SYSTEM_PROMPT;
    
    if (userContext) {
      enhancedSystemPrompt += `\n\n--- معلومات المستخدم الحالية ---\n${userContext}`;
    }

    // إذا كان المطلوب إنشاء خطة يوم
    if (generatePlan) {
      enhancedSystemPrompt += `\n\n🎯 المطلوب الآن: إنشاء خطة يوم هجينة تحترم الالتزامات الثابتة وتوزع المهام المرنة حولها.
اقترح جدول بالشكل التالي:
⏰ [الوقت] - [النشاط/المهمة] - [المدة]
مع مراعاة:
- فترات الراحة
- أوقات الطاقة العالية/المنخفضة
- عدم التعارض مع الالتزامات الثابتة`;
    }

    // بناء رسائل المحادثة
    const chatMessages = [
      { role: "system", content: enhancedSystemPrompt },
      ...messages,
    ];

    // استدعاء AI Gateway
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

    // إرجاع Stream مباشرة
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
