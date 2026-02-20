/**
 * LabReportGenerator — generate printable HTML lab report.
 */
export class LabReportGenerator {
    constructor(studentData) {
        this.studentData = studentData;
    }

    generate(experimentId, experimentName, params, results, quizScore, aiRemarks) {
        const student = this.studentData.getStudentName();
        const tier = this.studentData.getTier();
        const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
        const time = new Date().toLocaleTimeString('en-IN');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Lab Report — ${experimentName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
    .header { border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { color: #1e3a5f; font-size: 22px; }
    .header .subtitle { color: #64748b; font-size: 13px; }
    .logo { display: flex; justify-content: space-between; align-items: center; }
    .badge { background: #1e3a5f; color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px; }
    .section { margin-bottom: 24px; }
    .section h2 { color: #1e3a5f; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
    th { background: #f1f5f9; color: #374151; font-weight: 600; }
    .grade { display: inline-block; padding: 4px 16px; border-radius: 4px; font-weight: bold; font-size: 18px; }
    .grade-a { background: #dcfce7; color: #166534; }
    .grade-b { background: #fef3c7; color: #92400e; }
    .grade-c { background: #fed7aa; color: #9a3412; }
    .grade-d { background: #fecaca; color: #991b1b; }
    .remarks { background: #f8fafc; border-left: 3px solid #3b82f6; padding: 12px; font-style: italic; color: #475569; font-size: 13px; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; text-align: center; }
    .signature { margin-top: 40px; display: flex; justify-content: space-between; }
    .sig-box { text-align: center; }
    .sig-line { border-top: 1px solid #94a3b8; width: 200px; margin-top: 40px; padding-top: 4px; font-size: 12px; color: #64748b; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div>
        <h1>🔬 NCTE-Tech Virtual Engineering Lab</h1>
        <div class="subtitle">Digital Lab Report — ${experimentName}</div>
      </div>
      <span class="badge">Report ID: ${Date.now().toString(36).toUpperCase()}</span>
    </div>
  </div>

  <div class="section">
    <h2>Student Information</h2>
    <table>
      <tr><th>Name</th><td>${student}</td><th>Date</th><td>${date}</td></tr>
      <tr><th>Performance Tier</th><td>${tier.charAt(0).toUpperCase() + tier.slice(1)}</td><th>Time</th><td>${time}</td></tr>
      <tr><th>Experiment</th><td colspan="3">${experimentName}</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>Input Parameters</h2>
    <table>
      <tr><th>Parameter</th><th>Value</th></tr>
      ${params ? Object.entries(params).map(([k, v]) =>
            `<tr><td>${k}</td><td>${typeof v === 'number' ? v.toFixed(2) : v}</td></tr>`
        ).join('') : '<tr><td colspan="2">No parameters recorded</td></tr>'}
    </table>
  </div>

  <div class="section">
    <h2>Calculated Results</h2>
    <table>
      <tr><th>Result</th><th>Value</th></tr>
      ${results ? Object.entries(results).map(([k, v]) =>
            `<tr><td>${k}</td><td>${typeof v === 'number' ? v.toFixed(3) : v}</td></tr>`
        ).join('') : '<tr><td colspan="2">No results recorded</td></tr>'}
    </table>
  </div>

  ${quizScore !== undefined ? `
  <div class="section">
    <h2>Quiz Performance</h2>
    <p>Score: <strong>${quizScore.score}/${quizScore.total}</strong> (${((quizScore.score / quizScore.total) * 100).toFixed(0)}%)</p>
    <p>Grade: <span class="grade ${quizScore.score / quizScore.total >= 0.8 ? 'grade-a' : quizScore.score / quizScore.total >= 0.6 ? 'grade-b' : quizScore.score / quizScore.total >= 0.4 ? 'grade-c' : 'grade-d'}">${quizScore.score / quizScore.total >= 0.8 ? 'A' : quizScore.score / quizScore.total >= 0.6 ? 'B' : quizScore.score / quizScore.total >= 0.4 ? 'C' : 'D'}</span></p>
  </div>` : ''}

  ${aiRemarks ? `
  <div class="section">
    <h2>AI Assistant Remarks</h2>
    <div class="remarks">${aiRemarks}</div>
  </div>` : ''}

  <div class="section">
    <h2>Performance Summary</h2>
    <p>Total experiments completed: ${this.studentData.getStats().totalExperiments}</p>
    <p>Overall quiz accuracy: ${this.studentData.getStats().avgAccuracy}%</p>
    <p>Current performance tier: ${tier.charAt(0).toUpperCase() + tier.slice(1)}</p>
  </div>

  <div class="signature">
    <div class="sig-box"><div class="sig-line">Student Signature</div></div>
    <div class="sig-box"><div class="sig-line">Lab Instructor</div></div>
  </div>

  <div class="footer">
    NCTE-Tech Virtual Engineering Lab • Auto-Generated Report • ${date}
  </div>
</body>
</html>`;

        return html;
    }

    /**
     * Open report in new tab for print/save.
     */
    openReport(experimentId, experimentName, params, results, quizScore, aiRemarks) {
        const html = this.generate(experimentId, experimentName, params, results, quizScore, aiRemarks);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
}
