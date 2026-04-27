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

// --- PDF EXPORT ENGINE ---
function generateReport() {
    if (!window.jspdf) {
        alert("PDF Engine loading... please try again in a few seconds.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 1. Load the Logo into memory
    const logo = new Image();
    logo.crossOrigin = "Anonymous"; // Prevents canvas security blocks
    
    // MAKE SURE THIS MATCHES YOUR GITHUB FILE NAME EXACTLY
    logo.src = "ledger-512.png"; 

    // 2. If logo loads successfully, stamp it and push text down
    logo.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = logo.width;
        canvas.height = logo.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(logo, 0, 0);
        const imgData = canvas.toDataURL('image/png');

        // Add Logo: Centered (X=90, Y=15, Width=30, Height=30)
        doc.addImage(imgData, 'PNG', 90, 15, 30, 30);
        
        // Start text lower down the page (Y=55)
        buildPdfContent(doc, 55); 
    };

    // 3. Fallback: If logo file is missing, still generate the PDF
    logo.onerror = function() {
        console.warn("Logo file not found. Generating PDF without logo.");
        // Start text at the top (Y=20)
        buildPdfContent(doc, 20); 
    };
}

// --- CORE PDF FORMATTING ---
function buildPdfContent(doc, startY) {
    // 1. Formal Header (Dynamic Y-Position)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("OFFICIAL STATEMENT OF ACCOUNT & ECONOMIC IMPACT", 105, startY, null, null, "center");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, startY + 8, null, null, "center");
    doc.text("Prepared via The Ledger (Unbroken Network) | Civil Litigation Tools", 105, startY + 13, null, null, "center");

    // 2. The Impact Summary Box
    let boxY = startY + 25;
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(20, boxY, 170, 30, "FD"); // Filled box with border

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`TOTAL CALCULATED DAMAGES: $${state.totalDamages.toLocaleString()}`, 25, boxY + 13);
    doc.setFontSize(12);
    doc.setTextColor(150, 0, 0); // Dark red
    doc.text(`Documented Legal Pressure Score: ${state.pressureScore}/100`, 25, boxY + 23);
    doc.setTextColor(0, 0, 0);

    // 3. Itemized Ledger Section
    let sectionY = boxY + 45;
    doc.setFont("helvetica", "bold");
    doc.text("ITEMIZED ECONOMIC IMPACT LEDGER", 20, sectionY);
    doc.setLineWidth(0.5);
    doc.line(20, sectionY + 3, 190, sectionY + 3);

    // 4. Print Entries Loop
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

    // 5. Evidence Vault Summary
    yPos += 10;
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    
    doc.setFont("helvetica", "bold");
    doc.text("EVIDENCE VAULT SUMMARY", 20, yPos);
    doc.line(20, yPos + 3, 190, yPos + 3);
    yPos += 12;
    
    doc.setFont("helvetica", "normal");
    if (state.evidence.length === 0) {
        doc.text("No external evidence files logged.", 20, yPos);
    } else {
        state.evidence.forEach(ev => {
            if (yPos > 270) { doc.addPage(); yPos = 20; }
            doc.text(`[FILE] ${ev.date}: ${ev.desc} (Attachment: ${ev.file})`, 20, yPos);
            yPos += 8;
        });
    }

    // Execute Download
    doc.save("Ledger_Statement_Of_Account.pdf");
}
