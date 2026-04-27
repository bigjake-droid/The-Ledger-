// --- STATE MANAGEMENT ---
let state = {
    totalDamages: 0,
    pressureScore: 45,
    currentRate: 75,
    entries: [],
    evidence: []
};

// --- INITIALIZATION ---
window.onload = () => {
    loadData();
    updateUI();
};

// --- NAVIGATION ---
function switchView(viewId) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    // Show target view
    document.getElementById(`view-${viewId}`).classList.add('active');
    
    // Update button styling (simple matching logic)
    const btns = document.querySelectorAll('.nav-btn');
    if(viewId === 'dashboard') btns[0].classList.add('active');
    if(viewId === 'damages') btns[1].classList.add('active');
    if(viewId === 'evidence') btns[2].classList.add('active');
}

// --- CORE LOGIC ---
function setRate(val, btnElement) {
    state.currentRate = val;
    document.querySelectorAll('.rate-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
}

function logDamage() {
    const baseAmt = parseFloat(document.getElementById('baseAmount').value);
    const desc = document.getElementById('lossDesc').value;
    
    if(!baseAmt || !desc) {
        alert("Enter an amount and description.");
        return;
    }

    let multiplier = 1.0;
    let tags = [];
    
    if(document.getElementById('parentalTax').checked) {
        multiplier *= 2.5;
        tags.push("Struggle 2.5x");
    }
    if(document.getElementById('indifferenceTax').checked) {
        multiplier *= 10.0;
        tags.push("Indifference 10x");
    }

    // Determine if user entered hours or direct dollars based on context (simplified for now)
    // Assuming baseAmt is units, multiplied by the hourly rate
    const hit = baseAmt * state.currentRate * multiplier;
    
    state.totalDamages += hit;
    state.entries.unshift({ desc: desc, hit: hit, tags: tags, date: new Date().toLocaleDateString() });
    
    // Clear inputs
    document.getElementById('baseAmount').value = '';
    document.getElementById('lossDesc').value = '';
    document.getElementById('parentalTax').checked = false;
    document.getElementById('indifferenceTax').checked = false;

    saveData();
    updateUI();
}

function logEvidence() {
    const desc = document.getElementById('fileDesc').value;
    const fileInput = document.getElementById('fileUpload');
    
    if(!desc) { alert("Enter a description."); return; }
    
    const fileName = fileInput.files[0] ? fileInput.files[0].name : "Physical/External Record";
    
    state.evidence.unshift({ desc: desc, file: fileName, date: new Date().toLocaleDateString() });
    addPressure(5); // Uploading evidence adds pressure
    
    document.getElementById('fileDesc').value = '';
    fileInput.value = '';
    
    saveData();
    updateUI();
}

function addPressure(amount) {
    state.pressureScore += amount;
    if(state.pressureScore > 100) state.pressureScore = 100;
    saveData();
    updateUI();
}

// --- DATA PERSISTENCE & UI ---
function saveData() {
    localStorage.setItem('ledgerState', JSON.stringify(state));
}

function loadData() {
    const saved = localStorage.getItem('ledgerState');
    if(saved) {
        state = JSON.parse(saved);
    } else {
        // Base initial state for your case
        state.totalDamages = 105000;
        state.entries.push({desc: "Initial Jeep Seizure & Lost Income", hit: 105000, tags: [], date: "8/20/2025"});
    }
}

function updateUI() {
    // Update Dashboard Metrics
    document.getElementById('dashTotal').innerText = `$${state.totalDamages.toLocaleString()}`;
    document.getElementById('dashPressure').innerText = `${state.pressureScore}/100`;
    
    // Render Damages List
    const entryDiv = document.getElementById('ledgerEntries');
    entryDiv.innerHTML = '';
    state.entries.forEach(entry => {
        let tagHtml = entry.tags.map(t => `<span class="tag">${t}</span>`).join('');
        entryDiv.innerHTML += `
            <div class="entry-card">
                <div>
                    <strong>${entry.desc}</strong> <span style="color:#888; font-size:0.8rem;">(${entry.date})</span>
                    <br>${tagHtml}
                </div>
                <div style="color:var(--gold); font-weight:bold; font-size:1.1rem;">
                    $${entry.hit.toLocaleString()}
                </div>
            </div>`;
    });

    // Render Evidence List
    const evDiv = document.getElementById('evidenceEntries');
    evDiv.innerHTML = '';
    state.evidence.forEach(ev => {
        evDiv.innerHTML += `
            <div class="entry-card" style="border-left-color: var(--accent);">
                <div>
                    <strong>${ev.desc}</strong>
                    <br><small style="color:#888;">File: ${ev.file}</small>
                </div>
                <div style="font-size:0.8rem;">${ev.date}</div>
            </div>`;
    });
}

function generateReport() {
    alert("PDF generation initialized. Hooking into jsPDF library for Statement of Account export.");
    // jsPDF logic goes here.
}
