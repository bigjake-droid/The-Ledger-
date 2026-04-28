// --- 1. STATE MANAGEMENT ---
// Fully generalized for any user. Starts empty.
let state = {
    caseName: "UNASSIGNED CASE FILE",
    totalDamages: 0, 
    pressureScore: 0,
    entries: [],
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
        let name = prompt("Enter new Case Target (e.g., Corporate Entity, Government Agency):");
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
    if(titleEl) titleEl.innerText = state.caseName || "UNASSIGNED CASE FILE";

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
                <option value="Primary Defendant">Primary Defendant</option>
                <option value="Government / Municipal Entity">Government / Municipal Entity</option>
                <option value="Corporate / Third Party">Corporate / Third Party</option>
            </select>

            <label class="t-label">INCIDENT DESCRIPTION</label>
            <input type="text" id="mDesc" class="t-input" placeholder="e.g., Lost Wages, Illegal Seizure, Policy Violation">
            
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
        const ctx = canvas.getContext('2