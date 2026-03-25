import html2pdf from 'html2pdf.js'

export const generateTriagePDF = (record, t) => {
    const container = document.createElement('div');
    container.style.padding = '40px';
    container.style.fontFamily = 'Helvetica, Arial, sans-serif';
    container.style.color = '#333';
    
    const dateStr = new Date(record.timestamp).toLocaleString();
    let html = `
        <div style="text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0 0 10px 0;">${t('pdf.title')}</h1>
            <p style="margin: 0; color: #7f8c8d;">${t('pdf.subtitle')}</p>
            <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 12px;">${t('pdf.generated')}: ${dateStr}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h2 style="color: #2980b9; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">👤 ${t('pdf.patient_info')}</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;"><strong>${t('triage.label.fullname')}:</strong> ${record.patient?.name || 'Unknown'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;"><strong>${t('triage.label.age')}:</strong> ${record.patient?.age || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px;"><strong>${t('triage.label.gender')}:</strong> ${record.patient?.gender === 'M' ? t('patients.male') : record.patient?.gender === 'F' ? t('patients.female') : t('patients.other')}</td>
                    <td style="padding: 10px;"><strong>${t('triage.label.pincode')}:</strong> ${record.patient?.pincode || 'N/A'}</td>
                </tr>
            </table>
        </div>
    `;

    if (record.analyzeResult) {
        const ar = record.analyzeResult;
        html += `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #2980b9; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">🔬 ${t('pdf.ai_result')}</h2>
                
                <div style="display: flex; gap: 20px;">
                    <div style="flex: 1; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 5px solid ${ar.cough?.risk === 'red' ? '#e74c3c' : '#2ecc71'}">
                        <strong style="font-size: 16px; color: #2c3e50;">🎙️ ${t('triage.model_cough')}</strong><br/><br/>
                        <span style="font-size: 22px; color: ${ar.cough?.risk === 'red' ? '#e74c3c' : '#2ecc71'}; font-weight: bold;">${ar.cough?.label}</span><br/>
                        <span style="font-size: 13px; color: #7f8c8d; display: inline-block; margin-top: 5px;">${t('triage.confidence_val')}: ${ar.cough?.confidence?.toFixed(1)}%</span>
                    </div>
                    <div style="flex: 1; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 5px solid ${ar.eye?.risk === 'red' ? '#e74c3c' : '#2ecc71'}">
                        <strong style="font-size: 16px; color: #2c3e50;">👁️ ${t('triage.model_eye')}</strong><br/><br/>
                        <span style="font-size: 22px; color: ${ar.eye?.risk === 'red' ? '#e74c3c' : '#2ecc71'}; font-weight: bold;">${ar.eye?.label}</span><br/>
                        <span style="font-size: 13px; color: #7f8c8d; display: inline-block; margin-top: 5px;">${t('triage.confidence_val')}: ${ar.eye?.confidence?.toFixed(1)}%</span>
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding: 15px 20px; background: #eef2f5; border-radius: 8px; font-style: italic; color: #34495e; line-height: 1.5;">
                    "${ar.summary}"
                </div>
            </div>
        `;
    }

    if (record.clinicalDecision && record.clinicalDecision.length > 0) {
        html += `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #2980b9; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">📊 ${t('patients.clinical_assessment')}</h2>
        `;
        
        record.clinicalDecision.forEach(item => {
            const uColor = item.urgency === 'emergency' ? '#c0392b' : item.urgency === 'urgent' ? '#d35400' : '#27ae60';
            const uLabel = item.urgency === 'emergency' ? t('triage.label.emergency') : item.urgency === 'urgent' ? t('triage.label.urgent') : t('triage.label.routine');
            
            html += `
                <div style="margin-bottom: 20px; padding: 20px; background: #fff; border: 1px solid #ddd; border-left: 6px solid ${uColor}; border-radius: 8px; page-break-inside: avoid;">
                    <div style="display: inline-block; padding: 4px 12px; background: ${uColor}; color: white; font-size: 12px; font-weight: bold; border-radius: 20px; margin-bottom: 15px; letter-spacing: 0.05em;">
                        ${uLabel}
                    </div>
                    <h3 style="margin: 0 0 12px 0; color: ${uColor}; font-size: 20px;">${item.assessment}</h3>
                    <p style="margin: 0 0 20px 0; font-weight: bold; font-size: 15px; color: #2c3e50;">→ ${t('pdf.recommended_action')}: ${item.action}</p>
            `;
            
            if (item.precautions) {
                html += `
                    <div style="margin-bottom: 12px; padding-left: 10px; border-left: 3px solid #bdc3c7;">
                        <strong style="color: #34495e; font-size: 14px;">🛡️ ${t('clinical.q.precautions') || 'Precautions'}:</strong>
                        <p style="margin: 5px 0 0 0; font-size: 13.5px; line-height: 1.6; color: #555;">${item.precautions}</p>
                    </div>
                `;
            }
            if (item.diet) {
                html += `
                    <div style="margin-bottom: 12px; padding-left: 10px; border-left: 3px solid #bdc3c7;">
                        <strong style="color: #34495e; font-size: 14px;">🥗 ${t('clinical.q.diet') || 'Diet'}:</strong>
                        <p style="margin: 5px 0 0 0; font-size: 13.5px; line-height: 1.6; color: #555;">${item.diet}</p>
                    </div>
                `;
            }
            if (item.suggestions) {
                html += `
                    <div style="padding-left: 10px; border-left: 3px solid #bdc3c7;">
                        <strong style="color: #34495e; font-size: 14px;">💡 ${t('clinical.q.suggestions') || 'Suggestions'}:</strong>
                        <p style="margin: 5px 0 0 0; font-size: 13.5px; line-height: 1.6; color: #555;">${item.suggestions}</p>
                    </div>
                `;
            }
            
            html += `</div>`;
        });
        
        html += `</div>`;
    }

    html += `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #95a5a6; text-align: center; line-height: 1.5; page-break-inside: avoid;">
            <p style="margin: 0 0 5px 0; font-weight: bold; color: #7f8c8d;">⚠ ${t('pdf.non_diagnostic')}</p>
            <p style="margin: 0;">${t('triage.footer_warning')}</p>
            <p style="margin: 5px 0 0 0;">Triage App © ${new Date().getFullYear()}</p>
        </div>
    `;

    container.innerHTML = html;

    const opt = {
        margin:       0.5,
        filename:     `Triage_Report_${record.patient?.name?.replace(/\s+/g, '_') || 'Patient'}_${new Date().getTime()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(container).save();
}
