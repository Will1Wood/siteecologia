// JavaScript para o formulário de sugestões
document.addEventListener('DOMContentLoaded', function() {
    const formSugestoes = document.getElementById('formSugestoes');
    const mensagemSucesso = document.getElementById('mensagemSucesso');
    const campoMensagem = document.getElementById('mensagem');

    // Permitir espaços normalmente no campo de mensagem
    campoMensagem.addEventListener('keydown', function(e) {
        // Permitir todas as teclas normalmente, incluindo espaço
        if (e.key === ' ') {
            e.preventDefault(); // Previne comportamento padrão se necessário
            // Insere um espaço normalmente
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = this.value.substring(0, start) + ' ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 1;
        }
    });

    // Validar formulário antes do envio
    formSugestoes.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validações básicas
        const tipo = document.getElementById('tipo').value;
        const mensagem = campoMensagem.value.trim();
        
        if (!tipo) {
            alert('Por favor, selecione o tipo de mensagem.');
            return;
        }
        
        if (!mensagem) {
            alert('Por favor, digite sua mensagem.');
            campoMensagem.focus();
            return;
        }
        
        if (mensagem.length < 10) {
            alert('Por favor, escreva uma mensagem mais detalhada (mínimo 10 caracteres).');
            campoMensagem.focus();
            return;
        }
        
        // Simular envio (substitua por sua lógica real)
        enviarFormulario();
    });

    function enviarFormulario() {
        // Aqui você pode adicionar:
        // 1. Envio para um servidor
        // 2. Envio por email
        // 3. Salvar em um banco de dados
        // 4. Integração com Google Forms
        
        // Por enquanto, vamos apenas mostrar a mensagem de sucesso
        mostrarMensagemSucesso();
        
        // Limpar formulário
        formSugestoes.reset();
    }

    function mostrarMensagemSucesso() {
        mensagemSucesso.style.display = 'block';
        
        // Rolagem suave para a mensagem
        mensagemSucesso.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // Esconder mensagem após 5 segundos
        setTimeout(() => {
            mensagemSucesso.style.display = 'none';
        }, 5000);
    }

    // Melhorar a experiência do usuário
    const campoTipo = document.getElementById('tipo');
    campoTipo.addEventListener('change', function() {
        const mensagemPlaceholder = document.getElementById('mensagem');
        
        switch(this.value) {
            case 'sugestao':
                mensagemPlaceholder.placeholder = 'Conte sua sugestão para melhorar nosso projeto...';
                break;
            case 'ponto-coleta':
                mensagemPlaceholder.placeholder = 'Informe o endereço completo do ponto de coleta, horário de funcionamento e quais equipamentos aceitam...';
                break;
            case 'duvida':
                mensagemPlaceholder.placeholder = 'Escreva sua dúvida sobre reciclagem de eletrônicos...';
                break;
            case 'outro':
                mensagemPlaceholder.placeholder = 'Escreva sua mensagem...';
                break;
            default:
                mensagemPlaceholder.placeholder = 'Conte sua sugestão, indique o endereço do ponto de coleta ou tire sua dúvida...';
        }
    });
});