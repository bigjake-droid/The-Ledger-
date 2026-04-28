// --- 1. STATE MANAGEMENT ---
let state = {
    caseName: "",
    totalDamages: 0, 
    pressureScore: 0,
    entries: [],
    evidence: [] // Evidence Vault Array
};

// --- 2. INITIALIZATION & WIRING ---
window.onload = () => {
    loadData();
    wireButtons();
    updateUI();
};

function wireButtons() {
    const addBtn = document.getElementById('btnAddHero');
    if(addBtn) addBtn.addEventListener('click', openEntryModal);

    // Evidence Vault Button
    const vaultBtn = document.getElementById('btnVaultUpload');
    if(vaultBtn) vaultBtn.addEventListener('click', openVaultModal);

    const delBtn = document.getElementById('btnDelete');
    if(delBtn) delBtn.addEventListener('click', () => {
        if(confirm("WARNING: This will wipe the current case data. Proceed?")) {
            localStorage.removeItem('stealthLedgerState');
            location.reload();
        }
    });

    const newCaseBtn = document.getElementById('btnNewCaseSide');
    if(newCaseBtn) newCaseBtn.addEventListener('click', () => {
        let name = prompt("Enter new Case Target/Defendant:");
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

function logEvidence(filename, desc) {
    // Generate Exhibit Letter (A, B, C...) based on array length
    const exhibitLetter = String.fromCharCode(65 + state.evidence.length); 
    const exhibitLabel = `Exhibit ${exhibitLetter}`;

    state.evidence.push({
        id: exhibitLabel,
        filename: filename,
        desc: desc,
        date: new Date().toLocaleDateString()
    });

    // Add pressure score automatically when evidence is logged
    state.pressureScore += 2;
    if(state.pressureScore > 100) state.pressureScore = 100;

    saveData();
    updateUI();
}

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
        if(!state.evidence) state.evidence = []; // Catch for old saves
    }
}

function updateUI() {
    const titleEl = document.getElementById('activeCaseTitle');
    if(titleEl) titleEl.innerText = state.caseName || "NO ACTIVE CASE";

    document.getElementById('dashTotal').innerText = `$${state.totalDamages.toLocaleString()}`;
    document.getElementById('dashPressure').innerText = state.pressureScore;
    
    document.getElementById('evidenceCount').innerText = state.evidence.length;
    const presEx = document.getElementById('pressureExhibits');
    if(presEx) presEx.innerText = state.evidence.length;
    
    const eventCount = document.getElementById('eventCount');
    if(eventCount) eventCount.innerText = state.entries.length;

    // Render Evidence Vault
    const listEl = document.getElementById('evidenceList');
    if(listEl) {
        if(state.evidence.length === 0) {
            listEl.innerHTML = `<div class="empty-state-cases" style="margin-top: 20px;"><p>No exhibits logged.<br>Secure your first piece of evidence to build leverage.</p></div>`;
        } else {
            listEl.innerHTML = state.evidence.map(ex => `
                <div class="exhibit-item">
                    <div class="exhibit-info">
                        <h5>${ex.id} - ${ex.desc}</h5>
                        <p>File Link: ${ex.filename}</p>
                    </div>
                    <div class="exhibit-meta">
                        Date Secured<br>${ex.date}
                    </div>
                </div>
            `).join('');
        }
    }
}

// --- 5. TACTICAL MODAL SYSTEMS ---
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
            <input type="text" id="mTarget" class="t-input" placeholder="Name of Defendant or Agency">
            <label class="t-label">INCIDENT DESCRIPTION</label>
            <input type="text" id="mDesc" class="t-input" placeholder="e.g., Lost Wages, Tow Fee">
            <label class="t-label">BASE FINANCIAL HIT ($)</label>
            <input type="number" id="mAmt" class="t-input" placeholder="0.00">
            
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
        const target = document.getElementById('mTarget').value || "Unspecified Target";

        if(!desc || !amt) { alert("Description and Amount required."); return; }

        logImpact(desc, amt, category, target, false, false);
        document.getElementById('entryModal').remove();
    });
}

function openVaultModal() {
    const existing = document.getElementById('vaultModal');
    if(existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'vaultModal';
    overlay.className = 'tactical-modal-overlay';
    
    overlay.innerHTML = `
        <div class="tactical-modal">
            <h3>LOG NEW EXHIBIT</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">
                *For security and browser limits, keep physical files in a local folder. 
                This Vault establishes your Chain of Custody index for court records.
            </p>
            
            <label class="t-label">SELECT LOCAL FILE</label>
            <input type="file" id="vFile" class="t-input" style="padding-top: 10px;">

            <label class="t-label">EXHIBIT DESCRIPTION</label>
            <input type="text" id="vDesc" class="t-input" placeholder="e.g., Motion to Dismiss, Tow Receipt">
            
            <div class="t-actions">
                <button class="btn-navy-outline full-width" onclick="document.getElementById('vaultModal').remove()">CANCEL</button>
                <button class="btn-navy-solid full-width" id="vSave">SECURE EXHIBIT</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('vSave').addEventListener('click', () => {
        const fileInput = document.getElementById('vFile');
        const desc = document.getElementById('vDesc').value;
        
        let filename = "No file selected";
        if(fileInput.files.length > 0) {
            filename = fileInput.files[0].name;
        }

        if(!desc) { alert("An Exhibit Description is required to establish Chain of Custody."); return; }

        logEvidence(filename, desc);
        document.getElementById('vaultModal').remove();
    });
}

// --- 6. PDF EXPORT ENGINE (UPDATED TO INCLUDE EVIDENCE LOG) ---
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
    doc.setDrawColor(11, 25, 44); 
    doc.setLineWidth(0.5);
    doc.setFillColor(255, 255, 255);
    doc.rect(20, boxY, 170, 30, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`TOTAL ASSESSED LIABILITY: $${state.totalDamages.toLocaleString()}`, 25, boxY + 13);
    doc.setFontSize(12);
    doc.text(`Documented Legal Pressure Score: ${state.pressureScore}/100`, 25, boxY + 23);

    // --- DAMAGES MATRIX ---
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
        yPos += 10;
    } else {
        state.entries.forEach(entry => {
            if (yPos > 250) { doc.addPage(); yPos = 20; }
            doc.setFont("helvetica", "bold");
            doc.text(`${entry.date} | Target: ${entry.target || "N/A"}`, 20, yPos);
            doc.text(`$${entry.hit.toLocaleString()}`, 190, yPos, null, null, "right");
            yPos += 6;
            doc.setFont("helvetica", "normal");
            doc.text(`[${entry.category || "Uncategorized"}] - ${entry.desc}`, 20, yPos);
            yPos += 12;
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.1);
            doc.line(20, yPos - 8, 190, yPos - 8);
        });
    }

    // --- EVIDENCE INDEX ---
    yPos += 10;
    if (yPos > 230) { doc.addPage(); yPos = 20; }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("OFFICIAL EXHIBIT INDEX (CHAIN OF CUSTODY)", 20, yPos);
    doc.setLineWidth(1);
    doc.setDrawColor(11, 25, 44);
    doc.line(20, yPos + 3, 190, yPos + 3);

    yPos += 15;
    doc.setFontSize(10);
    
    if (state.evidence.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.text("No exhibits secured on record.", 20, yPos);
    } else {
        state.evidence.forEach(ex => {
            if (yPos > 270) { doc.addPage(); yPos = 20; }
            doc.setFont("helvetica", "bold");
            doc.text(`${ex.id}: ${ex.desc}`, 20, yPos);
            yPos += 5;
            doc.setFont("helvetica", "normal");
            doc.text(`File Reference: ${ex.filename} | Secured: ${ex.date}`, 25, yPos);
            yPos += 10;
        });
    }

    doc.save("Forensic_Damages_Matrix.pdf");
}