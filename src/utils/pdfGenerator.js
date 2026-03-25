import { jsPDF } from 'jspdf'

// Map from clinical assessment key → DISEASE_INFO key
const DISEASE_CONTENT = {
    tb: {
        name: 'Active Tuberculosis (TB) Risk',
        precautions: 'Strict airborne isolation is necessary until a doctor confirms the patient is no longer contagious. The patient must wear a high-quality mask (N95) when around others. Rooms should be well-ventilated with natural sunlight if possible.',
        diet: 'A high-calorie, high-protein diet is essential to rebuild immune strength. Include eggs, lentils (dal), lean meats, nuts, and dairy. Strict avoidance of alcohol is mandatory as TB medications strain the liver.',
        suggestions: 'The most critical factor is unbroken medication adherence (DOTS therapy). Missing doses leads to drug-resistant TB. Routine liver function tests should be scheduled.'
    },
    pneumonia: {
        name: 'Pneumonia Risk',
        precautions: 'Strict bed rest is required. Avoid all exposure to smoke, dust, and cold drafts. Practice frequent hand hygiene and safe cough etiquette to protect household members.',
        diet: 'Emphasize warm, hydrating fluids (clear broths, herbal teas, warm water) to help loosen mucus. Vitamin C-rich fruits (oranges, kiwi) aid recovery. Example: warm chicken broth, ginger tea, oatmeal, oranges.',
        suggestions: 'Monitor oxygen saturation (SpO2) at home using a pulse oximeter. A cool-mist humidifier in the room can ease breathing. Once acute phase passes, deep breathing exercises help restore lung capacity.'
    },
    flu: {
        name: 'Common Flu / Viral Respiratory Infection',
        precautions: 'Isolate at home to prevent community spread. Rest significantly to allow the immune system to fight the virus.',
        diet: 'High fluid intake is the priority to prevent dehydration from fever. Consume electrolyte solutions, soups, and a light balanced diet. Example: coconut water, clear soups, khichdi, bananas.',
        suggestions: 'Manage fever with over-the-counter antipyretics (paracetamol) as directed. Monitor for secondary bacterial infections (sudden return of high fever after initial improvement).'
    },
    mild_cough: {
        name: 'Mild / Unspecified Cough',
        precautions: 'Avoid known respiratory irritants like cold air, strong perfumes, active/passive smoking, and dust.',
        diet: 'Warm water with honey is a proven throat soother. Avoid extremely cold beverages, ice cream, and deep-fried foods. Example: warm water with honey and lemon, ginger tea, turmeric milk.',
        suggestions: 'Track the duration of the cough. If it persists beyond 10-14 days, changes from dry to productive (colored mucus), or is accompanied by fever, escalate for clinical review.'
    },
    acute_blood: {
        name: 'Acute Blood Loss Anemia',
        precautions: 'MEDICAL EMERGENCY. Patient must remain lying flat with elevated legs to maintain blood flow to the brain. Avoid all physical exertion.',
        diet: 'Nothing by mouth (NPO). Do not eat or drink until assessed in the ER. May require emergency surgery or rapid medical intervention.',
        suggestions: 'Immediately call emergency services or proceed to the nearest emergency room. Bypass all standard lifestyle advice.'
    },
    severe_anemia: {
        name: 'Severe Symptomatic Anemia',
        precautions: 'Institute fall precautions. Dizziness, vertigo, and weakness are highly likely. Patient must avoid driving, operating machinery, or strenuous physical activity until cleared by a doctor.',
        diet: 'Aggressively focus on iron-rich foods (spinach, red meat, lentils, beans) paired with Vitamin C sources (citrus juice, bell peppers) to maximize iron absorption. Example: red meat, chicken liver, spinach with tomatoes, fortified cereals.',
        suggestions: 'Avoid tea or coffee within an hour of meals (tannins inhibit iron absorption). Patient requires prompt clinical evaluation for potential IV iron infusions or prescription supplements.'
    },
    mild_anemia: {
        name: 'Mild / Asymptomatic Anemia',
        precautions: 'Monitor energy levels closely. Normal daily activities can continue, but pace yourself during heavy exercise or endurance sports.',
        diet: 'Incorporate steady intake of iron, Vitamin B12, and folate. Good sources: fortified cereals, leafy greens, eggs, and legumes. Example: lentils, chickpeas, dark leafy greens, eggs.',
        suggestions: 'Follow up with a Complete Blood Count (CBC) in 3 to 6 months to confirm dietary changes or supplements are effectively raising hemoglobin levels.'
    }
}

// Word-wrap helper for jsPDF
function addWrappedText(doc, text, x, y, maxWidth, lineHeight) {
    const lines = doc.splitTextToSize(String(text || ''), maxWidth)
    lines.forEach(line => {
        doc.text(line, x, y)
        y += lineHeight
    })
    return y
}

export const generateTriagePDF = (record, t) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentW = pageW - margin * 2
    let y = 20

    const checkPage = (neededSpace = 20) => {
        if (y + neededSpace > 280) {
            doc.addPage()
            y = 20
        }
    }

    // ── HEADER ──────────────────────────────────────────────────────────
    // Teal gradient bar
    doc.setFillColor(32, 201, 151)
    doc.rect(0, 0, pageW, 28, 'F')
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('Triage-Zero', margin, 13)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Clinical Patient Report  |  AI-Assisted Triage Tool', margin, 21)

    // Date on right side
    const dateStr = new Date(record.timestamp).toLocaleString()
    doc.setFontSize(8)
    doc.text(dateStr, pageW - margin, 21, { align: 'right' })
    y = 38

    // ── PATIENT INFO ─────────────────────────────────────────────────────
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(44, 62, 80)
    doc.text('Patient Information', margin, y)

    // Underline
    doc.setDrawColor(32, 201, 151)
    doc.setLineWidth(0.5)
    doc.line(margin, y + 1, pageW - margin, y + 1)
    y += 8

    const patient = record.patient || {}
    const genderStr = patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80, 80, 80)
    doc.text('Name:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(patient.name || 'N/A', margin + 22, y)

    doc.setFont('helvetica', 'bold')
    doc.text('Age:', 120, y)
    doc.setFont('helvetica', 'normal')
    doc.text(String(patient.age || 'N/A'), 133, y)
    y += 7

    doc.setFont('helvetica', 'bold')
    doc.text('Gender:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(genderStr, margin + 22, y)

    doc.setFont('helvetica', 'bold')
    doc.text('Pincode:', 120, y)
    doc.setFont('helvetica', 'normal')
    doc.text(String(patient.pincode || 'N/A'), 143, y)
    y += 7

    if (patient.latitude) {
        doc.setFont('helvetica', 'bold')
        doc.text('Location:', margin, y)
        doc.setFont('helvetica', 'normal')
        doc.text(`${patient.latitude.toFixed(4)}, ${patient.longitude.toFixed(4)}`, margin + 22, y)
        y += 7
    }
    y += 6

    // ── AI INFERENCE RESULT ───────────────────────────────────────────────
    checkPage(40)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(44, 62, 80)
    doc.text('AI Inference Result', margin, y)
    doc.line(margin, y + 1, pageW - margin, y + 1)
    y += 8

    if (record.analyzeResult) {
        const ar = record.analyzeResult
        const coughColor = ar.cough?.risk === 'red' ? [231, 76, 60] : [39, 174, 96]
        const eyeColor = ar.eye?.risk === 'red' ? [231, 76, 60] : [39, 174, 96]

        // Cough model box
        doc.setFillColor(248, 249, 250)
        doc.roundedRect(margin, y, 80, 22, 2, 2, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(80, 80, 80)
        doc.text('COUGH ANALYSIS', margin + 4, y + 6)
        doc.setFontSize(13)
        doc.setTextColor(...coughColor)
        doc.setFont('helvetica', 'bold')
        doc.text(ar.cough?.label || 'N/A', margin + 4, y + 14)
        doc.setFontSize(9)
        doc.setTextColor(120, 120, 120)
        doc.setFont('helvetica', 'normal')
        doc.text(`Confidence: ${ar.cough?.confidence?.toFixed(1) || 0}%`, margin + 4, y + 20)

        // Eye model box
        doc.setFillColor(248, 249, 250)
        doc.roundedRect(margin + 90, y, 80, 22, 2, 2, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(80, 80, 80)
        doc.text('EYE SCAN (ANEMIA)', margin + 94, y + 6)
        doc.setFontSize(13)
        doc.setTextColor(...eyeColor)
        doc.setFont('helvetica', 'bold')
        doc.text(ar.eye?.label || 'N/A', margin + 94, y + 14)
        doc.setFontSize(9)
        doc.setTextColor(120, 120, 120)
        doc.setFont('helvetica', 'normal')
        doc.text(`Confidence: ${ar.eye?.confidence?.toFixed(1) || 0}%`, margin + 94, y + 20)
        y += 28

        // Summary
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(90, 90, 90)
        const summaryLines = doc.splitTextToSize(`"${ar.summary}"`, contentW)
        doc.text(summaryLines, margin, y)
        y += summaryLines.length * 5 + 6
    } else {
        // Cough-only mode
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        const rColor = record.riskLevel === 'red' ? [231, 76, 60] : record.riskLevel === 'yellow' ? [230, 126, 34] : [39, 174, 96]
        doc.setTextColor(...rColor)
        doc.text(`Overall Risk Level: ${(record.riskLevel || 'green').toUpperCase()}  |  Confidence: ${record.confidence || 0}%`, margin, y)
        y += 10
    }

    // ── CLINICAL ASSESSMENT ────────────────────────────────────────────────
    if (record.clinicalDecision && record.clinicalDecision.length > 0) {
        checkPage(20)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(44, 62, 80)
        doc.text('Clinical Assessment', margin, y)
        doc.line(margin, y + 1, pageW - margin, y + 1)
        y += 10

        record.clinicalDecision.forEach((item) => {
            checkPage(60)

            const urgencyColor = item.urgency === 'emergency'
                ? [192, 57, 43]
                : item.urgency === 'urgent'
                    ? [211, 84, 0]
                    : [39, 174, 96]
            const urgencyLabel = item.urgency === 'emergency' ? 'EMERGENCY' : item.urgency === 'urgent' ? 'URGENT' : 'ROUTINE'

            // Disease name header bar
            doc.setFillColor(...urgencyColor)
            doc.rect(margin, y, contentW, 10, 'F')
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(255, 255, 255)
            doc.text(`[${urgencyLabel}]  ${item.assessment}`, margin + 4, y + 6.5)
            y += 16

            // Recommended Action
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(44, 62, 80)
            doc.text('Recommended Action:', margin, y)
            y += 6
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.setTextColor(60, 60, 60)
            y = addWrappedText(doc, `>> ${item.action}`, margin + 4, y, contentW - 4, 5)
            y += 5

            // Look up rich disease content by key
            const richInfo = DISEASE_CONTENT[item.key] || {}
            const precautions = richInfo.precautions || item.precautions || ''
            const diet = richInfo.diet || item.diet || ''
            const suggestions = richInfo.suggestions || item.suggestions || ''

            if (precautions) {
                checkPage(25)
                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(44, 62, 80)
                doc.text('Precautions:', margin, y)
                y += 6
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(60, 60, 60)
                doc.setFontSize(9)
                y = addWrappedText(doc, precautions, margin + 4, y, contentW - 4, 5)
                y += 5
            }

            if (diet) {
                checkPage(25)
                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(44, 62, 80)
                doc.text('Diet Recommendations:', margin, y)
                y += 6
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(60, 60, 60)
                doc.setFontSize(9)
                y = addWrappedText(doc, diet, margin + 4, y, contentW - 4, 5)
                y += 5
            }

            if (suggestions) {
                checkPage(25)
                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(44, 62, 80)
                doc.text('Clinical Suggestions:', margin, y)
                y += 6
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(60, 60, 60)
                doc.setFontSize(9)
                y = addWrappedText(doc, suggestions, margin + 4, y, contentW - 4, 5)
                y += 5
            }

            // Divider between diseases
            doc.setDrawColor(220, 220, 220)
            doc.setLineWidth(0.3)
            doc.line(margin, y, pageW - margin, y)
            y += 8
        })
    }

    // ── FOOTER ────────────────────────────────────────────────────────────
    checkPage(20)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(140, 140, 140)
    const footerLines = doc.splitTextToSize(
        'DISCLAIMER: This report is generated by an AI-assisted triage tool and is intended for supportive screening only. It is NOT a substitute for professional medical diagnosis or clinical judgment. Always consult a qualified healthcare provider before making any medical decisions.',
        contentW
    )
    doc.text(footerLines, margin, y)
    y += footerLines.length * 4 + 3
    doc.text(`Triage-Zero © ${new Date().getFullYear()}  |  Generated: ${new Date().toLocaleString()}`, margin, y)

    // Save
    const filename = `Triage_Report_${(patient.name || 'Patient').replace(/\s+/g, '_')}_${Date.now()}.pdf`
    doc.save(filename)
}
