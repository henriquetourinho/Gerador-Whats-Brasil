document.addEventListener('DOMContentLoaded', () => {

    // --- Seleção de Elementos do DOM ---
    const body = document.body;
    const linkForm = document.getElementById('link-form');
    // Inputs do formulário
    const numeroInput = document.getElementById('numero');
    const mensagemInput = document.getElementById('mensagem');
    const templateCategorySelect = document.getElementById('template-category');
    const templateListDiv = document.getElementById('template-list');
    // Botões de ação
    const abrirWppBtn = document.getElementById('abrir-wpp-btn');
    const limparBtn = document.getElementById('limpar-btn');
    const copiarBtn = document.getElementById('copiar-btn');
    // Área de resultados
    const resultArea = document.getElementById('result-area');
    const linkGeradoA = document.getElementById('link-gerado');
    const qrCodeContainer = document.getElementById('qrcode-container');
    const numeroErrorSpan = document.getElementById('numero-error');
    // Preview
    const previewText = document.getElementById('preview-text');
    const previewTimestamp = document.getElementById('preview-timestamp');
    // Tema
    const themeToggle = document.getElementById('theme-toggle');
    // Controles de personalização do QR Code
    const qrDotColorInput = document.getElementById('qr-dot-color');
    const qrBgColorInput = document.getElementById('qr-bg-color');
    const qrLogoUpload = document.getElementById('qr-logo-upload');
    const qrDownloadBtn = document.getElementById('qr-download-btn');
    const qrDownloadFormat = document.getElementById('qr-download-format');
    // [NOVO] Elementos do Histórico
    const historyListContainer = document.getElementById('history-list-container');
    const historyItemTemplate = document.getElementById('history-item-template');

    // Barra de Formatação
    const formatBoldBtn = document.getElementById('format-bold');
    const formatItalicBtn = document.getElementById('format-italic');
    const formatStrikeBtn = document.getElementById('format-strike');

    // --- Variáveis Globais ---
    let qrCodeInstance = null;
    const HISTORY_KEY = 'geradorWhatsHistory';
    const MAX_HISTORY_ITEMS = 10;

    // --- DADOS DOS TEMPLATES ---
    const templates = {
        pessoal: [
            { title: 'Convite de Evento', text: 'Oi! Estou organizando [EVENTO] no dia [DATA] e gostaria muito que você viesse. Conto com sua presença!' },
            { title: 'Lembrete Amigável', text: 'Oi, passando só para lembrar do nosso compromisso amanhã às [HORA]. Até lá!' },
            { title: 'Networking', text: 'Olá, [NOME]! Foi um prazer conhecer você no [EVENTO/LOCAL]. Adoraria manter contato e conversar mais sobre [ASSUNTO].' },
            { title: 'Agradecimento', text: 'Oi, [NOME]! Só queria agradecer pela [AJUDA/PRESENTE/DICA]. Significou muito para mim!' }
        ],
        empreendedor: [
            { title: 'Orçamento', text: 'Olá! Agradeço o seu contato. Para preparar um orçamento detalhado, poderia me fornecer mais algumas informações sobre o projeto?' },
            { title: 'Follow-up de Venda', text: 'Olá, [NOME DO CLIENTE]! Gostaria de saber se você teve a oportunidade de analisar a proposta que enviei. Fico à disposição.' },
            { title: 'Pós-Serviço', text: 'Olá! Como está sendo sua experiência com o serviço que prestei? Seu feedback é muito importante para mim.' },
            { title: 'Promoção Especial', text: 'Olá, cliente! Tenho uma oferta especial de [PRODUTO/SERVIÇO] para você esta semana. Vamos conversar?' }
        ],
        empresas: [
            { title: 'Boas-vindas ao Cliente', text: 'Olá, [NOME DO CLIENTE]! Seja bem-vindo(a) à [NOME DA EMPRESA]. Estamos felizes em ter você conosco. Como podemos ajudar?' },
            { title: 'Suporte Técnico', text: 'Olá! Recebemos sua solicitação de suporte. Nossa equipe já está analisando e entrará em contato em breve. Protocolo: [NÚMERO].' },
            { title: 'Pesquisa de Satisfação', text: 'Olá! Gostaríamos de saber como está sendo sua experiência com nosso produto/serviço. Seu feedback é muito importante para nós!' },
            { title: 'Lançamento', text: 'Temos uma novidade incrível! Conheça o novo [PRODUTO/SERVIÇO] da [NOME DA EMPRESA] e veja como ele pode transformar o seu dia a dia.' }
        ]
    };

    // --- INICIALIZAÇÃO DA BIBLIOTECA DE TELEFONE (INTL-TEL-INPUT) ---
    const iti = window.intlTelInput(numeroInput, {
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/19.2.16/js/utils.js",
        initialCountry: "br",
        separateDialCode: true,
    });
    
    const clipboardIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3z"/></svg>';
    copiarBtn.innerHTML = clipboardIconSVG;

    // --- Funções ---

    const parseMarkdown = (text) => {
        return text
            .replace(/\*(.*?)\*/g, '<b>$1</b>')
            .replace(/_(.*?)_/g, '<i>$1</i>')
            .replace(/~(.*?)~/g, '<s>$1</s>');
    };

    const updatePreview = () => {
        const text = mensagemInput.value;
        previewText.innerHTML = parseMarkdown(text) || "Sua mensagem aparecerá aqui...";
        
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        previewTimestamp.textContent = `${hours}:${minutes}`;
    };

    const applyFormat = (char) => {
        const start = mensagemInput.selectionStart;
        const end = mensagemInput.selectionEnd;
        const text = mensagemInput.value;
        const selectedText = text.substring(start, end);

        if (selectedText) {
            const newText = text.substring(0, start) + char + selectedText + char + text.substring(end);
            mensagemInput.value = newText;
            mensagemInput.focus();
            mensagemInput.setSelectionRange(start + char.length, end + char.length);
            updatePreview();
        }
    };

    const gerarUrl = (number, message) => {
        const numeroLimpo = number.replace(/\D/g, '');
        return `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(message)}`;
    };

    const renderTemplates = (category) => {
        templateListDiv.innerHTML = ''; 
        if (templates[category]) {
            templates[category].forEach(template => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'template-item';
                button.textContent = template.title;
                button.dataset.text = template.text;
                templateListDiv.appendChild(button);
            });
        }
    };
    
    const gerarLinkEQRCode = () => {
        if (!iti.isValidNumber()) {
            numeroInput.classList.add('invalid');
            numeroErrorSpan.textContent = 'O número de telefone parece inválido. Verifique o DDI e o número.';
            numeroErrorSpan.style.display = 'block';
            numeroInput.focus();
            return;
        }
        numeroInput.classList.remove('invalid');
        numeroErrorSpan.style.display = 'none';

        const url = gerarUrl(iti.getNumber(), mensagemInput.value);
        
        resultArea.style.display = 'flex';
        linkGeradoA.href = url;
        linkGeradoA.textContent = url.replace('https://', '');

        qrCodeContainer.innerHTML = '';

        const isDarkMode = body.getAttribute('data-theme') === 'dark';
        qrDotColorInput.value = isDarkMode ? "#EAEAEA" : "#111B21";
        qrBgColorInput.value = isDarkMode ? "#1E1E1E" : "#FFFFFF";
        
        qrCodeInstance = new QRCodeStyling({
            width: 200, height: 200, data: url, margin: 0,
            dotsOptions: { color: qrDotColorInput.value, type: "rounded" },
            backgroundOptions: { color: qrBgColorInput.value },
            cornersSquareOptions: { type: "extra-rounded" },
            cornersDotOptions: { type: "dot" }
        });

        qrCodeInstance.append(qrCodeContainer);
        saveToHistory({ number: iti.getNumber(), message: mensagemInput.value, timestamp: Date.now() });
    };

    const copiarTextoFallback = (text) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            return true;
        } catch (err) {
            console.error('Falha ao copiar com o método fallback:', err);
            return false;
        } finally {
            document.body.removeChild(textArea);
        }
    };

    const copiarTexto = (text, buttonToUpdate) => {
        const originalIcon = buttonToUpdate.innerHTML;
        const doCopy = (copyFn, textToCopy) => {
            const success = copyFn(textToCopy);
            if(success) {
                buttonToUpdate.innerHTML = '✔️';
                setTimeout(() => { buttonToUpdate.innerHTML = originalIcon; }, 2000);
            } else {
                alert('Não foi possível copiar o link.');
            }
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                buttonToUpdate.innerHTML = '✔️';
                setTimeout(() => { buttonToUpdate.innerHTML = originalIcon; }, 2000);
            }).catch(() => {
                doCopy(copiarTextoFallback, text);
            });
        } else {
            doCopy(copiarTextoFallback, text);
        }
    };

    const applyTheme = (theme) => {
        body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        if (qrCodeInstance) {
            const isDarkMode = theme === 'dark';
            const newDotColor = isDarkMode ? "#EAEAEA" : "#111B21";
            const newBgColor = isDarkMode ? "#1E1E1E" : "#FFFFFF";
            qrDotColorInput.value = newDotColor;
            qrBgColorInput.value = newBgColor;
            qrCodeInstance.update({
                dotsOptions: { color: newDotColor },
                backgroundOptions: { color: newBgColor }
            });
        }
    };

    // --- [NOVO] Funções do Histórico ---
    const getHistory = () => JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];

    const saveToHistory = (newItem) => {
        let history = getHistory();
        history.unshift(newItem); // Adiciona no início
        if (history.length > MAX_HISTORY_ITEMS) {
            history.pop(); // Remove o mais antigo
        }
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        loadHistory();
    };

    const deleteFromHistory = (timestamp) => {
        let history = getHistory();
        history = history.filter(item => item.timestamp !== timestamp);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        loadHistory();
    };

    const loadHistory = () => {
        historyListContainer.innerHTML = '';
        const history = getHistory();

        if (history.length === 0) {
            historyListContainer.innerHTML = '<p class="history-empty-message">Nenhum link foi gerado ainda.</p>';
            return;
        }

        history.forEach(item => {
            const historyItemNode = historyItemTemplate.content.cloneNode(true);
            const itemDiv = historyItemNode.querySelector('.history-item');
            
            itemDiv.querySelector('.history-item-number').textContent = item.number;
            itemDiv.querySelector('.history-item-message').textContent = item.message || '(Sem mensagem)';

            // Botão Reusar
            itemDiv.querySelector('.history-reuse-btn').addEventListener('click', () => {
                numeroInput.value = item.number.replace(`+${iti.getSelectedCountryData().dialCode}`, '');
                iti.setNumber(item.number);
                mensagemInput.value = item.message;
                updatePreview();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            // Botão Copiar
            itemDiv.querySelector('.history-copy-btn').addEventListener('click', (e) => {
                const url = gerarUrl(item.number, item.message);
                copiarTexto(url, e.currentTarget);
            });

            // Botão Apagar
            itemDiv.querySelector('.history-delete-btn').addEventListener('click', () => {
                deleteFromHistory(item.timestamp);
            });

            historyListContainer.appendChild(itemDiv);
        });
    };

    // --- Event Listeners ---
    linkForm.addEventListener('submit', (event) => { 
        event.preventDefault(); 
        gerarLinkEQRCode(); 
    });

    abrirWppBtn.addEventListener('click', () => {
        if(iti.isValidNumber()) {
            const url = gerarUrl(iti.getNumber(), mensagemInput.value);
            window.open(url, '_blank');
        } else {
            numeroInput.classList.add('invalid');
            numeroErrorSpan.textContent = 'Insira um número válido para abrir no WhatsApp.';
            numeroErrorSpan.style.display = 'block';
        }
    });

    limparBtn.addEventListener('click', () => {
        linkForm.reset();
        resultArea.style.display = 'none';
        numeroInput.classList.remove('invalid');
        numeroErrorSpan.style.display = 'none';
        iti.setCountry("br");
        updatePreview();
        qrLogoUpload.value = '';
    });
    
    mensagemInput.addEventListener('input', updatePreview);

    formatBoldBtn.addEventListener('click', () => applyFormat('*'));
    formatItalicBtn.addEventListener('click', () => applyFormat('_'));
    formatStrikeBtn.addEventListener('click', () => applyFormat('~'));

    templateCategorySelect.addEventListener('change', (event) => renderTemplates(event.target.value));

    templateListDiv.addEventListener('click', (event) => {
        if (event.target.classList.contains('template-item')) {
            mensagemInput.value = event.target.dataset.text;
            updatePreview();
            mensagemInput.focus();
        }
    });

    themeToggle.addEventListener('click', () => {
        const newTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    copiarBtn.addEventListener('click', (e) => {
        copiarTexto(linkGeradoA.href, e.currentTarget);
    });

    qrDotColorInput.addEventListener('input', (e) => {
        if (qrCodeInstance) qrCodeInstance.update({ dotsOptions: { color: e.target.value } });
    });

    qrBgColorInput.addEventListener('input', (e) => {
        if (qrCodeInstance) qrCodeInstance.update({ backgroundOptions: { color: e.target.value } });
    });

    qrLogoUpload.addEventListener('change', (e) => {
        if (!qrCodeInstance || !e.target.files || !e.target.files[0]) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            qrCodeInstance.update({ image: event.target.result });
        };
        reader.readAsDataURL(e.target.files[0]);
    });

    qrDownloadBtn.addEventListener('click', () => {
        if (qrCodeInstance) {
            qrCodeInstance.download({
                name: "qrcode-geradorwhats",
                extension: qrDownloadFormat.value
            });
        }
    });

    // --- Inicialização da Página ---
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }

    renderTemplates(templateCategorySelect.value);
    updatePreview();
    loadHistory(); // Carrega o histórico ao iniciar a página
});