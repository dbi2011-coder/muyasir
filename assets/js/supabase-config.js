// ============================================
// 📁 الملف: assets/js/supabase-config.js
// ============================================

// نستخدم شرطاً لضمان عدم تعريف المتغيرات مرتين إذا تم استدعاء الملف بالخطأ مرتين
if (!window.supa) {
    window.SUPABASE_URL = 'https://xcygxsfkwuuxaoqpsoso.supabase.co';
    window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjeWd4c2Zrd3V1eGFvcXBzb3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTI0NzMsImV4cCI6MjA4NzU4ODQ3M30.kvEEey7hxX7F4A8W-x6d4zDfXDkCepj2Z9lmifBJ4x4';

    if (typeof window.supabase === 'undefined') {
        console.error("🚨 خطأ: مكتبة Supabase لم يتم تحميلها!");
    } else {
        // تهيئة المكتبة وتخزينها في window.supa
        window.supa = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        console.log("✅ تم الاتصال بقاعدة بيانات Supabase بنجاح!");
    }
}
