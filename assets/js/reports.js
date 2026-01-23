/**
 * منطق تقرير الغياب (نسخة البحث العميق الشامل)
 */
function generateAttendanceReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // محاولة جلب البيانات من عدة مصادر محتملة لضمان العثور عليها
    const allEvents = JSON.parse(localStorage.getItem('student_events') || '[]');
    const allNotes = JSON.parse(localStorage.getItem('student_notes') || '[]'); // احتياط

    console.log(`بدء تقرير الغياب لعدد ${studentIds.length} طالب`);

    let tableHTML = `
        <div style="background:white; padding:20px; border-radius:8px;">
            <div class="text-center mb-4">
                <h3 style="color:#4361ee; margin-bottom:5px;">تقرير متابعة الغياب</h3>
                <small style="color:#666">تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-SA')}</small>
            </div>
            <table class="table table-bordered" style="width:100%; text-align:right; direction:rtl;" border="1">
                <thead style="background:#f8f9fa;">
                    <tr>
                        <th style="padding:10px;">الطالب</th>
                        <th style="padding:10px; width:100px;">أيام الغياب</th>
                        <th style="padding:10px;">التفاصيل (للتشخيص)</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(studentId => {
        const student = allUsers.find(u => u.id == studentId);
        if (!student) return;

        // 1. تجميع كل ما يخص الطالب من أحداث وملاحظات
        // نبحث عن أي سجل يحتوي على معرف الطالب
        let studentRecords = [
            ...allEvents.filter(e => e.studentId == studentId),
            ...allNotes.filter(n => n.studentId == studentId)
        ];

        console.log(`الطالب ${student.name}: تم العثور على ${studentRecords.length} سجل كلي.`);

        // 2. الفلترة "العميقة"
        const absences = studentRecords.filter(record => {
            // تحويل السجل بالكامل إلى نص للبحث بداخله
            const recordString = JSON.stringify(record).toLowerCase();
            
            // الكلمات المفتاحية
            const keywords = ['غائب', 'غياب', 'absent', 'absence', 'unexcused'];
            
            // هل توجد أي كلمة مفتاحية داخل السجل؟
            const isAbsent = keywords.some(key => recordString.includes(key));
            
            if (isAbsent) console.log(` >> تم رصد غياب في السجل:`, record);
            
            return isAbsent;
        });

        const count = absences.length;
        
        // عرض التواريخ، وإذا لم يوجد تاريخ، نعرض "بدون تاريخ"
        const details = absences.map(a => {
            const dateStr = a.date || a.created_at || a.timestamp || 'بدون تاريخ';
            return `<span style="background:#ffebee; color:#c0392b; border:1px solid #ffcdd2; padding:2px 6px; border-radius:4px; margin:2px; font-size:0.85em; display:inline-block;">
                ${dateStr}
            </span>`;
        }).join(' ');

        // عرض رسالة تشخيصية إذا كان العداد 0 ولكن توجد سجلات أخرى
        const diagnosticMsg = count === 0 && studentRecords.length > 0 
            ? `<span style="color:#999; font-size:0.8em;">(يوجد ${studentRecords.length} سجل للطالب، لكن لا تحتوي على كلمة "غائب")</span>`
            : '';

        tableHTML += `
            <tr>
                <td style="padding:10px; font-weight:bold;">${student.name}</td>
                <td style="padding:10px; text-align:center; font-size:1.2em; color:${count>0?'red':'green'}">
                    ${count}
                </td>
                <td style="padding:10px;">
                    ${count > 0 ? details : 'منتظم ' + diagnosticMsg}
                </td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>
        <div class="mt-4 text-left">
            <button onclick="window.print()" class="btn btn-primary no-print">طباعة</button>
        </div>
    </div>`;

    container.innerHTML = tableHTML;
}
