let bank = [];
let currentTest = [];
let userAnswers = [];
let currentIndex = 0;
let currentUser = null;
let timer;

// Ma'lumotlarni yuklash
async function loadData() {
    const files = ['musiqa_nazariyasi.json', 'cholgu_ijrochiligi.json', 'vokal_ijrochiligi.json', 'metodika_repertuar.json'];
    for (const f of files) {
        try {
            const res = await fetch(f);
            const data = await res.json();
            const subject = f.split('.')[0];
            bank = bank.concat(data.map((q, i) => ({ ...q, id: `${subject}_${i}`, subject })));
        } catch (e) { console.error(f + " yuklanmadi"); }
    }
}
loadData();

// Login va Statistika
function handleLogin() {
    const name = document.getElementById('student-name').value.trim();
    if (name.length < 3) return alert("Ism kiriting!");
    
    currentUser = name;
    document.getElementById('display-name').innerText = name;
    updateStats();
    
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    document.getElementById('global-nav').classList.remove('hidden');
}

function updateStats() {
    const data = JSON.parse(localStorage.getItem(`stats_${currentUser}`)) || { learned: [], errors: [] };
    document.getElementById('learned-count').innerText = data.learned.length;
    document.getElementById('error-count').innerText = data.errors.length;
    document.getElementById('error-work-btn').disabled = data.errors.length === 0;
}

function startTest(type) {
    let pool = type === 'mixed' ? bank : bank.filter(q => q.subject === type);
    const userDb = JSON.parse(localStorage.getItem(`stats_${currentUser}`)) || { learned: [], errors: [] };
    
    // Yechilmagan savollarni tanlash
    let available = pool.filter(q => !userDb.learned.includes(q.id));
    if (available.length < 20) available = pool;

    currentTest = shuffle(available).slice(0, 20).map(q => {
        const correctText = q.options[q.answer];
        const shuffledOpts = shuffle([...q.options]);
        return { ...q, options: shuffledOpts, answer: shuffledOpts.indexOf(correctText) };
    });

    userAnswers = new Array(20).fill(null);
    currentIndex = 0;
    
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('test-screen').classList.remove('hidden');
    document.getElementById('exit-test-btn').classList.remove('hidden');
    document.getElementById('exam-timer').classList.remove('hidden');

    renderMap();
    renderQuestion();
}

function renderQuestion() {
    const q = currentTest[currentIndex];
    const area = document.getElementById('question-area');
    area.innerHTML = `
        <p style="color: #A3AED0; font-weight: 700; margin-bottom: 10px;">Savol ${currentIndex+1}/20</p>
        <h2 style="margin-bottom: 25px; line-height: 1.4;">${q.q}</h2>
        ${q.options.map((opt, i) => `
            <button class="option-btn ${getBtnClass(i)}" onclick="checkAns(${i})" ${userAnswers[currentIndex] ? 'disabled' : ''}>
                ${opt}
            </button>
        `).join('')}
    `;
    updateMap();
}

function checkAns(idx) {
    if (userAnswers[currentIndex]) return;
    const isCorrect = idx === currentTest[currentIndex].answer;
    userAnswers[currentIndex] = { selected: idx, isCorrect };
    
    // Shaxsiy xotiraga yozish
    const userDb = JSON.parse(localStorage.getItem(`stats_${currentUser}`)) || { learned: [], errors: [] };
    const qId = currentTest[currentIndex].id;
    
    if (isCorrect) {
        if (!userDb.learned.includes(qId)) userDb.learned.push(qId);
        userDb.errors = userDb.errors.filter(id => id !== qId);
    } else {
        if (!userDb.errors.includes(qId)) userDb.errors.push(qId);
    }
    localStorage.setItem(`stats_${currentUser}`, JSON.stringify(userDb));

    renderQuestion();
    if (userAnswers.filter(a => a !== null).length === 20) {
        document.getElementById('finish-btn').classList.remove('hidden');
    }
}

function finishExam() {
    const correct = userAnswers.filter(a => a?.isCorrect).length;
    if (correct < 20) {
        alert(`Natija: ${correct}/20. Qoidaga ko'ra, 100% bo'lmaguncha ushbu savollar qayta beriladi.`);
        startTest(currentTest[0].subject); // Qayta boshlash
    } else {
        triggerWin();
    }
}

function triggerWin() {
    document.getElementById('question-area').classList.add('gravity-fall');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => {
        alert("🎉 Mukammal! 100% natija.");
        exitTest();
    }, 2000);
}

function renderMap() {
    const map = document.getElementById('indicator-map');
    map.innerHTML = currentTest.map((_, i) => `<div class="dot" id="dot-${i}" onclick="goTo(${i})">${i+1}</div>`).join('');
}

function updateMap() {
    currentTest.forEach((_, i) => {
        const dot = document.getElementById(`dot-${i}`);
        dot.className = 'dot';
        if (i === currentIndex) dot.classList.add('active-dot');
        if (userAnswers[i]) dot.classList.add(userAnswers[i].isCorrect ? 'correct' : 'wrong');
    });
}

function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }
function goTo(i) { currentIndex = i; renderQuestion(); }
function move(step) { let n = currentIndex + step; if (n >= 0 && n < 20) { currentIndex = n; renderQuestion(); } }
function toggleTheme() { document.body.classList.toggle('dark-mode'); }
function exitTest() { location.reload(); }