// --- 1. STATE MANAGEMENT ---
let state = {
    totalDamages: 105000, // Base Jeep Seizure Loss
    pressureScore: 45,
    entries: [{desc: "Initial Jeep Seizure & Lost Income", hit: 105000, tags: [], date: "8/20/2025"}],
    evidence: []
};

// --- 2. INITIALIZATION & WIRING ---
window.onload = () => {
    loadData();
    injectModalStyles();
    wireButtons();
    updateUI();
};

function wireButtons() {
    // Wire the Hero Button to open the entry form
    const addBtn = document.querySelector('.btn-gold-glow');
    if(addBtn) addBtn.addEventListener('click', openEntryModal);

    // Wire the Delete Button
    const delBtn = document.getElementById('btnDelete');
    if(delBtn) delBtn.addEventListener('click', () => {
        if(confirm("WARNING: This will wipe the current case data. Proceed?")) {
            localStorage.removeItem('stealthLedgerState');
            location.reload();
        }
    });

    // Wire the Import Button (Upload JSON)
    const importBtn = document.getElementById('btnImport');
    const importFile = document.getElementById('importFile');
    if(importBtn && importFile) {
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const importedState = JSON.parse(event.target.result);
                    state = importedState;
                    saveData();
                    updateUI();
                    alert("Case data successfully imported.");
                } catch(err) {
                    alert("Error: Invalid ledger backup file.");
                }
            };
            reader.readAsText(file);
        });
    }

    // Wire the Pressure Checkboxes
    const checkboxes = document.querySelectorAll('.requests-panel input[type="checkbox"]');
    checkboxes.forEach(box => {
        box.addEventListener('change', (e) => {
            if(e.target.checked) {
                addPressure(5);
            } else {
                state.pressureScore -= 5;
                saveData();
                updateUI();
            }
        });
    });
}

// --- 3. CORE LOGIC ---
function addPressure(amount) {
    state.pressureScore += amount;
    if(state.pressureScore > 100) state.pressureScore = 100;
    saveData();
    updateUI();
}

function logImpact(desc, baseAmt, parental, indifference) {
    let multiplier = 1.0;
    let tags = [];
    
    if(parental) { multiplier *= 2.5; tags.push("Struggle 2.5x"); }
    if(indifference) { multiplier *= 10.0; tags.push("Indifference 10x"); }

    const hit = baseAmt * multiplier;
    state.totalDamages += hit;
    state.entries.unshift({ desc: desc, hit: hit, tags: tags, date: new Date().toLocaleDateString() });
    
    saveData();
    updateUI();
}

// Export JSON Backup
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ledger_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// --- 4. DATA PERSISTENCE & UI ---
function saveData() {
    localStorage.setItem('stealthLedgerState', JSON.stringify(state));
}

function loadData() {
    const saved = localStorage.getItem('stealthLedgerState');
    if(saved) {
        state = JSON.parse(saved);
    }
}

function updateUI() {
    // Update Stats Row
    document.getElementById('dashTotal').innerText = `$${state.totalDamages.toLocaleString()}`;
    document.getElementById('dashPressure').innerText = state.pressureScore;
    document.getElementById('evidenceCount').innerText = state.evidence.length;
    
    // Update Pressure Gauge Visual
    const gauge = document.querySelector('.gauge-circle span');
    if(gauge) gauge.innerText = `${state.pressureScore}%`;
}

// --- 5. TACTICAL MODAL SYSTEM (DOM INJECTION) ---
function injectModalStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .tactical-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(5px); }
        .tactical-modal { background: var(--bg-card); border: 1px solid var(--gold-dim); padding: 30px; border-radius: 8px; width: 90%; max-width: 500px; box-shadow: 0 0 40px rgba(229, 176, 92, 0.15); font-family: 'Inter', sans-serif; }
        .tactical-modal h3 { font-family: 'Bebas Neue', sans-serif; font-size: 2.5rem; color: var(--gold-bright); margin-bottom: 20px; letter-spacing: 1px; }
        .t-input { width: 100%; background: #050505; border: 1px solid var(--border-dim); color: white; padding: 15px; margin-bottom: 15px; border-radius: 4px; font-size: 1rem; }
        .t-input:focus { outline: none; border-color: var(--gold-bright); }
        .t-check-row { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; color: #ccc; cursor: pointer; background: #000; padding: 12px; border: 1px solid var(--border-dim); border-radius: 4px; }
        .t-check-row input { accent-color: var(--gold-bright); width: 18px; height: 18px; }
        .t-actions { display: flex; gap: 10px; margin-top: 25px; }
    `;
    document.head.appendChild(style);
}

function openEntryModal() {
    // Remove existing if any
    const existing = document.getElementById('entryModal');
    if(existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'entryModal';
    overlay.className = 'tactical-modal-overlay';
    
    overlay.innerHTML = `
        <div class="tactical-modal">
            <h3>LOG ECONOMIC IMPACT</h3>
            <input type="text" id="mDesc" class="t-input" placeholder="Description (e.g., Lost Wages, Tow Fee)">
            <input type="number" id="mAmt" class="t-input" placeholder="Base Amount ($)">
            
            <label class="t-check-row">
                <input type="checkbox" id="mParental"> 2.5x Parental / Caregiver Tax
            </label>
            <label class="t-check-row">
                <input type="checkbox" id="mIndiff"> 10x Corporate Indifference Tax
            </label>
            
            <div class="t-actions">
                <button class="btn-gold-outline full-width" onclick="document.getElementById('entryModal').remove()">CANCEL</button>
                <button class="btn-red full-width" id="mSave">RECORD IMPACT</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('mSave').addEventListener('click', () => {
        const desc = document.getElementById('mDesc').value;
        const amt = parseFloat(document.getElementById('mAmt').value);
        const pTax = document.getElementById('mParental').checked;
        const iTax = document.getElementById('mIndiff').checked;

        if(!desc || !amt) { alert("Description and Amount required."); return; }

        logImpact(desc, amt, pTax, iTax);
        document.getElementById('entryModal').remove();
    });
}

// --- 6. PDF EXPORT ENGINE ---
function generateReport() {
    if (!window.jspdf) {
        alert("PDF Engine loading... please try again in a few seconds.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const logo = new Image();
    logo.crossOrigin = "Anonymous"; 
    logo.src = "ledger-512.png"; 

    logo.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = logo.width;
        canvas.height = logo.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(logo, 0, 0);
        const imgData = canvas.toDataURL('image/png');

        doc.addImage(imgData, 'PNG', 90, 15, 30, 30);
        buildPdfContent(doc, 55); 
    };

    logo.onerror = function() { buildPdfContent(doc, 20); };
}

function buildPdfContent(doc, startY) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("OFFICIAL STATEMENT OF ACCOUNT & ECONOMIC IMPACT", 105, startY, null, null, "center");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, startY + 8, null, null, "center");
    doc.text("Prepared via The Ledger (Unbroken Network) | Civil Litigation Tools", 105, startY + 13, null, null, "center");

    let boxY = startY + 25;
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(20, boxY, 170, 30, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`TOTAL CALCULATED DAMAGES: $${state.totalDamages.toLocaleString()}`, 25, boxY + 13);
    doc.setFontSize(12);
    doc.setTextColor(150, 0, 0); 
    doc.text(`Documented Legal Pressure Score: ${state.pressureScore}/100`, 25, boxY + 23);
    doc.setTextColor(0, 0, 0);

    let sectionY = boxY + 45;
    doc.setFont("helvetica", "bold");
    doc.text("ITEMIZED ECONOMIC IMPACT LEDGER", 20, sectionY);
    doc.setLineWidth(0.5);
    doc.line(20, sectionY + 3, 190, sectionY + 3);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    let yPos = sectionY + 15;

    if (state.entries.length === 0) {
        doc.text("No entries recorded yet.", 20, yPos);
    } else {
        state.entries.forEach(entry => {
            if (yPos > 270) { doc.addPage(); yPos = 20; }
            doc.setFont("helvetica", "bold");
            doc.text(`${entry.date} - ${entry.desc}`, 20, yPos);
            doc.text(`$${entry.hit.toLocaleString()}`, 190, yPos, null, null, "right");
            
            if (entry.tags && entry.tags.length > 0) {
                yPos += 6;
                doc.setFont("helvetica", "italic");
                doc.setFontSize(9);
                doc.setTextColor(100, 100, 100);
                doc.text(`Applied Multipliers: ${entry.tags.join(' | ')}`, 25, yPos);
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(11);
            }
            yPos += 12;
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.1);
            doc.line(20, yPos - 8, 190, yPos - 8);
        });
    }

    doc.save("Ledger_Statement_Of_Account.pdf");
}
