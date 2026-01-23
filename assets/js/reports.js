/**
 * منطق حساب وتوليد تقرير الغياب (نسخة محسنة)
 */
function generateAttendanceReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    // جلب سجلات الأحداث
    const allEvents = JSON.parse(localStorage.getItem('student_events') || '[]');

    let tableHTML = `
        <div style="text-align: right; width: 100%; padding: 20px; background: #fff; border-radius: 8px;">
            <div class="report-header" style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #4361ee; margin-bottom: 10px;">تقرير متابعة الغياب</h2>
                <p style="color: #666;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            
            <table class="table table-bordered" style="width:100%; text-align:right; border-collapse:collapse; margin-top:10px;" border="1">
                <thead style="background-color: #f8f9fa;">
                    <tr>
                        <th style="padding:12px; border:1px solid #dee2e6;">اسم الطالب</th>
                        <th style="padding:12px; border:1px solid #dee2e6; width:100px;">عدد الأيام</th>
                        <th style="padding:12px; border:1px solid #dee2e6;">تواريخ الغياب والملاحظات</th>
                    </tr>
                </thead>
                <tbody>
    `;

    studentIds.forEach(studentId => {
        const student = allUsers.find(u => u.id == studentId);
        if (!student) return;

        // --- التحديث هنا: بحث شامل عن الغياب ---
        const absences = allEvents.filter(event => {
            // التحقق من تطابق هوية الطالب (مع مراعاة النصوص والأرقام)
            if (event.studentId != studentId) return false;

            // دمج كل النصوص الموجودة في السجل للبحث داخلها
            // نبحث في العنوان، النوع، الحالة، التفاصيل، والملاحظات
            const fullText = `
                ${event.title || ''} 
                ${event.type || ''} 
                ${event.status || ''} 
                ${event.details || ''} 
                ${event.note || ''}
            `.toLowerCase();

            // كلمات مفتاحية تدل على الغياب
            const keywords = ['غائب', 'غياب', 'absent', 'absence', 'عدم حضور'];

            // هل يوجد أي كلمة مفتاحية داخل النص؟
            return keywords.some(key => fullText.includes(key));
        });

        const count = absences.length;
        
        // تنسيق التواريخ مع عرض سبب الغياب إذا وجد في العنوان
        const detailsHTML = absences.map(e => {
            const label = e.title && e.title !== 'غياب' ? `(${e.title})` : '';
            return `<span style="display:inline-block; background:#ffebee; padding:4px 8px; border-radius:4px; margin:2px; font-size:0.9em; border:1px solid #ffcdd2;">
                ${e.date} ${label}
            </span>`;
        }).join(' ');

        tableHTML += `
            <tr>
                <td style="padding:10px; border:1px solid #dee2e6; font-weight:bold;">${student.name}</td>
                <td style="padding:10px; border:1px solid #dee2e6; text-align:center; font-size:1.2em; font-weight:bold; color:${count > 0 ? '#dc3545' : '#28a745'}">
                    ${count}
                </td>
                <td style="padding:10px; border:1px solid #dee2e6;">
                    ${count > 0 ? detailsHTML : '<span style="color:#999">منتظم - لا يوجد غياب</span>'}
                </td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
            
            <div style="margin-top: 30px; text-align: left;">
                <button onclick="window.print()" class="btn btn-primary no-print" style="padding: 10px 20px; background: #4361ee; color: white; border: none; border-radius: 5px; cursor: pointer;">طباعة التقرير</button>
            </div>
        </div>
    `;

    container.innerHTML = tableHTML;
}
