let perguntas = [];
let perguntasFiltradas = [];
let indiceAtual = 0;
let timerInterval;
let tempoRestante = 90; // 1:30 padrão

// Sons
const somCerto = new Audio("/static/sounds/certo.mp3");
const somErrado = new Audio("/static/sounds/errado.mp3");
const somTensao = new Audio("/static/sounds/tensao.mp3");
const somTimeout = new Audio("/static/sounds/timeout.mp3");

// Carregar perguntas do backend
async function carregarPerguntas() {
    try {
        const res = await fetch("/api/questions");
        perguntas = await res.json();

        // Listar os temas únicos
        const temasUnicos = [...new Set(perguntas.map(p => p.tema))];
        const temasDiv = document.getElementById("temas");
        temasDiv.innerHTML = "";
        temasUnicos.forEach(tema => {
            const btn = document.createElement("button");
            btn.textContent = tema;
            btn.onclick = () => selecionarTema(tema);
            temasDiv.appendChild(btn);
        });
    } catch (err) {
        console.error("Erro ao carregar perguntas:", err);
    }
}

// Selecionar tema e embaralhar perguntas
function selecionarTema(tema) {
    perguntasFiltradas = perguntas.filter(p => p.tema === tema);
    perguntasFiltradas = perguntasFiltradas.sort(() => Math.random() - 0.5);

    document.getElementById("menu-tema").style.display = "none";
    document.getElementById("quiz-container").style.display = "block";

    indiceAtual = 0;
    mostrarPergunta();
}

// Mostrar pergunta atual
function mostrarPergunta() {
    clearInterval(timerInterval);

    if (indiceAtual >= perguntasFiltradas.length) {
        document.getElementById("quiz-container").innerHTML = "<h2>Fim do jogo! 🎉</h2>";
        document.getElementById("next-btn").style.display = "none";
        return;
    }

    const pergunta = perguntasFiltradas[indiceAtual];
    tempoRestante = pergunta.time ? pergunta.time : 90; // usa tempo específico ou padrão

    const container = document.getElementById("quiz-container");
    container.innerHTML = "";

    const card = document.createElement("div");
    card.classList.add("card");

    let minutos = Math.floor(tempoRestante / 60);
    let segundos = tempoRestante % 60;

    let html = `<h3>${pergunta.tema}</h3>
                <p>${pergunta.formulacao}</p>
                <div id="timer" style="font-weight:bold; font-size:1.2rem; margin-bottom:10px;">
                    Tempo: ${minutos.toString().padStart(2,'0')}:${segundos.toString().padStart(2,'0')}
                </div>`;

    if (pergunta.tipo === "multipla_escolha") {
        for (let [letra, texto] of Object.entries(pergunta.opcoes)) {
            html += `<button class="opcao" onclick="verificarResposta('${letra}')">${letra}) ${texto}</button>`;
        }
    } else {
        html += `<input type="text" id="resposta-input" placeholder="Digite sua resposta">
                 <button onclick="verificarRespostaDiscursiva()">Confirmar</button>`;
    }

    html += `<div id="feedback" style="margin-top:10px;"></div>`;
    card.innerHTML = html;
    container.appendChild(card);

    // Iniciar o timer
    timerInterval = setInterval(() => atualizarTimer(), 1000);
}

// Atualiza o timer a cada segundo
function atualizarTimer() {
    const timerDiv = document.getElementById("timer");
    let minutos = Math.floor(tempoRestante / 60);
    let segundos = tempoRestante % 60;
    timerDiv.textContent = `Tempo: ${minutos.toString().padStart(2,'0')}:${segundos.toString().padStart(2,'0')}`;

    // Som de tensão nos últimos 20s
    if (tempoRestante === 20) {
        somTensao.play();
    }

    if (tempoRestante <= 0) {
        clearInterval(timerInterval);
        bloquearRespostas();
        return;
    }

    tempoRestante--;
}

// Bloquear todas as respostas quando o tempo acabar ou já respondido
function bloquearRespostas() {
    const botoes = document.querySelectorAll(".opcao");
    botoes.forEach(btn => btn.disabled = true);

    const btnConfirm = document.querySelector("#resposta-input + button");
    if (btnConfirm) btnConfirm.disabled = true;

    const feedback = document.getElementById("feedback");
    if (tempoRestante <= 0) {
        feedback.innerHTML = `⏰ Tempo esgotado! Apenas prossiga para a próxima pergunta.`;
        feedback.style.color = "orange";
        somTimeout.play(); // toca apenas uma vez no fim
    }

    document.getElementById("next-btn").style.display = "inline-block";
}

// Verificar resposta de múltipla escolha
function verificarResposta(escolha) {
    clearInterval(timerInterval);
    const pergunta = perguntasFiltradas[indiceAtual];
    const feedback = document.getElementById("feedback");

    bloquearRespostas();

    if (escolha === pergunta.resposta_correta) {
        feedback.innerHTML = `✅ Correto! ${pergunta.comentario}`;
        feedback.style.color = "lightgreen";
        somCerto.play();
    } else {
        feedback.innerHTML = `❌ Errado! Resposta correta: ${pergunta.resposta_correta}. ${pergunta.comentario}`;
        feedback.style.color = "red";
        somErrado.play();
    }
}

// Verificar resposta discursiva
function verificarRespostaDiscursiva() {
    clearInterval(timerInterval);
    const pergunta = perguntasFiltradas[indiceAtual];
    const respostaUser = document.getElementById("resposta-input").value.trim();
    const feedback = document.getElementById("feedback");

    bloquearRespostas();

    if (respostaUser.toLowerCase() === pergunta.resposta_correta.toLowerCase()) {
        feedback.innerHTML = `✅ Correto! ${pergunta.comentario}`;
        feedback.style.color = "lightgreen";
        somCerto.play();
    } else {
        feedback.innerHTML = `❌ Errado! Resposta correta: ${pergunta.resposta_correta}. ${pergunta.comentario}`;
        feedback.style.color = "red";
        somErrado.play();
    }
}

// Próxima pergunta
document.getElementById("next-btn").addEventListener("click", () => {
    indiceAtual++;
    document.getElementById("next-btn").style.display = "none";
    mostrarPergunta();
});

// Inicializa o quiz ao carregar a página
document.addEventListener("DOMContentLoaded", carregarPerguntas);
