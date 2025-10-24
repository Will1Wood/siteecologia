// Dados do Quiz
const quizData = [
    {
        pergunta: "Onde devo descartar meu celular antigo?",
        opcoes: [
            "No lixo comum",
            "Em pontos de coleta específicos para eletrônicos",
            "Enterrado no quintal",
            "Jogado no rio"
        ],
        respostaCorreta: 1
    },
    {
        pergunta: "Por que as baterias de celular são perigosas quando descartadas incorretamente?",
        opcoes: [
            "Podem explodir a qualquer momento",
            "Liberam substâncias tóxicas que contaminam o solo e água",
            "Causam interferência em sinais de TV",
            "Atraem animais perigosos"
        ],
        respostaCorreta: 1
    },
    {
        pergunta: "O que fazer antes de descartar um computador?",
        opcoes: [
            "Formatar o disco rígido para remover dados pessoais",
            "Quebrar a tela para ninguém usar",
            "Jogar pela janela",
            "Guardar por 10 anos antes de descartar"
        ],
        respostaCorreta: 0
    },
    {
        pergunta: "Qual destes NÃO é lixo eletrônico?",
        opcoes: [
            "Smartphone quebrado",
            "Geladeira velha",
            "Garrafa PET",
            "Tablet antigo"
        ],
        respostaCorreta: 2
    },
    {
        pergunta: "O que significa a sigla RAEE?",
        opcoes: [
            "Resíduos de Aparelhos Eletroeletrônicos",
            "Reciclagem de Aparelhos Eletrônicos Eficientes",
            "Reutilização de Aparelhos Eletrônicos Especiais",
            "Recuperação de Aparelhos Eletrônicos Extraordinários"
        ],
        respostaCorreta: 0
    }
];

let perguntaAtual = 0;
let respostas = [];

// Inicializar Quiz
function iniciarQuiz() {
    perguntaAtual = 0;
    respostas = [];
    mostrarPergunta();
    document.getElementById('quizResultado').style.display = 'none';
    document.querySelector('.quiz-controles').style.display = 'flex';
}

function mostrarPergunta() {
    const perguntaElem = document.getElementById('quizPergunta');
    const opcoesElem = document.getElementById('quizOpcoes');
    const progressoElem = document.getElementById('quizProgresso');
    const btnAnterior = document.getElementById('btnAnterior');
    const btnProximo = document.getElementById('btnProximo');
    
    // Atualizar progresso
    progressoElem.textContent = `Pergunta ${perguntaAtual + 1} de ${quizData.length}`;
    
    // Mostrar pergunta
    perguntaElem.textContent = quizData[perguntaAtual].pergunta;
    
    // Mostrar opções
    opcoesElem.innerHTML = '';
    quizData[perguntaAtual].opcoes.forEach((opcao, index) => {
        const opcaoElem = document.createElement('div');
        opcaoElem.className = 'quiz-opcao';
        if (respostas[perguntaAtual] === index) {
            opcaoElem.classList.add('selecionada');
        }
        opcaoElem.textContent = opcao;
        opcaoElem.onclick = () => selecionarOpcao(index);
        opcoesElem.appendChild(opcaoElem);
    });
    
    // Atualizar controles
    btnAnterior.disabled = perguntaAtual === 0;
    
    // Mudar texto do último botão para "Ver Resultado"
    if (perguntaAtual === quizData.length - 1) {
        btnProximo.textContent = 'Ver Resultado →';
    } else {
        btnProximo.textContent = 'Próxima →';
    }
}

function selecionarOpcao(index) {
    // Remover seleção anterior
    document.querySelectorAll('.quiz-opcao').forEach(opcao => {
        opcao.classList.remove('selecionada');
    });
    
    // Adicionar seleção atual
    document.querySelectorAll('.quiz-opcao')[index].classList.add('selecionada');
    
    // Salvar resposta
    respostas[perguntaAtual] = index;
}

// Event Listeners
document.getElementById('btnProximo').addEventListener('click', () => {
    // Verificar se uma opção foi selecionada
    if (respostas[perguntaAtual] === undefined) {
        alert('Por favor, selecione uma resposta antes de continuar!');
        return;
    }
    
    if (perguntaAtual < quizData.length - 1) {
        perguntaAtual++;
        mostrarPergunta();
    } else {
        mostrarResultado();
    }
});

document.getElementById('btnAnterior').addEventListener('click', () => {
    if (perguntaAtual > 0) {
        perguntaAtual--;
        mostrarPergunta();
    }
});

function mostrarResultado() {
    const acertos = respostas.filter((resposta, index) => 
        resposta === quizData[index].respostaCorreta
    ).length;
    
    const percentual = Math.round((acertos / quizData.length) * 100);
    
    let mensagem = '';
    let emoji = '';
    
    if (percentual >= 80) {
        mensagem = "🎉 Excelente! Você é um expert em reciclagem de eletrônicos!";
        emoji = "🏆";
    } else if (percentual >= 60) {
        mensagem = "👍 Muito bom! Você sabe bastante sobre o assunto!";
        emoji = "⭐";
    } else if (percentual >= 40) {
        mensagem = "💡 Bom! Mas ainda há coisas para aprender sobre reciclagem.";
        emoji = "📚";
    } else {
        mensagem = "📚 Hmm... Que tal estudar mais sobre reciclagem de eletrônicos?";
        emoji = "🌱";
    }
    
    document.getElementById('quizResultado').innerHTML = `
        <div class="resultado-content">
            <h3>${emoji} Seu Resultado: ${acertos}/${quizData.length} (${percentual}%)</h3>
            <p>${mensagem}</p>
            <button onclick="reiniciarQuiz()" class="btn-reiniciar">🔄 Fazer Quiz Novamente</button>
        </div>
    `;
    
    document.getElementById('quizResultado').style.display = 'block';
    document.querySelector('.quiz-controles').style.display = 'none';
}

function reiniciarQuiz() {
    iniciarQuiz();
}

// CSS adicional para o botão de reiniciar (adicione ao seu style.css)
const cssAdicional = `
    .btn-reiniciar {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 15px;
        transition: transform 0.3s ease;
    }
    
    .btn-reiniciar:hover {
        transform: scale(1.05);
    }
    
    .resultado-content {
        text-align: center;
    }
    
    .resultado-content h3 {
        margin-bottom: 15px;
        font-size: 24px;
    }
    
    .resultado-content p {
        font-size: 18px;
        margin-bottom: 20px;
    }
`;

// Adicionar CSS dinamicamente
const style = document.createElement('style');
style.textContent = cssAdicional;
document.head.appendChild(style);

// Iniciar quiz quando a página carregar
document.addEventListener('DOMContentLoaded', iniciarQuiz);