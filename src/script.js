// ========================================
// Variáveis Globais para Ficha e Árvore
// ========================================
let pontosDisponiveis = 10;
let nivel = 1;

// Variáveis Globais ESPECÍFICAS da árvore
const selectedNodes = new Set(); // Guarda IDs dos nós selecionados
let cy;                        // Instância do Cytoscape (será definida em desenharArvore)
let skillTreeData = null;      // Dados carregados do JSON da árvore

// Referências a Elementos do DOM (Obter uma vez)
const pontosDisplay = document.getElementById("pontos");
const nivelDisplay = document.getElementById("nivel"); // Você tinha isso no código, mas não o elemento no HTML, adicione se precisar
const fichaContainer = document.getElementById("characterSheetDisplay"); // Container para a ficha
const arvoreContainer = document.getElementById('skillTreeContainer');  // Container para a árvore
const testeDiv = document.querySelector('.test'); // Container da seção "Criar Personagem"

// Inicializar display de pontos (se o elemento existir)
if (pontosDisplay) {
    pontosDisplay.textContent = pontosDisponiveis;
} else {
    console.warn("Elemento com id 'pontos' não encontrado.");
}


// ========================================
// Funções da Ficha (Já existentes)
// ========================================

function subirNivel() {
    nivel++;
    pontosDisponiveis += 3; // Ou a lógica de ganho de pontos por nível que preferir
    if (nivelDisplay) nivelDisplay.textContent = nivel;
    if (pontosDisplay) pontosDisplay.textContent = pontosDisponiveis;

    // Importante: Atualizar nós disponíveis na árvore após ganhar pontos
    if (cy) {
        updateAvailableNodes();
    }
}

function adicionarHabilidade(idDoconteiner) {
    const container = document.getElementById(idDoconteiner);
    if (!container) return;
    const Input = document.createElement("input");
    Input.type = "text";
    Input.classList.add("bonito"); // Adicionar a classe para estilo
    Input.placeholder = "Nova Habilidade";
    container.appendChild(Input);
    container.appendChild(document.createElement("br"));
}

function criarPersonagem() {
    // Seu código para ler os inputs e criar o objeto 'personagem'
    const nome = document.getElementById("nomeInput").value || "Sem Nome";
    const cor = document.getElementById("corInput").value;

    const combate = Array.from(document.querySelectorAll('#combateInputs input')).map(input => input.value).filter(v => v); // Pega só os preenchidos
    const investigacao = Array.from(document.querySelectorAll('#investigacaoInputs input')).map(input => input.value).filter(v => v);
    const poder = Array.from(document.querySelectorAll('#poderInputs input')).map(input => input.value).filter(v => v);

    const atributoContainer = document.getElementById('atributo');
    const atrbInputs = atributoContainer.querySelectorAll('input');
    const atributosBase = { // Armazena os valores base inseridos
        Forca: parseInt(atrbInputs[0].value) || 0,
        Resis: parseInt(atrbInputs[1].value) || 0,
        Int: parseInt(atrbInputs[2].value) || 0,
        Dest: parseInt(atrbInputs[3].value) || 0,
        Etter: parseInt(atrbInputs[4].value) || 0,
    };

    // Você tinha uma validação estranha aqui (atrbInputs.value), removi. 
    // Adicione validações por input se necessário.

    const personagem = {
        nome: nome,
        cor: cor,
        atributosBase: atributosBase, // Salva os atributos base
        atributosFinais: { ...atributosBase }, // Inicializa os finais (serão modificados pela árvore)
        ramos: {
            Combate: combate,
            Investigação: investigacao,
            Poder: poder
        }
    };

    renderizarPersonagem(personagem);
    if(testeDiv) testeDiv.style.display = 'none'; // Esconde form de criação
    // Calcula e aplica bônus da árvore assim que o personagem é criado/renderizado
    calcularEAtualizarBonus(personagem); 
}

function renderizarPersonagem(personagem) {
    if (!fichaContainer) {
        console.error("Container da ficha ('characterSheetDisplay') não encontrado!");
        return;
    }
    fichaContainer.innerHTML = ""; // Limpa o conteúdo antigo

    const ficha = document.createElement("div");
    ficha.style.borderLeft = `5px solid ${personagem.cor}`;
    ficha.style.paddingLeft = "10px";
    ficha.classList.add("ficha-renderizada"); // Classe para estilização opcional

    const title = document.createElement("h2");
    title.textContent = personagem.nome;
    ficha.appendChild(title);

    const atributosTitulo = document.createElement("h4");
    atributosTitulo.textContent = "Atributos";
    ficha.appendChild(atributosTitulo);

    // Exibe os ATRIBUTOS FINAIS (base + bônus da árvore)
    const atributosLista = document.createElement("ul");
    atributosLista.id = "atributosListaDisplay"; // ID para facilitar a atualização
    for (const chave in personagem.atributosFinais) {
        const item = document.createElement("li");
        // Adiciona ID específico para cada atributo para fácil atualização
        item.id = `atributoDisplay_${chave}`; 
        item.textContent = `${chave}: ${personagem.atributosFinais[chave]}`; 
        atributosLista.appendChild(item);
    }
    ficha.appendChild(atributosLista);

    // Renderiza os ramos de habilidades manuais
    const ramoWrapper = document.createElement("div");
    ramoWrapper.classList.add("ficha-wrapper");
    for (const ramoNome in personagem.ramos) {
        if (personagem.ramos[ramoNome].length > 0) { // Só mostra ramos com habilidades
            const ramoDiv = document.createElement("div");
            ramoDiv.classList.add("ramo");

            const ramoTitulo = document.createElement("h3");
            ramoTitulo.textContent = ramoNome;
            ramoDiv.appendChild(ramoTitulo);

            personagem.ramos[ramoNome].forEach((habilidade) => {
                const textoHab = document.createElement("p");
                textoHab.textContent = habilidade;
                textoHab.classList.add("habilidade-texto");
                ramoDiv.appendChild(textoHab);
            });
            ramoWrapper.appendChild(ramoDiv);
        }
    }
    ficha.appendChild(ramoWrapper);
    
    fichaContainer.appendChild(ficha);
}


// ========================================
// Funções da Árvore de Habilidades (Cytoscape)
// ========================================

// Função Auxiliar para Capitalizar
function capitalizeFirstLetter(string) {
    if (!string) return string;
    if (string.toLowerCase() === 'agua') return 'Água';
    if (string.toLowerCase() === 'fogo') return 'Fogo';
    if (string.toLowerCase() === 'terra') return 'Terra';
    if (string.toLowerCase() === 'vento') return 'Vento';
    if (string.toLowerCase() === 'raios') return 'Raios'; // Exemplo
    if (string.toLowerCase() === 'zenidio') return 'Zenidio';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// Função Principal para Desenhar a Árvore
async function desenharArvore(raceName) {
    // Usa a variável global 'arvoreContainer'
    if (!arvoreContainer) {
        console.error("Container da árvore ('skillTreeContainer') não encontrado no DOM!");
        return;
    }
    // Constrói o caminho do JSON dinamicamente
    const jsonPath = `/src/personagens/${capitalizeFirstLetter(raceName)}/${raceName.toLowerCase()}.json`;
    arvoreContainer.innerHTML = '<p>Carregando árvore...</p>'; // Feedback visual

    try {
        // 1. Carregar Dados
        const response = await fetch(jsonPath);
        if (!response.ok) {
            throw new Error(`Erro ${response.status} ao carregar ${jsonPath}: ${response.statusText}`);
        }
        // Armazena os dados na variável global 'skillTreeData'
        skillTreeData = await response.json(); 
        console.log(`Dados da árvore para ${raceName} carregados:`, skillTreeData);

        // Verifica se os dados têm a estrutura esperada
        if (!skillTreeData.nodes || !skillTreeData.connections) {
           throw new Error("Estrutura do JSON inválida. Faltando 'nodes' ou 'connections'.")
        }

        // 2. Formatar para Cytoscape
        const elements = [];
        skillTreeData.nodes.forEach(node => {
            elements.push({
                group: 'nodes',
                data: { id: node.id, ...node }, // Passa todas as propriedades do JSON para 'data'
                position: node.position 
            });
        });
        skillTreeData.connections.forEach(conn => {
             // Verifica se os nós de origem e destino existem antes de criar a aresta
             const sourceExists = skillTreeData.nodes.some(n => n.id === conn.from);
             const targetExists = skillTreeData.nodes.some(n => n.id === conn.to);
             if (sourceExists && targetExists) {
                 elements.push({
                     group: 'edges',
                     data: { id: `${conn.from}_${conn.to}`, source: conn.from, target: conn.to }
                 });
             } else {
                console.warn(`Conexão inválida ignorada: ${conn.from} -> ${conn.to}. Nó não encontrado.`);
             }
        });

        // 3. Inicializar Cytoscape (usa a variável global 'cy')
        cy = cytoscape({
            container: arvoreContainer,
            elements: elements,
            style: [ /* Seus estilos definidos anteriormente aqui */ 
                 { selector: 'node', style: { /* Estilos nó padrão */ 'background-color': '#666', 'label': 'data(name)', 'color': '#fff', 'text-valign': 'center', 'text-halign': 'center', 'font-size': '10px', 'text-wrap': 'wrap', 'text-max-width': '60px', 'width': '50px', 'height': '50px' } },
                 { selector: 'edge', style: { /* Estilos aresta */ 'width': 2, 'line-color': '#ccc', 'target-arrow-shape': 'none', 'curve-style': 'bezier' } },
                 { selector: 'node[type="start"]', style: { /* Estilo nó inicial */ 'background-color': '#f0ad4e', 'width': '70px', 'height': '70px' } },
                 { selector: '.selected', style: { /* Estilo selecionado */ 'background-color': 'rgb(0, 120, 215)', 'border-width': 3, 'border-color': '#00ffff' } },
                 { selector: '.available', style: { /* Estilo disponível */ 'border-width': 3, 'border-color': '#39ff14', 'opacity': 0.7 } } // Adicionei opacidade para diferenciar
             ],
            layout: { name: 'preset' },
             // Opções de zoom e pan
            zoom: 1, pan: { x: 0, y: 0 }, minZoom: 0.4, maxZoom: 2.5, 
            zoomingEnabled: true, userZoomingEnabled: true,
            panningEnabled: true, userPanningEnabled: true, 
            boxSelectionEnabled: false
        });

        // 4. Adicionar Event Listeners do Cytoscape
        cy.on('tap', 'node', (event) => {
            const nodeId = event.target.id();
            console.log(`Nó clicado: ${nodeId}`);
            handleNodeClick(nodeId); // Chama a função de LÓGICA (definida abaixo)
        });

        // Tooltips simples (pode ser melhorado com bibliotecas)
        cy.nodes().forEach(node => {
           let tooltip = null; // Para referência
           node.on('mouseover', (event) => {
                const nodeData = event.target.data();
                // Cria um div para o tooltip
                tooltip = document.createElement('div');
                tooltip.id = 'skill-tooltip'; // Para estilização CSS
                tooltip.innerHTML = `
                    <strong>${nodeData.name || 'Nó sem nome'}</strong><br>
                    Custo: ${nodeData.cost || 0}<br>
                    <hr style="margin: 2px 0;">
                    ${nodeData.description || 'Sem descrição.'}
                `;
                // Posiciona o tooltip perto do cursor
                tooltip.style.position = 'absolute';
                tooltip.style.left = `${event.originalEvent.clientX + 15}px`;
                tooltip.style.top = `${event.originalEvent.clientY + 15}px`;
                tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                tooltip.style.color = 'white';
                tooltip.style.padding = '8px';
                tooltip.style.borderRadius = '4px';
                tooltip.style.fontSize = '12px';
                tooltip.style.maxWidth = '200px';
                tooltip.style.pointerEvents = 'none'; // Para não interferir com o mouse
                tooltip.style.zIndex = '1000'; // Para ficar na frente
                document.body.appendChild(tooltip);
            });
           node.on('mouseout', () => {
               if (tooltip) {
                   tooltip.remove();
                   tooltip = null;
               }
            });
            // Remove tooltip se mover o nó também
             node.on('position', () => {
                if (tooltip) {
                    tooltip.remove();
                    tooltip = null;
                }
             });
        });

        // Remove tooltip se o pan/zoom ocorrer
        cy.on('pan zoom', () => {
            const existingTooltip = document.getElementById('skill-tooltip');
            if (existingTooltip) {
                existingTooltip.remove();
            }
        });


        // 5. Inicializar Estado Visual
        activateInitialNodes(); // Marca o nó inicial
        // TODO: Carregar nós previamente selecionados (de localStorage ou backend)
        // loadSelectedNodes(); // Exemplo de função a ser criada
        updateAvailableNodes(); // Atualiza quais nós estão disponíveis
        
        // Calcular bônus iniciais (pode ser só do nó 'start' se ele der bônus)
        calcularEAtualizarBonus(getCurrentCharacterData()); // Passa os dados atuais da ficha

        console.log("Árvore Cytoscape inicializada e pronta.");

    } catch (error) {
        console.error("Falha ao desenhar a árvore:", error);
        arvoreContainer.innerHTML = `<p style='color:red;'>Erro ao carregar/processar dados da árvore (${jsonPath}). Verifique a estrutura do JSON e o console (F12).</p>`;
    }
}

// Função que é chamada quando um nó é clicado
function handleNodeClick(nodeId) {
    // Verifica se a árvore e os dados estão carregados
    if (!cy || !skillTreeData) {
         console.warn("Cytoscape ou dados da árvore não estão prontos.");
         return;
    }
    
    const node = cy.getElementById(nodeId);
    const nodeData = skillTreeData.nodes.find(n => n.id === nodeId);

    if (!nodeData || nodeData.type === 'start') return; // Não faz nada no nó inicial

    // --- Lógica de SELEÇÃO ---
    if (!selectedNodes.has(nodeId)) {
        if (isNodeAvailable(nodeId)) { // Verifica se o nó está marcado como disponível
            // Selecionar
            selectedNodes.add(nodeId);
            node.addClass('selected');
            node.removeClass('available'); // Remove o destaque de disponível
            pontosDisponiveis -= nodeData.cost;
            if (pontosDisplay) pontosDisplay.textContent = pontosDisponiveis;
            
            updateAvailableNodes(); // Re-calcula disponíveis após a mudança
            calcularEAtualizarBonus(getCurrentCharacterData()); // Atualiza bônus na ficha
            console.log(`Nó ${nodeId} selecionado. Pontos: ${pontosDisponiveis}`);
            // TODO: Salvar estado (localStorage ou backend)
            // saveSelectedNodes();
        } else {
            alert("Não é possível selecionar este nó. Verifique os pré-requisitos e pontos.");
        }
    }
    // --- Lógica de DESSELEÇÃO (Implementar se necessário) ---
    // else { 
    //     console.log(`Tentando deselecionar ${nodeId}`);
    //     // Verificar dependências aqui antes de permitir deselecionar
    //     // ... lógica complexa ...
    //     // if (isSafeToDeselect(nodeId)) { ... }
    // }
}

// Função para marcar o(s) nó(s) inicial(is) como ativo(s)
function activateInitialNodes() {
    if (!cy || !skillTreeData) return;
    selectedNodes.clear(); // Limpa seleções anteriores
    cy.nodes().removeClass('selected'); // Garante que nenhum nó comece como selecionado visualmente

    skillTreeData.nodes.forEach(nodeData => {
        if (nodeData.type === 'start') {
           selectedNodes.add(nodeData.id); // Adiciona ao conjunto lógico
           const node = cy.getElementById(nodeData.id);
           if (node) node.addClass('selected'); // Adiciona classe visual
        }
    });
     console.log("Nós iniciais ativados:", Array.from(selectedNodes));
}

// Atualiza a classe '.available' nos nós que podem ser selecionados
function updateAvailableNodes() {
    if (!cy || !skillTreeData) return;

    cy.nodes().removeClass('available'); // Limpa marcação anterior

    cy.nodes().not('.selected').forEach(node => {
        const nodeId = node.id();
         if (isNodePotentiallyAvailable(nodeId)) { // Verifica conexões e custo
             node.addClass('available');
         }
    });
    console.log("Nós disponíveis atualizados.");
}

// Verifica se um nó específico pode ser selecionado (conectado a um já selecionado e tem pontos)
function isNodePotentiallyAvailable(nodeId) {
    const nodeData = skillTreeData.nodes.find(n => n.id === nodeId);
    if (!nodeData || nodeData.type === 'start' || selectedNodes.has(nodeId)) {
        return false; // Ignora inicial, já selecionados
    }

    if (pontosDisponiveis < nodeData.cost) {
        return false; // Pontos insuficientes
    }

    // Verifica se está conectado a algum nó JÁ SELECIONADO
    const nodeElement = cy.getElementById(nodeId);
    if (!nodeElement) return false;

    let isConnectedToSelected = false;
    // Verifica tanto arestas que SAEM dos selecionados para ele, quanto arestas que CHEGAM nele vindo de selecionados
    nodeElement.connectedEdges().forEach(edge => {
        if (selectedNodes.has(edge.source().id()) || selectedNodes.has(edge.target().id())) {
             // Se a outra ponta da aresta está no conjunto selectedNodes E essa ponta não é ele mesmo (só por garantia)
            if( (selectedNodes.has(edge.source().id()) && edge.target().id() === nodeId) || 
                (selectedNodes.has(edge.target().id()) && edge.source().id() === nodeId) ){
                 isConnectedToSelected = true;       
            }
        }
    });
    
    // TODO: Adicionar verificação de pré-requisitos (nível, outros nós específicos, atributos)
    // Ex: if (nodeData.requiresLevel && nivel < nodeData.requiresLevel) return false;
    
    return isConnectedToSelected;
}

// Wrapper simples para verificar se o nó tem a classe 'available' (usado em handleNodeClick)
function isNodeAvailable(nodeId) {
    if (!cy) return false;
    const node = cy.getElementById(nodeId);
    return node && node.hasClass('available');
}

// Calcula os bônus totais da árvore e atualiza a ficha
function calcularEAtualizarBonus(personagem) {
    if (!skillTreeData || !personagem) {
        console.warn("Dados da árvore ou do personagem não disponíveis para cálculo de bônus.");
        return; // Precisa dos dados da árvore e da ficha base
    }

    // 1. Começa com os atributos base do personagem
    // Cria uma cópia profunda para não modificar o objeto base original acidentalmente
    let atributosCalculados = JSON.parse(JSON.stringify(personagem.atributosBase));

    // 2. Itera sobre os nós selecionados (obtidos da variável global selectedNodes)
    selectedNodes.forEach(nodeId => {
        const nodeData = skillTreeData.nodes.find(n => n.id === nodeId);
        
        // Aplica bônus passivos de atributos (ex: +5 Força)
        if (nodeData && nodeData.type === 'passive_bonus' && nodeData.attribute && nodeData.value) {
           if (atributosCalculados.hasOwnProperty(nodeData.attribute)) {
              atributosCalculados[nodeData.attribute] += nodeData.value;
           } else {
              console.warn(`Atributo "${nodeData.attribute}" do nó ${nodeId} não encontrado nos atributos base.`);
           }
        }
        
        // TODO: Adicionar lógica para outros tipos de bônus
        // Ex: Bônus percentuais, habilidades ativas/passivas especiais, etc.
        // if (nodeData.type === 'percentage_bonus') { ... }

    });

    // 3. Atualiza o objeto 'personagem' com os atributos finais calculados
    personagem.atributosFinais = atributosCalculados;
    
    // 4. Atualiza a exibição na interface (DOM)
    if (fichaContainer && fichaContainer.querySelector('.ficha-renderizada')) { // Verifica se a ficha já foi renderizada
        for (const chave in personagem.atributosFinais) {
            const itemDisplay = document.getElementById(`atributoDisplay_${chave}`);
            if (itemDisplay) {
                itemDisplay.textContent = `${chave}: ${personagem.atributosFinais[chave]}`;
            }
        }
         console.log("Atributos na ficha atualizados:", personagem.atributosFinais);
    } else {
        // Se a ficha não foi renderizada ainda (ex: na carga inicial), renderizar agora
         // renderizarPersonagem(personagem); 
         console.log("Cálculo inicial de bônus feito:", personagem.atributosFinais, ". A ficha será renderizada/atualizada em breve.");
    }
     return personagem; // Retorna o objeto personagem atualizado (útil para salvar)
}

// Função auxiliar para pegar os dados do personagem "atual" (simplificado)
// Numa aplicação real, você teria uma forma melhor de gerenciar isso
function getCurrentCharacterData() {
     if (!fichaContainer || !fichaContainer.querySelector('.ficha-renderizada')) {
         console.warn("Tentando obter dados do personagem, mas a ficha não está renderizada.");
         // Retorna um objeto base mínimo se nada foi criado ainda
          return {
            nome: document.getElementById("nomeInput")?.value || "Sem Nome",
            cor: document.getElementById("corInput")?.value || '#ffffff',
             atributosBase: { Forca: 0, Resis: 0, Int: 0, Dest: 0, Etter: 0 },
             atributosFinais: { Forca: 0, Resis: 0, Int: 0, Dest: 0, Etter: 0 },
             ramos: {}
          };
     }
     // Tenta reconstruir o objeto personagem a partir do DOM (isso é frágil!)
     // É MELHOR manter o objeto 'personagem' em uma variável global após 'criarPersonagem'
     // Ex: let personagemAtual = null; // global
     // Na função criarPersonagem(): personagemAtual = personagem;
     // E então, aqui retornar: return personagemAtual;
     
     // Reconstrução simples (PODE FALHAR se a estrutura do DOM mudar):
     const nome = fichaContainer.querySelector('h2')?.textContent || 'Desconhecido';
     const cor = fichaContainer.querySelector('.ficha-renderizada')?.style.borderLeftColor || '#ffffff';
     const atributosBase = {}; // Difícil obter os 'base' depois de renderizar os 'finais'
     const atributosFinais = {};
      fichaContainer.querySelectorAll('#atributosListaDisplay li').forEach(li => {
          const parts = li.textContent.split(': ');
          if(parts.length === 2) {
             atributosFinais[parts[0]] = parseInt(parts[1]) || 0; 
          }
      });
     
      // Assume que os 'base' são os 'finais' menos os bônus (ISSO É PROBLEMÁTICO!)
       // A melhor solução é guardar o objeto 'personagem' criado.
     
     return { 
         nome: nome, cor: cor, 
         atributosBase: { ...atributosFinais }, // NÃO É O REAL BASE!
         atributosFinais: atributosFinais,
         // Ramos não são facilmente recuperados aqui
     };
}


// TODO: Funções para salvar/carregar estado (selectedNodes, pontos, nivel)
// Exemplo usando localStorage:
/*
function saveSelectedNodes() {
    localStorage.setItem('selectedNodes_agua', JSON.stringify(Array.from(selectedNodes)));
    localStorage.setItem('pontosDisponiveis_agua', pontosDisponiveis);
    localStorage.setItem('nivel_agua', nivel);
    console.log("Estado salvo no localStorage.");
}

function loadSelectedNodes() {
    const savedNodes = localStorage.getItem('selectedNodes_agua');
    const savedPontos = localStorage.getItem('pontosDisponiveis_agua');
    const savedNivel = localStorage.getItem('nivel_agua');

    if (savedNodes) {
        const nodeIds = JSON.parse(savedNodes);
        selectedNodes.clear();
        nodeIds.forEach(id => selectedNodes.add(id));
        // Atualiza visualmente os nós carregados
        if (cy) {
            cy.nodes().removeClass('selected');
            selectedNodes.forEach(id => {
                const node = cy.getElementById(id);
                if (node) node.addClass('selected');
            });
        }
    }
    if (savedPontos !== null) {
        pontosDisponiveis = parseInt(savedPontos, 10);
        if (pontosDisplay) pontosDisplay.textContent = pontosDisponiveis;
    }
     if (savedNivel !== null) {
        nivel = parseInt(savedNivel, 10);
        // if (nivelDisplay) nivelDisplay.textContent = nivel; // Atualizar display se existir
    }
    console.log("Estado carregado do localStorage:", {nivel, pontosDisponiveis, nodes: Array.from(selectedNodes)});
}

// Chamar loadSelectedNodes() talvez no início, ou após desenhar a árvore pela primeira vez.
*/