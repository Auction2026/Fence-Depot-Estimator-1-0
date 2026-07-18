/* ============================================================
   FENCE DEPOT ESTIMATOR — app.js
   All application logic
   ============================================================ */

'use strict';

// ============================================================
// GLOBAL STATE
// ============================================================
const APP = {
    jobNumber:   null,
    jobStatus:   'estimate',
    isLocked:    false,
    dateCreated: null,
    materialSubtotal: 0
};

// ============================================================
// HELPERS
// ============================================================

function $(id)           { return document.getElementById(id); }
function gv(id)          { const e = $(id); return e ? e.value.trim() : ''; }
function sv(id, val)     { const e = $(id); if (e) e.value = val; }
function show(id)        { const e = $(id); if (e) e.classList.remove('hidden'); }
function hide(id)        { const e = $(id); if (e) e.classList.add('hidden'); }
function isHidden(id)    { const e = $(id); return e ? e.classList.contains('hidden') : true; }

function today() {
    return new Date().toISOString().split('T')[0];
}

function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-CA', { year:'numeric', month:'long', day:'numeric' });
}

function fmtMoney(n) {
    n = parseFloat(n) || 0;
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtFtIn(totalFeet) {
    const ft  = Math.floor(totalFeet);
    const in_ = Math.round((totalFeet - ft) * 12);
    return in_ === 0 ? `${ft}'` : `${ft}'${in_}"`;
}

function stampDate(stampId) {
    const el = $(stampId);
    if (!el) return;
    const now = new Date();
    el.textContent = 'Date: ' + now.toLocaleDateString('en-CA', {
        year:'numeric', month:'long', day:'numeric'
    }) + '  ' + now.toLocaleTimeString('en-CA', { hour:'2-digit', minute:'2-digit' });
}

function checkedVal(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
}

// ============================================================
// JOB NUMBERING  (persisted in localStorage)
// ============================================================

function getYear2() {
    return new Date().getFullYear().toString().slice(-2);
}

function nextJobNumber(type) {
    const yr  = getYear2();
    const key = `fd_ctr_${yr}`;
    const stored = parseInt(localStorage.getItem(key), 10);
    let ctr = (isNaN(stored) ? 0 : stored) + 1;
    try {
        localStorage.setItem(key, String(ctr));
    } catch (e) {
        console.warn('Fence Depot: Could not save job counter to localStorage.', e.message);
    }
    const suf = type === 'contract' ? 'C' : 'E';
    return `${yr}-${String(ctr).padStart(4, '0')}${suf}`;
}

function toContractNum(estimateNum) {
    // Replace trailing E with C, preserve everything else
    return estimateNum ? estimateNum.replace(/E$/, 'C') : estimateNum;
}

// ============================================================
// HEADER UPDATE
// ============================================================

function updateHeader() {
    const numEl   = $('hdrJobNum');
    const badge   = $('hdrBadge');
    const dateEl  = $('hdrJobDate');

    if (numEl)  numEl.textContent  = APP.jobNumber ? `Job #: ${APP.jobNumber}` : 'Job #: —';
    if (dateEl) dateEl.textContent = APP.dateCreated ? fmtDate(APP.dateCreated) : '';

    if (badge) {
        if (APP.jobStatus === 'contract') {
            badge.textContent  = 'Contract';
            badge.className    = 'badge badge-contract';
        } else {
            badge.textContent  = 'Estimate';
            badge.className    = 'badge badge-estimate';
        }
    }
}

// ============================================================
// TAB NAVIGATION
// ============================================================

function initTabs() {
    const btns     = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.tab-section');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;

            btns.forEach(b     => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            const sec = $(`tab-${tab}`);
            if (sec) sec.classList.add('active');

            stampDate(`ds-${tab}`);

            // Tab-specific refresh actions
            if (tab === 'estimate')     generateEstimate();
            if (tab === 'gatedrawings') refreshGateDrawings();
            if (tab === 'contract')     refreshContractSummary();
            if (tab === 'installpkg')   refreshInstallPackage();
        });
    });

    stampDate('ds-customer');
}

// ============================================================
// CUSTOMER TAB
// ============================================================

function toggleCustType() {
    const type = checkedVal('custType');
    const biz  = $('bizSection');
    const ttl  = $('custDetailTitle');

    if (type === 'business') {
        biz.classList.remove('hidden');
        if (ttl) ttl.textContent = 'Primary Contact Details';
    } else {
        biz.classList.add('hidden');
        if (ttl) ttl.textContent = 'Customer Details';
    }
}

function createNewEstimate() {
    const num = nextJobNumber('estimate');
    APP.jobNumber   = num;
    APP.jobStatus   = 'estimate';
    APP.isLocked    = false;
    APP.dateCreated = today();

    sv('jobNumber',    num);
    sv('estimateDate', today());
    sv('jobStatus',    'estimate');

    setLockState(false);
    updateHeader();
    alert(`New Estimate Created!\n\nJob Number: ${num}`);
}

function onStatusChange() {
    const status = gv('jobStatus');
    if (status === 'contract' && APP.jobStatus !== 'contract') {
        convertToContract();
    }
}

function convertToContract() {
    if (!APP.jobNumber) {
        alert('Please create a new estimate first by clicking "New Estimate".');
        sv('jobStatus', 'estimate');
        return;
    }
    if (APP.jobStatus === 'contract') {
        alert('This job is already a contract.');
        return;
    }

    const ok = confirm(
        `Convert Job ${APP.jobNumber} to a Contract?\n\n` +
        `⚠️ All critical fields will be LOCKED to prevent accidental changes.\n\n` +
        `The job number will change from ${APP.jobNumber} to ${toContractNum(APP.jobNumber)}.\n\n` +
        `Click OK to confirm.`
    );

    if (!ok) {
        sv('jobStatus', 'estimate');
        return;
    }

    const contractNum  = toContractNum(APP.jobNumber);
    APP.jobNumber      = contractNum;
    APP.jobStatus      = 'contract';
    APP.isLocked       = true;

    sv('jobNumber', contractNum);
    sv('jobStatus', 'contract');

    setLockState(true);
    updateHeader();
    refreshContractSummary();
    alert(`✅ Converted to Contract!\n\nContract Number: ${contractNum}\nAll fields are now locked.`);
}

function setLockState(locked) {
    APP.isLocked = locked;

    const banner = $('lockBanner');
    if (banner) {
        banner.classList.toggle('visible', locked);
    }

    // Lock / unlock all .estimable fields
    document.querySelectorAll('.estimable').forEach(el => {
        if (locked) {
            el.classList.add('locked-field');
            el.setAttribute('disabled', 'disabled');
        } else {
            el.classList.remove('locked-field');
            el.removeAttribute('disabled');
        }
    });

    // Lock footage and post inputs
    document.querySelectorAll('.footage-input').forEach(el => {
        el.disabled = locked;
        el.classList.toggle('locked-field', locked);
    });
    ['postEnd','postCorner','postThreeWay','postGate','postBlank','postSetFittings',
     'singleGateQty','doubleGateQty'].forEach(id => {
        const el = $(id);
        if (el) {
            el.disabled = locked;
            el.classList.toggle('locked-field', locked);
        }
    });

    // Show/hide convert button
    const btn = $('convertBtn');
    if (btn) btn.style.display = locked ? 'none' : '';
}

function saveData() {
    // Persist form data to localStorage
    const data = collectFormData();
    if (APP.jobNumber) {
    try {
        localStorage.setItem(`fd_job_${APP.jobNumber}`, JSON.stringify(data));
        alert('Saved successfully.');
    } catch (e) {
        alert('Could not save data. Your browser storage may be full or restricted.\n\nTip: Try printing or emailing the estimate before closing this page.');
    }
    } else {
        alert('Please create a new estimate first (click "New Estimate").');
    }
}

function collectFormData() {
    return {
        jobNumber:   APP.jobNumber,
        jobStatus:   APP.jobStatus,
        isLocked:    APP.isLocked,
        dateCreated: APP.dateCreated,
        firstName:   gv('firstName'),
        lastName:    gv('lastName'),
        company:     gv('companyName'),
        contactFirst:gv('contactFirst'),
        contactLast: gv('contactLast'),
        streetAddr:  gv('streetAddr'),
        city:        gv('city'),
        province:    gv('province'),
        postal:      gv('postal'),
        phone:       gv('phone'),
        emailAddr:   gv('emailAddr'),
        custNotes:   gv('custNotes')
    };
}

function customerDisplayName() {
    const type = checkedVal('custType');
    if (type === 'business') {
        return gv('companyName') || `${gv('contactFirst')} ${gv('contactLast')}`.trim() || '—';
    }
    return `${gv('firstName')} ${gv('lastName')}`.trim() || '—';
}

// Labour calc
function calcLabour() {
    const hrs  = parseFloat(gv('labourHrs'))  || 0;
    const rate = parseFloat(gv('labourRate')) || 0;
    sv('labourTotal', fmtMoney(hrs * rate));
}

// ============================================================
// FENCE TYPE TAB
// ============================================================

const SUPPLIERS = {
    'chainlink-res':  'Standard Chain-Link Distributors (Canadian Standards)',
    'chainlink-com':  'Commercial Chain-Link Distributors (Canadian Standards)',
    'wood':           'Pressure Treated Lumber',
    'pvc':            'Homeland Vinyl – Gorilla Fence Brand',
    'wrought-iron':   'Culture Direct Industries',
    'guiderail':      'Arm Tech Industries',
    'bollards':       'Fence Depot Inventory',
    'highway':        'Fence Depot Inventory',
    'gate-operators': 'Chamberlain Group'
};

function onFenceTypeChange() {
    const type    = checkedVal('fenceType');
    const supBox  = $('supplierBox');
    const supText = $('supplierText');

    if (type && supBox && supText) {
        supBox.classList.remove('hidden');
        supText.textContent = SUPPLIERS[type] || '—';
    }
}

// ============================================================
// FENCE STYLE TAB
// ============================================================

function onFenceTypeChangeUpdateStyle() {
    const type = checkedVal('fenceType');
    const noType    = $('styleNoType');
    const clSection = $('styleChainLink');
    const otSection = $('styleOther');

    if (!type) {
        noType.classList.remove('hidden');
        clSection.classList.add('hidden');
        otSection.classList.add('hidden');
        return;
    }

    noType.classList.add('hidden');

    if (type === 'chainlink-res' || type === 'chainlink-com') {
        clSection.classList.remove('hidden');
        otSection.classList.add('hidden');
    } else {
        clSection.classList.add('hidden');
        otSection.classList.remove('hidden');
    }

    onStyleChange();
}

function onStyleChange() {
    const type    = checkedVal('fenceType');
    const summBox = $('styleSummaryBox');
    const summTxt = $('styleSummaryText');

    if (!type) return;

    let desc = '';
    if (type === 'chainlink-res' || type === 'chainlink-com') {
        const grade  = checkedVal('clGrade')    || 'standard';
        const height = checkedVal('fenceHeight') || '5';
        const gauge  = checkedVal('wireGauge')   || '9';
        const color  = checkedVal('fenceColor')  || 'Galvanized';
        const gradeLabel = grade === 'upgraded' ? 'Upgraded' : 'Standard';
        const typeLabel  = type === 'chainlink-com' ? 'Commercial' : 'Residential';
        desc = `${height}' ${color} Chain-Link ${typeLabel} – ${gradeLabel} Grade, ${gauge} Gauge Mesh`;
    } else {
        desc = `${type.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}`;
    }

    if (summBox && summTxt) {
        summBox.classList.remove('hidden');
        summTxt.textContent = desc;
    }
}

// ============================================================
// FENCE LAYOUT – DYNAMIC FOOTAGE INPUTS
// ============================================================

let footageCount = 0;

function initFootageInputs() {
    const container = $('footageInputs');
    if (!container) return;
    container.innerHTML = '';
    footageCount = 0;
    addFootageInput();
}

function addFootageInput() {
    footageCount++;
    const container = $('footageInputs');
    const row = document.createElement('div');
    row.className = 'footage-row';
    row.id = `footage-row-${footageCount}`;

    const input = document.createElement('input');
    input.type        = 'number';
    input.id          = `footage-${footageCount}`;
    input.min         = '0';
    input.step        = '0.5';
    input.placeholder = '0';
    input.className   = 'footage-input';
    input.addEventListener('input', () => {
        onFootageInput(footageCount);
    });

    const label = document.createElement('span');
    label.className   = 'footage-label';
    label.textContent = `Section / Leg ${footageCount}  (feet)`;

    row.appendChild(input);
    row.appendChild(label);
    container.appendChild(row);
}

function onFootageInput(n) {
    const val = parseFloat($(`footage-${n}`)?.value || '0');

    // If this is the last input and it has a value, add another
    if (n === footageCount && val > 0) {
        addFootageInput();
    }

    updateFootageTotal();
    onLayoutChange();
}

function getFootageSections() {
    const sections = [];
    for (let i = 1; i <= footageCount; i++) {
        const el = $(`footage-${i}`);
        if (el) {
            const v = parseFloat(el.value) || 0;
            if (v > 0) sections.push(v);
        }
    }
    return sections;
}

function updateFootageTotal() {
    const sections = getFootageSections();
    const total    = sections.reduce((s, v) => s + v, 0);
    const el       = $('footageTotal');
    if (el) {
        el.textContent = total > 0
            ? `Total Fence Length: ${total.toFixed(1)} linear feet`
            : '';
    }
}

function onLayoutChange() {
    const sections    = getFootageSections();
    const totalFt     = sections.reduce((s, v) => s + v, 0);
    const endQty      = parseInt(gv('postEnd'))         || 0;
    const cornerQty   = parseInt(gv('postCorner'))      || 0;
    const threeWayQty = parseInt(gv('postThreeWay'))    || 0;
    const gatePostQty = parseInt(gv('postGate'))        || 0;
    const blankQty    = parseInt(gv('postBlank'))       || 0;
    const setFitQty   = parseInt(gv('postSetFittings')) || 0;
    const totalTerminal = endQty + cornerQty + threeWayQty + gatePostQty + blankQty;

    const summEl = $('postSummary');
    if (summEl) {
        summEl.textContent = totalTerminal > 0 || totalFt > 0
            ? `Total fence: ${totalFt.toFixed(1)} ft  ·  Terminal posts: ${totalTerminal}  ·  ` +
              `Sets of fittings: ${setFitQty}`
            : '';
    }

    // Layout summary box
    const layoutBox = $('layoutSummaryBox');
    const layoutTxt = $('layoutSummaryText');
    if (layoutBox && layoutTxt && totalFt > 0) {
        layoutBox.classList.remove('hidden');
        layoutTxt.textContent =
            `${sections.length} section(s), ${totalFt.toFixed(1)} lin. ft total. ` +
            `Terminal posts: ${totalTerminal}. ` +
            `Single gates: ${gv('singleGateQty') || 0}. ` +
            `Double gates: ${gv('doubleGateQty') || 0}.`;
    } else if (layoutBox) {
        layoutBox.classList.add('hidden');
    }
}

function onGateChange() {
    const sg = parseInt(gv('singleGateQty')) || 0;
    const dg = parseInt(gv('doubleGateQty')) || 0;

    const sgCustom = $('singleGateCustom');
    const dgCustom = $('doubleGateCustom');
    if (sgCustom) sgCustom.classList.toggle('hidden', sg === 0);
    if (dgCustom) dgCustom.classList.toggle('hidden', dg === 0);

    onLayoutChange();
    calcGateCustomCharges();
}

function calcGateCustomCharges() {
    const sg       = parseInt(gv('singleGateQty'))   || 0;
    const dg       = parseInt(gv('doubleGateQty'))   || 0;
    const sgExtra  = parseFloat(gv('singleExtraIn')) || 0;
    const sgPrice  = parseFloat(gv('singlePricePerIn')) || 0;
    const sgSetup  = parseFloat(gv('singleSetupChg'))   || 0;
    const dgExtra  = parseFloat(gv('doubleExtraIn')) || 0;
    const dgPrice  = parseFloat(gv('doublePricePerIn')) || 0;
    const dgSetup  = parseFloat(gv('doubleSetupChg'))   || 0;

    const total =
        sg * (sgExtra * sgPrice + sgSetup) +
        dg * (dgExtra * dgPrice + dgSetup);

    sv('estGateCustom', total.toFixed(2));
}

// ============================================================
// CHAIN-LINK MATERIALS ENGINE
// ============================================================

function calcChainLinkMaterials() {
    const type    = checkedVal('fenceType')  || '';
    const grade   = checkedVal('clGrade')    || 'standard';
    const height  = parseInt(checkedVal('fenceHeight') || '5');
    const gauge   = checkedVal('wireGauge')  || '9';
    const color   = checkedVal('fenceColor') || 'Galvanized';

    const sections    = getFootageSections();
    const totalFt     = sections.reduce((s, v) => s + v, 0);
    const endQty      = parseInt(gv('postEnd'))         || 0;
    const cornerQty   = parseInt(gv('postCorner'))      || 0;
    const threeWayQty = parseInt(gv('postThreeWay'))    || 0;
    const gatePostQty = parseInt(gv('postGate'))        || 0;
    const blankQty    = parseInt(gv('postBlank'))       || 0;
    const setFitQty   = parseInt(gv('postSetFittings')) || 0;
    const sgQty       = parseInt(gv('singleGateQty'))   || 0;
    const dgQty       = parseInt(gv('doubleGateQty'))   || 0;

    if (totalFt === 0) return null;

    // ---- Framework dimensions ----
    let topRailDia, termPostDia, linePostDia;
    if (grade === 'upgraded') {
        topRailDia  = '1-5/8"';
        termPostDia = '2-3/8"';
        linePostDia = '1-7/8"';
    } else {
        topRailDia  = '1-1/4"';
        termPostDia = '1-7/8"';
        linePostDia = '1-1/2"';
    }
    // Post length: fence height + 2'6" (30") underground depth as per standard installation
    const POST_GROUND_DEPTH = 2.5; // feet (2'6") below grade
    const postLen    = height + POST_GROUND_DEPTH;
    const postLenStr = fmtFtIn(postLen);

    // ---- Top rail ----
    const topRailCount = Math.ceil(totalFt / 10);

    // ---- Line posts (one per 10' span between terminals) ----
    let linePosts = 0;
    sections.forEach(sec => {
        const spans = Math.ceil(sec / 10);
        if (spans > 1) linePosts += spans - 1;
    });

    // ---- Chain-link mesh (50' rolls) ----
    const meshRolls = Math.ceil(totalFt / 50);

    // ---- Total terminal posts ----
    const totalTerminal = endQty + cornerQty + threeWayQty + gatePostQty + blankQty;

    // Tension bar bands per end fitting:
    // Rule: 1 band per foot of fence height, with a minimum of 4 for 3' and 4' fences
    const bandsPerFitting = height <= 4 ? 4 : height;

    // ---- Fittings accumulator ----
    let mainCaps = 0, endRailBands = 0, endRailCaps = 0,
        tensionBars = 0, tensionBands = 0, fenceBolts = 0;

    /**
     * Accumulates fittings for terminal posts.
     * @param {number} qty   - Number of posts of this type
     * @param {number} multi - Fitting multiplier: 1=end/gate, 2=corner, 3=three-way corner
     *
     * Main post cap is always 1 per post regardless of multiplier.
     * Fence bolts = 1 per end rail band + 1 per tension bar band (bands and end rail need bolts).
     */
    function addFittings(qty, multi) {
        mainCaps     += 1 * qty;                                    // always 1 cap per post
        endRailBands += multi * qty;
        endRailCaps  += multi * qty;
        tensionBars  += multi * qty;
        tensionBands += multi * bandsPerFitting * qty;
        fenceBolts   += multi * (1 + bandsPerFitting) * qty;       // 1 for end rail band + bandsPerFitting for tension bands
    }

    addFittings(endQty,      1);   // end posts
    addFittings(gatePostQty, 1);   // gate posts same as end
    addFittings(cornerQty,   2);   // corner posts double
    addFittings(threeWayQty, 3);   // 3-way triple

    // Blank posts — cap only
    mainCaps += 1 * blankQty;

    // Sets of fittings — same as end post but no cap
    endRailBands += 1 * setFitQty;
    endRailCaps  += 1 * setFitQty;
    tensionBars  += 1 * setFitQty;
    tensionBands += bandsPerFitting * setFitQty;
    fenceBolts   += (1 + bandsPerFitting) * setFitQty;

    // ---- Gate hardware ----
    // Single gate (standard 42")
    const sg_clips       = sgQty * (height - 1) * 2;  // 1-1/4"
    const sg_tensionBars = sgQty * 2;                  // 1 per side
    const sg_hinges      = sgQty * 2;                  // 1-1/4"
    const sg_collar      = sgQty * 2;                  // gate post dia
    const sg_hingeBolts  = sgQty * 2;                  // 5/8" x 3"
    const sg_dropLatch   = sgQty * 1;                  // gate post dia
    const sg_fingerLatch = sgQty * 1;                  // 1-1/4"

    // Double gate (standard 84") – additional hardware ON TOP of base fittings
    // Note: for a double gate, you also count the base single-gate hardware for each leaf
    // plus the additional double-gate items
    const dg_hinges_extra = dgQty * 2;                 // +2 extra hinges
    const dg_dropLatch    = dgQty * 1;                 // 1-1/4" centre drop latch
    const dg_dropPin      = dgQty * 1;                 // 5/8" x 24"
    const dg_fingerLatch  = dgQty * 1;                 // shared latch
    // Double gate base hardware (treat each double gate as 2 leaves – clips, tension bars, etc.)
    const dg_clips        = dgQty * (height - 1) * 2 * 2;  // × 2 for both leaves
    const dg_tensionBars  = dgQty * 2 * 2;
    const dg_hinges_base  = dgQty * 2;                 // 2 hinges per leaf × 1 leaf priced (other leaf is gate post)
    const dg_collar       = dgQty * 2;
    const dg_hingeBolts   = dgQty * 2;
    const dg_dropLatchPost= dgQty * 1;                 // gate post dia (at bottom of one leaf)

    const colorNote = color === 'Galvanized' ? 'Galvanized' : color;
    const gradeLabel = grade === 'upgraded' ? 'Upgraded' : 'Standard';

    return {
        grade, height, gauge, color: colorNote, totalFt,
        sections, meshRolls,
        framework: [
            { desc:`Top Rail – ${topRailDia} × 10' (${colorNote})`,       qty: topRailCount,   unit:'Each' },
            { desc:`Terminal Post – ${termPostDia} × ${postLenStr} (${colorNote})`, qty: totalTerminal, unit:'Each' },
            { desc:`Line Post – ${linePostDia} × ${postLenStr} (${colorNote})`,     qty: linePosts,     unit:'Each' }
        ],
        mesh: [
            { desc:`${gauge} Ga. ${colorNote} Chain-Link Mesh – ${height}' height (50' rolls)`, qty: meshRolls, unit:'Roll' }
        ],
        fittings: [
            { desc:`Main Post Cap – ${termPostDia} (${colorNote})`,         qty: mainCaps,    unit:'Each' },
            { desc:`End Rail Band – ${termPostDia} (${colorNote})`,         qty: endRailBands,unit:'Each' },
            { desc:`End Rail Cap – ${topRailDia} (${colorNote})`,           qty: endRailCaps, unit:'Each' },
            { desc:`Tension Bar – ${height}' length (${colorNote})`,        qty: tensionBars, unit:'Each' },
            { desc:`Tension Bar Bands – ${termPostDia} (${colorNote}) [${bandsPerFitting} per end fitting]`, qty: tensionBands, unit:'Each' },
            { desc:`Fence Bolts – Carriage 3/8" × 1-1/4" (Galv)`,          qty: fenceBolts,  unit:'Each' }
        ],
        singleGate: sgQty > 0 ? [
            { desc:`Gate Clips 1-1/4" (${colorNote}) – ${sgQty} gate(s)`,  qty: sg_clips,       unit:'Each' },
            { desc:`Tension Bars – ${height}' length`,                      qty: sg_tensionBars, unit:'Each' },
            { desc:`Gate Frame Hinges 1-1/4" (${colorNote})`,               qty: sg_hinges,      unit:'Each' },
            { desc:`Hinge Post Collar – ${termPostDia}`,                    qty: sg_collar,      unit:'Each' },
            { desc:`Hinge Bolts 5/8" × 3" (Galv)`,                         qty: sg_hingeBolts,  unit:'Each' },
            { desc:`Drop Latch – ${termPostDia} (gate post dia.)`,          qty: sg_dropLatch,   unit:'Each' },
            { desc:`Finger Latch 1-1/4" (${colorNote})`,                    qty: sg_fingerLatch, unit:'Each' }
        ] : [],
        doubleGate: dgQty > 0 ? [
            { desc:`Gate Clips 1-1/4" (${colorNote}) – ${dgQty} double gate(s)`, qty: dg_clips,         unit:'Each' },
            { desc:`Tension Bars – ${height}' length`,                            qty: dg_tensionBars,   unit:'Each' },
            { desc:`Gate Frame Hinges 1-1/4" (base) (${colorNote})`,             qty: dg_hinges_base,   unit:'Each' },
            { desc:`Gate Frame Hinges 1-1/4" (extra – double gate) (${colorNote})`, qty: dg_hinges_extra, unit:'Each' },
            { desc:`Hinge Post Collar – ${termPostDia}`,                          qty: dg_collar,        unit:'Each' },
            { desc:`Hinge Bolts 5/8" × 3" (Galv)`,                               qty: dg_hingeBolts,    unit:'Each' },
            { desc:`Drop Latch – ${termPostDia} (gate post dia.)`,                qty: dg_dropLatchPost, unit:'Each' },
            { desc:`Drop Latch 1-1/4" (centre) (${colorNote})`,                  qty: dg_dropLatch,     unit:'Each' },
            { desc:`Drop Pin 5/8" × 24" (Galv)`,                                  qty: dg_dropPin,       unit:'Each' },
            { desc:`Finger Latch 1-1/4" (${colorNote})`,                          qty: dg_fingerLatch,   unit:'Each' }
        ] : []
    };
}

// ============================================================
// ESTIMATE TAB
// ============================================================

function generateEstimate() {
    // Update header info on estimate
    sv('estJobNum',    APP.jobNumber || '—');
    sv('estCustomer',  ''); // span not input, use textContent
    const custEl = $('estCustomer');
    if (custEl) custEl.textContent = customerDisplayName();
    const dateEl = $('estDateDisp');
    if (dateEl) dateEl.textContent = fmtDate(APP.dateCreated || gv('estimateDate'));
    const typeEl = $('estFenceType');
    if (typeEl) typeEl.textContent = getFenceTypeLabel();

    const container = $('estimateContent');
    if (!container) return;

    const type = checkedVal('fenceType');
    if (!type) {
        container.innerHTML = '<div class="info-box">⚠️ Please select a Fence Type first.</div>';
        refreshGrandTotal();
        return;
    }

    if (type === 'chainlink-res' || type === 'chainlink-com') {
        const data = calcChainLinkMaterials();
        if (!data) {
            container.innerHTML = '<div class="info-box">⚠️ Please enter fence measurements in the Fence Layout tab.</div>';
            refreshGrandTotal();
            return;
        }
        container.innerHTML = buildEstimateTable(data);
        refreshGrandTotal();
    } else {
        container.innerHTML = buildGenericEstimate(type);
        refreshGrandTotal();
    }
}

function getFenceTypeLabel() {
    const type = checkedVal('fenceType');
    const labels = {
        'chainlink-res':  'Chain-Link Residential',
        'chainlink-com':  'Chain-Link Commercial',
        'wood':           'Wood Fence',
        'pvc':            'PVC Fence (Gorilla Fence)',
        'wrought-iron':   'Wrought / Rod Iron',
        'guiderail':      'Guiderail',
        'bollards':       'Bollards',
        'highway':        'Highway Fence',
        'gate-operators': 'Gate Operators'
    };
    return labels[type] || '—';
}

function buildEstimateTable(data) {
    let subTotal = 0;

    function tableSection(title, rows) {
        if (!rows || rows.length === 0) return '';
        let html = `<tr class="sec-hdr"><td colspan="5">${title}</td></tr>`;
        rows.forEach((r, idx) => {
            if (r.qty === 0) return;
            html += `
            <tr>
              <td>${r.desc}</td>
              <td style="text-align:center">${r.qty} ${r.unit}</td>
              <td><input type="number" class="price-input unit-price" id="up-${title.replace(/\s/g,'-')}-${idx}"
                         min="0" step="0.01" value="0" placeholder="0.00"
                         onchange="refreshGrandTotal()" title="Enter unit price"></td>
              <td class="ext-price" id="ext-${title.replace(/\s/g,'-')}-${idx}">$0.00</td>
            </tr>`;
        });
        return html;
    }

    const infoLine = `${data.height}' ${data.color} Chain-Link – ${data.grade === 'upgraded' ? 'Upgraded' : 'Standard'} Grade, ` +
                     `${data.gauge} Gauge – Total: ${data.totalFt.toFixed(1)} lin. ft`;

    let html = `
    <div class="info-box" style="margin-bottom:16px;">
      <strong>Material Breakdown:</strong> ${infoLine}
      <br><small>Enter unit prices in the Price column. Extended amounts calculate automatically.</small>
    </div>
    <table class="estimate-table" id="materialTable">
      <thead>
        <tr>
          <th style="width:42%">Item Description</th>
          <th style="width:12%;text-align:center">Qty / Unit</th>
          <th style="width:15%">Unit Price ($)</th>
          <th style="width:13%;text-align:right">Extended ($)</th>
        </tr>
      </thead>
      <tbody>
        ${tableSection('Framework', data.framework)}
        ${tableSection('Chain-Link Mesh', data.mesh)}
        ${tableSection('Terminal Post Fittings', data.fittings)}
        ${data.singleGate.length ? tableSection('Single Gate Hardware', data.singleGate) : ''}
        ${data.doubleGate.length ? tableSection('Double Gate Hardware', data.doubleGate) : ''}
        <tr class="total-row">
          <td colspan="2"><strong>Materials Sub-Total</strong></td>
          <td colspan="2" style="text-align:right" id="matSubtotal"><strong>$0.00</strong></td>
        </tr>
      </tbody>
    </table>`;

    return html;
}

function buildGenericEstimate(type) {
    const label = getFenceTypeLabel();
    return `
    <div class="form-section">
      <div class="form-section-title">Estimate – ${label}</div>
      <div class="info-box">
        Detailed material lists for <strong>${label}</strong> will be added in a future update.
        Use the table below to manually enter line items, or contact your supplier for a product quote.
      </div>
      <table class="estimate-table">
        <thead>
          <tr>
            <th style="width:50%">Item Description</th>
            <th style="width:15%;text-align:center">Qty</th>
            <th style="width:15%">Unit Price ($)</th>
            <th style="width:20%;text-align:right">Extended ($)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="4" style="color:#888;font-style:italic;padding:20px;text-align:center;">
            Enter items manually or recalculate after selecting Chain-Link type above.
          </td></tr>
        </tbody>
      </table>
    </div>`;
}

function refreshGrandTotal() {
    // Sum all unit-price inputs × qty
    let matTotal = 0;
    document.querySelectorAll('.unit-price').forEach(input => {
        const price = parseFloat(input.value) || 0;
        // Find qty from the same row
        const row = input.closest('tr');
        if (row) {
            const qtyCell = row.cells[1];
            if (qtyCell) {
                const qtyText = qtyCell.textContent.trim();
                const qty = parseFloat(qtyText) || 0;
                const ext = price * qty;
                matTotal += ext;

                // Update extended cell
                const extCellId = input.id.replace('up-', 'ext-');
                const extCell = $(extCellId);
                if (extCell) extCell.textContent = fmtMoney(ext);
            }
        }
    });

    // Update subtotal
    const subEl = $('matSubtotal');
    if (subEl) subEl.innerHTML = `<strong>${fmtMoney(matTotal)}</strong>`;
    APP.materialSubtotal = matTotal;

    const labour    = parseFloat(gv('estLabour'))     || 0;
    const delivery  = parseFloat(gv('estDelivery'))   || 0;
    const misc      = parseFloat(gv('estMisc'))       || 0;
    const gateCustom = parseFloat(gv('estGateCustom')) || 0;

    calcGateCustomCharges();

    const grand = matTotal + labour + delivery + misc + gateCustom;
    const gtEl  = $('grandTotalBox');
    if (gtEl) gtEl.textContent = `Grand Total (Before HST): ${fmtMoney(grand)}`;
}

// ============================================================
// GATE DRAWINGS REFRESH
// ============================================================

function refreshGateDrawings() {
    const el   = $('gateDrawingsSummary');
    if (!el) return;

    const type   = checkedVal('fenceType');
    const height = parseInt(checkedVal('fenceHeight') || '5');
    const color  = checkedVal('fenceColor') || 'Galvanized';
    const grade  = checkedVal('clGrade')    || 'standard';
    const sg     = parseInt(gv('singleGateQty'))  || 0;
    const dg     = parseInt(gv('doubleGateQty'))  || 0;
    const selfCl = $('selfCloser')?.checked;

    if (!type || (sg === 0 && dg === 0)) {
        el.innerHTML = '<em style="color:#888;">No gates entered in Fence Layout.</em>';
        return;
    }

    const termPostDia = grade === 'upgraded' ? '2-3/8"' : '1-7/8"';
    const bandsPerFitting = height <= 4 ? 4 : height; // same minimum rule used elsewhere

    let html = '';

    if (sg > 0) {
        html += `
        <div class="summary-card">
          <div class="sc-title">Single Gate(s) – Quantity: ${sg}</div>
          <div class="sc-body">
            <strong>Standard Width:</strong> 42" &nbsp;|&nbsp;
            <strong>Height:</strong> ${height}' &nbsp;|&nbsp;
            <strong>Colour:</strong> ${color}<br>
            <strong>Gate Post Diameter:</strong> ${termPostDia}<br>
            <strong>Self-Closers:</strong> ${selfCl ? 'Yes – Required' : 'No'}<br>
            <strong>Gate Clips:</strong> ${(height-1)*2} per gate (1-1/4") = ${(height-1)*2*sg} total<br>
            <strong>Gate Frame Hinges:</strong> 2 per gate (1-1/4") = ${2*sg} total<br>
            <strong>Hinge Post Collar:</strong> 2 per gate (${termPostDia}) = ${2*sg} total<br>
            <strong>Hinge Bolts:</strong> 2 per gate (5/8" × 3") = ${2*sg} total<br>
            <strong>Drop Latch:</strong> 1 per gate (${termPostDia}) = ${sg} total<br>
            <strong>Finger Latch:</strong> 1 per gate (1-1/4") = ${sg} total
          </div>
        </div>`;
    }

    if (dg > 0) {
        html += `
        <div class="summary-card">
          <div class="sc-title">Double Gate(s) – Quantity: ${dg}</div>
          <div class="sc-body">
            <strong>Standard Width:</strong> 84" &nbsp;|&nbsp;
            <strong>Height:</strong> ${height}' &nbsp;|&nbsp;
            <strong>Colour:</strong> ${color}<br>
            <strong>Gate Post Diameter:</strong> ${termPostDia}<br>
            <strong>Gate Frame Hinges:</strong> 4 per gate (2 base + 2 extra) (1-1/4") = ${4*dg} total<br>
            <strong>Hinge Post Collar:</strong> 2 per gate (${termPostDia}) = ${2*dg} total<br>
            <strong>Hinge Bolts:</strong> 2 per gate (5/8" × 3") = ${2*dg} total<br>
            <strong>Gate Clips:</strong> ${(height-1)*2*2} per gate (1-1/4") = ${(height-1)*2*2*dg} total<br>
            <strong>Drop Latch (gate post):</strong> 1 per gate (${termPostDia}) = ${dg} total<br>
            <strong>Drop Latch (centre):</strong> 1 per gate (1-1/4") = ${dg} total<br>
            <strong>Drop Pin:</strong> 1 per gate (5/8" × 24") = ${dg} total<br>
            <strong>Finger Latch:</strong> 1 per gate (1-1/4") = ${dg} total
          </div>
        </div>`;
    }

    el.innerHTML = html;
}

// ============================================================
// CONTRACT SUMMARY REFRESH
// ============================================================

function refreshContractSummary() {
    const el = $('contractSummary');
    if (!el) return;

    if (!APP.jobNumber) {
        el.innerHTML = '<em style="color:#888;">No estimate created yet. Start from the Customer Info tab.</em>';
        return;
    }

    const custName  = customerDisplayName();
    const fenceType = getFenceTypeLabel();
    const height    = checkedVal('fenceHeight') || '—';
    const color     = checkedVal('fenceColor')  || '—';
    const sections  = getFootageSections();
    const totalFt   = sections.reduce((s, v) => s + v, 0);
    const sg        = parseInt(gv('singleGateQty')) || 0;
    const dg        = parseInt(gv('doubleGateQty')) || 0;
    const grade     = checkedVal('clGrade') === 'upgraded' ? 'Upgraded' : 'Standard';

    el.innerHTML = `
    <div class="summary-card">
      <div class="sc-title">Job Details</div>
      <div class="sc-body">
        <strong>Contract #:</strong> ${APP.jobNumber}<br>
        <strong>Date:</strong> ${fmtDate(APP.dateCreated || gv('estimateDate'))}<br>
        <strong>Customer:</strong> ${custName}<br>
        <strong>Address:</strong> ${gv('streetAddr')}, ${gv('city')}, ${gv('province')} ${gv('postal')}<br>
        <strong>Phone:</strong> ${gv('phone')} &nbsp;|&nbsp; <strong>Email:</strong> ${gv('emailAddr') || '—'}
      </div>
    </div>
    <div class="summary-card">
      <div class="sc-title">Fence Specifications</div>
      <div class="sc-body">
        <strong>Type:</strong> ${fenceType}<br>
        <strong>Grade:</strong> ${grade}<br>
        <strong>Height:</strong> ${height}'<br>
        <strong>Colour:</strong> ${color}<br>
        <strong>Total Footage:</strong> ${totalFt.toFixed(1)} linear feet<br>
        <strong>Single Gates:</strong> ${sg} &nbsp;|&nbsp; <strong>Double Gates:</strong> ${dg}
      </div>
    </div>
    <div class="summary-card">
      <div class="sc-title">Financial Summary</div>
      <div class="sc-body">
        <strong>Materials Sub-Total:</strong> ${fmtMoney(APP.materialSubtotal)}<br>
        <strong>Labour:</strong> ${fmtMoney(parseFloat(gv('estLabour')) || 0)}<br>
        <strong>Delivery:</strong> ${fmtMoney(parseFloat(gv('estDelivery')) || 0)}<br>
        <strong>Grand Total (Before HST):</strong>
        ${fmtMoney(
            APP.materialSubtotal +
            (parseFloat(gv('estLabour'))   || 0) +
            (parseFloat(gv('estDelivery')) || 0) +
            (parseFloat(gv('estMisc'))     || 0) +
            (parseFloat(gv('estGateCustom'))|| 0)
        )}
      </div>
    </div>`;
}

// Deposit calculation
function calcDeposit() {
    const pct   = parseFloat(gv('depositPct')) || 0;
    const grand = APP.materialSubtotal +
                  (parseFloat(gv('estLabour'))    || 0) +
                  (parseFloat(gv('estDelivery'))  || 0) +
                  (parseFloat(gv('estMisc'))      || 0);
    const dep   = grand * pct / 100;
    sv('depositAmt', dep.toFixed(2));
    const balEl = $('balanceDue');
    if (balEl) balEl.value = fmtMoney(grand - dep);
}

// ============================================================
// INSTALL PACKAGE REFRESH
// ============================================================

function refreshInstallPackage() {
    const el = $('installPkgSummary');
    if (!el) return;

    const custName = customerDisplayName();
    const sections = getFootageSections();
    const totalFt  = sections.reduce((s, v) => s + v, 0);

    el.innerHTML = `
    <strong>Job #:</strong> ${APP.jobNumber || '—'} &nbsp;|&nbsp;
    <strong>Customer:</strong> ${custName} &nbsp;|&nbsp;
    <strong>Date:</strong> ${fmtDate(APP.dateCreated)}<br>
    <strong>Fence Type:</strong> ${getFenceTypeLabel()} &nbsp;|&nbsp;
    <strong>Total Footage:</strong> ${totalFt.toFixed(1)} ft<br>
    <strong>Installation Start:</strong> ${fmtDate(gv('instStart'))} &nbsp;|&nbsp;
    <strong>Crew Lead:</strong> ${gv('crewLead') || '—'}`;
}

// ============================================================
// PRINT
// ============================================================

function printTab(tabId) {
    // Switch to the requested tab (stamp date), then print
    const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (btn) btn.click();
    // Delay allows the tab switch and DOM re-render to complete before the print dialog opens
    const PRINT_RENDER_DELAY_MS = 300;
    setTimeout(() => window.print(), PRINT_RENDER_DELAY_MS);
}

// ============================================================
// EMAIL ACTIONS
// ============================================================

function buildSubject() {
    const jn   = APP.jobNumber || 'New Estimate';
    const name = customerDisplayName();
    return `Fence Depot – Job ${jn} – ${name}`;
}

function emailCustomer() {
    const email = gv('emailAddr');
    if (!email) { alert('No customer email entered.'); return; }
    const subj = encodeURIComponent(buildSubject());
    const body = encodeURIComponent(
        `Dear ${customerDisplayName()},\n\nPlease find your fence estimate attached.\n\nJob Number: ${APP.jobNumber}\n\nThank you,\nFence Depot – Locke`
    );
    window.open(`mailto:${email}?subject=${subj}&body=${body}`);
}

function emailEstimate() { emailCustomer(); }

function emailContract() {
    const email = gv('emailAddr');
    if (!email) { alert('No customer email entered.'); return; }
    const subj = encodeURIComponent(`Fence Depot – Contract ${APP.jobNumber} – ${customerDisplayName()}`);
    const body = encodeURIComponent(`Dear ${customerDisplayName()},\n\nPlease find your signed contract attached.\n\nContract Number: ${APP.jobNumber}\n\nThank you,\nFence Depot – Locke`);
    window.open(`mailto:${email}?subject=${subj}&body=${body}`);
}

function emailInstall() {
    const subj = encodeURIComponent(`Installation Package – Job ${APP.jobNumber}`);
    window.open(`mailto:?subject=${subj}`);
}

function emailGateDrawings() {
    const subj = encodeURIComponent(`Gate Drawings – Job ${APP.jobNumber}`);
    window.open(`mailto:?subject=${subj}`);
}

function emailPermit() {
    const email = gv('permitEmail') || '';
    const subj  = encodeURIComponent(`Building Permit Application – Job ${APP.jobNumber} – ${customerDisplayName()}`);
    const body  = encodeURIComponent(
        `To Whom It May Concern,\n\nPlease find the fence permit application for the following property:\n\n` +
        `Customer: ${customerDisplayName()}\n` +
        `Address: ${gv('streetAddr')}, ${gv('city')}, ${gv('province')}\n` +
        `Job #: ${APP.jobNumber}\n\nThank you,\nFence Depot – Locke`
    );
    window.open(`mailto:${email}?subject=${subj}&body=${body}`);
}

function emailLocate() {
    const subj = encodeURIComponent(`Underground Locate Request – Job ${APP.jobNumber} – ${customerDisplayName()}`);
    const body = encodeURIComponent(
        `Please process an underground locate request for:\n\n` +
        `Address: ${gv('instAddr') || gv('streetAddr')}, ${gv('instCity') || gv('city')}\n` +
        `Planned Start: ${fmtDate(gv('excavDate'))}\n` +
        `Job #: ${APP.jobNumber}\n\nThank you,\nFence Depot – Locke`
    );
    window.open(`mailto:?subject=${subj}&body=${body}`);
}

// ============================================================
// FENCE TYPE → STYLE SYNC (when fence type tab changes)
// ============================================================

// We observe radio changes on fenceType to also update style tab
function hookFenceTypeToStyle() {
    document.querySelectorAll('input[name="fenceType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            onFenceTypeChangeUpdateStyle();
        });
    });
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initFootageInputs();
    hookFenceTypeToStyle();

    // Set today's date as default
    sv('estimateDate', today());

    // Stamp initial tab date
    stampDate('ds-customer');

    // Kick off style section visibility
    onFenceTypeChangeUpdateStyle();
});
