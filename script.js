// --- 1. STATE MANAGEMENT ---
let state = {
    caseName: "JOHNSTOWN / LARIMER",
    totalDamages: 105000, 
    pressureScore: 45,
    entries: [{
        desc: "Initial Jeep Seizure & Lost Income", 
        hit: 105000, 
        category: "Direct Economic Loss",
        target: "Law Enforcement / State",
        tags: [], 
        date: "8/20/2025"
    }],
    evidence: []
};

// --- 2. INITIALIZATION & WIRING ---
window.onload = () => {
    loadData();
    injectModalStyles(); // Handled purely by CSS now, but kept for structure
    wireButtons();
    updateUI();
};

function wireButtons() {
    const enterBtn = document.getElementById('btnEnterApp');
    if(enterBtn) enterBtn.addEventListener('click', () => {
        document.getElementById('splashScreen').classList.add('hidden');
    });

    const addBtn = document.getElementById('btnAddHero');
    if(addBtn) addBtn.addEventListener('click', openEntryModal);

    const delBtn = document.getElementById('btnDelete');
    if(delBtn) delBtn.addEventListener('click', () => {
        if(confirm("WARNING: This will wipe the current case data. Proceed?")) {
            localStorage.removeItem('stealthLedgerState');
            location.reload();
        }
    });

    const newCaseBtn = document.getElementById('btnNewCaseSide');
    if(newCaseBtn) newCaseBtn.addEventListener('click', () => {
        let name = prompt("Enter new Case Target (e.g., Victory Motors):");
        if(name) {
            state = { caseName: name, totalDamages: 0, pressureScore: 0, entries: [], evidence: [] };
            saveData();
            updateUI();
        }
    });

    const importBtn = document.getElementById('btnImport');
    const importFile = document.getElementById('importFile');
    if(importBtn && importFile) {
        importBtn.onclick = () => importFile.click();
        importFile.onchange = (e) => {
            const file = e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const importedState = JSON.parse(event.target.result);
                    if(importedState && importedState.totalDamages !== undefined) {
                        state = importedState;
                        saveData();
                        updateUI();
                        alert("Case data successfully imported.");
                    } else {
                        alert("Error: File does not contain valid Ledger data.");
                    }
                } catch(err) {
                    alert("Error: Invalid ledger backup file.");
                }
            };
            reader.readAsText(file);
            e.target.value = ''; 
        };
    }

    const checkboxes = document.querySelectorAll('.requests-panel input[type="checkbox"]');
    checkboxes.forEach(box => {
        box.addEventListener('change', (e) => {
            if(e.target.checked) {
                state.pressureScore += 5;
            } else {
                state.pressureScore -= 5;
            }
            if(state.pressureScore > 100) state.pressureScore = 100;
            if(state.pressureScore < 0) state.pressureScore = 0;
            saveData();
            updateUI();
        });
    });
}

// --- 3. CORE LOGIC ---
function logImpact(desc, baseAmt, category, target, parental, indifference) {
    let multiplier = 1.0;
    let tags = [];
    
    if(parental) { multiplier *= 2.5; tags.push("Struggle 2.5x"); }
    if(indifference) { multiplier *= 10.0; tags.push("Indifference 10x"); }

    const hit = baseAmt * multiplier;
    state.totalDamages += hit;
    
    state.entries.unshift({ 
        desc: desc, 
        hit: hit, 
        category: category,
        target: target,
        tags: tags, 
        date: new Date().toLocaleDateString() 
    });
    
    saveData();
    updateUI();
}

// Export JSON Backup 
function exportData() {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = "ledger_backup.json";
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
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
    const titleEl = document.getElementById('activeCaseTitle');
    if(titleEl) titleEl.innerText = state.caseName || "NO CASE SELECTED";

    document.getElementById('dashTotal').innerText = `$${state.totalDamages.toLocaleString()}`;
    document.getElementById('dashPressure').innerText = state.pressureScore;
    document.getElementById('evidenceCount').innerText = state.evidence ? state.evidence.length : 0;
    
    const eventCount = document.querySelector('.stat-box:nth-child(1) .number');
    if(eventCount) eventCount.innerText = state.entries.length;
}

// --- 5. TACTICAL MODAL SYSTEM (GRANULAR CIVIL SUIT MATRIX) ---
function injectModalStyles() {
    // Styles moved entirely to style.css for cleaner architecture.
}

function openEntryModal() {
    const existing = document.getElementById('entryModal');
    if(existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'entryModal';
    overlay.className = 'tactical-modal-overlay';
    
    overlay.innerHTML = `
        <div class="tactical-modal">
            <h3>LOG CIVIL DAMAGES</h3>
            
            <label class="t-label">NATURE OF DAMAGES</label>
            <select id="mCategory" class="t-input">
                <option value="Direct Economic Loss">Direct Economic Loss (Base)</option>
                <option value="Consequential Damages">Consequential Damages (Out of Pocket)</option>
                <option value="Punitive / Statutory">Punitive / Statutory Violations</option>
            </select>

            <label class="t-label">TARGET DEFENDANT</label>
            <select id="mTarget" class="t-input">
                <option value="Victory Motors">Victory Motors</option>
                <option value="Law Enforcement / State">Law Enforcement / State</option>
                <option value="Other / Third Party">Other / Third Party</option>
            </select>

            <label class="t-label">INCIDENT DESCRIPTION</label>
            <input type="text" id="mDesc" class="t-input" placeholder="e.g., Lost Wages, Illegal Seizure">
            
            <label class="t-label">BASE FINANCIAL HIT ($)</label>
            <input type="number" id="mAmt" class="t-input" placeholder="0.00">
            
            <label class="t-check-row">
                <input type="checkbox" id="mParental"> Apply 2.5x Parental / Caregiver Tax
            </label>
            <label class="t-check-row">
                <input type="checkbox" id="mIndiff"> Apply 10x Corporate Indifference Multiplier
            </label>
            
            <div class="t-actions">
                <button class="btn-navy-outline full-width" onclick="document.getElementById('entryModal').remove()">CANCEL</button>
                <button class="btn-navy-solid full-width" id="mSave">SUBMIT TO LEDGER</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('mSave').addEventListener('click', () => {
        const desc = document.getElementById('mDesc').value;
        const amt = parseFloat(document.getElementById('mAmt').value);
        const category = document.getElementById('mCategory').value;
        const target = document.getElementById('mTarget').value;
        const pTax = document.getElementById('mParental').checked;
        const iTax = document.getElementById('mIndiff').checked;

        if(!desc || !amt) { alert("Description and Amount required to build the record."); return; }

        logImpact(desc, amt, category, target, pTax, iTax);
        document.getElementById('entryModal').remove();
    });
}

// --- 6. PDF EXPORT ENGINE (FORENSIC AUDIT FORMAT) ---
function generateReport() {
    if (!window.jspdf) {
        alert("PDF Engine loading... please wait.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const logo = new Image();
    logo.crossOrigin = "Anonymous"; 
    logo.src = "1000013825-Picsart-BackgroundRemover.png"; 

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
    doc.text("FORENSIC STATEMENT OF CIVIL DAMAGES", 105, startY, null, null, "center");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, startY + 8, null, null, "center");
    doc.text(`Active Case File: ${state.caseName || "Unassigned"}`, 105, startY + 13, null, null, "center");

    let boxY = startY + 25;
    doc.setDrawColor(11, 25, 44); // Navy border
    doc.setLineWidth(0.5);
    doc.setFillColor(255, 255, 255);
    doc.rect(20, boxY, 170, 30, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`TOTAL ASSESSED LIABILITY: $${state.totalDamages.toLocaleString()}`, 25, boxY + 13);
    doc.setFontSize(12);
    doc.text(`Documented Legal Pressure Score: ${state.pressureScore}/100`, 25, boxY + 23);

    let sectionY = boxY + 45;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("ITEMIZED ECONOMIC IMPACT MATRIX", 20, sectionY);
    doc.setLineWidth(1);
    doc.line(20, sectionY + 3, 190, sectionY + 3);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let yPos = sectionY + 15;

    if (state.entries.length === 0) {
        doc.text("No entries recorded yet.", 20, yPos);
    } else {
        state.entries.forEach(entry => {
            if (yPos > 270) { doc.addPage(); yPos = 20; }
            
            doc.setFont("helvetica", "bold");
            doc.text(`${entry.date} | Target: ${entry.target || "N/A"}`, 20, yPos);
            doc.text(`$${entry.hit.toLocaleString()}`, 190, yPos, null, null, "right");
            
            yPos += 6;
            doc.setFont("helvetica", "normal");
            doc.text(`[${entry.category || "Uncategorized"}] - ${entry.desc}`, 20, yPos);
            
            if (entry.tags && entry.tags.length > 0) {
                yPos += 6;
                doc.setFont("helvetica", "italic");
                doc.setFontSize(9);
                doc.setTextColor(100, 100, 100);
                doc.text(`Applied Multipliers: ${entry.tags.join(' | ')}`, 25, yPos);
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(10);
            }
            yPos += 12;
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.1);
            doc.line(20, yPos - 8, 190, yPos - 8);
        });
    }

    doc.save("Forensic_Damages_Matrix.pdf");
}