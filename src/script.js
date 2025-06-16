// ========================================
// Variáveis Globais para Ficha e Árvore
// ========================================
let pontosDisponiveis = 10;
let nivel = 1;
let personagemAtual = null;  // Armazena o personagem atual
let selectedNodes = new Set(); // Guarda IDs dos nós selecionados
let cy;                      // Instância do Cytoscape
let skillTreeData = null;    // Dados da árvore de habilidades

// Referências a Elementos do DOM
const pontosDisplay = document.getElementById("pontos");
const nivelDisplay = document.getElementById("nivel");
const fichaContainer = document.getElementById("characterSheetDisplay");
const arvoreContainer = document.getElementById('skillTreeContainer');
const testeDiv = document.querySelector('.test');

// Inicializar display de pontos
if (pontosDisplay) pontosDisplay.textContent = pontosDisponiveis;

// ========================================
// Funções da Ficha do Personagem
// ========================================

function subirNivel() {
    nivel++;
    pontosDisponiveis += 3;
    if (nivelDisplay) nivelDisplay.textContent = nivel;
    if (pontosDisplay) pontosDisplay.textContent = pontosDisponiveis;
    if (cy) updateAvailableNodes();
}

function adicionarHabilidade(idContainer) {
    const container = document.getElementById(idContainer);
    if (!container) return;
    const input = document.createElement("input");
    input.type = "text";
    input.classList.add("bonito");
    input.placeholder = "Nova Habilidade";
    container.appendChild(input);
    container.appendChild(document.createElement("br"));
}

function criarPersonagem() {
    const nome = document.getElementById("nomeInput").value || "Sem Nome";
    const cor = document.getElementById("corInput").value;

    const combate = Array.from(document.querySelectorAll('#combateInputs input')).map(input => input.value).filter(v => v);
    const investigacao = Array.from(document.querySelectorAll('#investigacaoInputs input')).map(input => input.value).filter(v => v);
    const poder = Array.from(document.querySelectorAll('#poderInputs input')).map(input => input.value).filter(v => v);

    const atributoContainer = document.getElementById('atributo');
    const atrbInputs = atributoContainer.querySelectorAll('input');
    const atributosBase = {
        Forca: parseInt(atrbInputs[0].value) || 0,
        Resis: parseInt(atrbInputs[1].value) || 0,
        Int: parseInt(atrbInputs[2].value) || 0,
        Dest: parseInt(atrbInputs[3].value) || 0,
        Etter: parseInt(atrbInputs[4].value) || 0,
    };

    personagemAtual = {
        nome: nome,
        cor: cor,
        atributosBase: atributosBase,
        atributosFinais: {...atributosBase},
        ramos: {
            Combate: combate,
            Investigação: investigacao,
            Poder: poder
        },
        habilidadesArvore: []
    };

    renderizarPersonagem(personagemAtual);
    if (testeDiv) testeDiv.style.display = 'none';
    calcularEAtualizarBonus(personagemAtual);
}

function renderizarPersonagem(personagem) {
    if (!fichaContainer) return;
    fichaContainer.innerHTML = "";

    const ficha = document.createElement("div");
    ficha.style.borderLeft = `5px solid ${personagem.cor}`;
    ficha.style.paddingLeft = "10px";
    ficha.classList.add("ficha-renderizada");

    // Nome do Personagem
    const title = document.createElement("h2");
    title.textContent = personagem.nome;
    ficha.appendChild(title);

    // Atributos
    const atributosTitulo = document.createElement("h4");
    atributosTitulo.textContent = "Atributos";
    ficha.appendChild(atributosTitulo);

    const atributosLista = document.createElement("ul");
    atributosLista.id = "atributosListaDisplay";
    for (const chave in personagem.atributosFinais) {
        const item = document.createElement("li");
        item.id = `atributoDisplay_${chave}`;
        item.textContent = `${chave}: ${personagem.atributosFinais[chave]}`;
        atributosLista.appendChild(item);
    }
    ficha.appendChild(atributosLista);

    // Habilidades da Árvore (agrupadas por tipo)
    if (personagem.habilidadesArvore?.length > 0) {
        const habilidadesPorTipo = {};
        personagem.habilidadesArvore.forEach(habilidade => {
            if (!habilidadesPorTipo[habilidade.tipo]) {
                habilidadesPorTipo[habilidade.tipo] = [];
            }
            habilidadesPorTipo[habilidade.tipo].push(habilidade);
        });

        for (const tipo in habilidadesPorTipo) {
            const tituloTipo = document.createElement("h3");
            tituloTipo.textContent = tipo;
            ficha.appendChild(tituloTipo);

            const listaHabilidades = document.createElement("ul");
            listaHabilidades.style.listStyleType = "none";
            listaHabilidades.style.paddingLeft = "0";

            habilidadesPorTipo[tipo].forEach(habilidade => {
                const item = document.createElement("li");
                item.style.marginBottom = "8px";
                
                const nomeHab = document.createElement("strong");
                nomeHab.textContent = habilidade.nome;
                item.appendChild(nomeHab);
                
                if (habilidade.descricao) {
                    const descricao = document.createElement("p");
                    descricao.textContent = habilidade.descricao;
                    descricao.style.margin = "4px 0 0 0";
                    descricao.style.fontSize = "0.9em";
                    descricao.style.color = "#ddd";
                    item.appendChild(descricao);
                }
                
                listaHabilidades.appendChild(item);
            });

            ficha.appendChild(listaHabilidades);
        }
    }

    // Habilidades Manuais
    const ramoWrapper = document.createElement("div");
    ramoWrapper.classList.add("ficha-wrapper");
    for (const ramoNome in personagem.ramos) {
        if (personagem.ramos[ramoNome].length > 0) {
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
// Funções da Árvore de Habilidades
// ========================================

function capitalizeFirstLetter(string) {
    if (!string) return string;
    const mappings = {
        'agua': 'Água',
        'fogo': 'Fogo',
        'terra': 'Terra',
        'vento': 'Vento',
        'raios': 'Raios',
        'zenidio': 'Zenidio'
    };
    return mappings[string.toLowerCase()] || string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

async function desenharArvore(raceName) {
    if (!arvoreContainer) return;
    
    const jsonPath = `/src/personagens/${capitalizeFirstLetter(raceName)}/${raceName.toLowerCase()}.json`;

    try {
        const response = await fetch(jsonPath);
        if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);
        
        skillTreeData = await response.json();
        if (!skillTreeData.nodes || !skillTreeData.connections) {
            throw new Error("Estrutura do JSON inválida");
        }

        // Formatar para Cytoscape
        const elements = [];
        skillTreeData.nodes.forEach(node => {
            elements.push({
                group: 'nodes',
                data: { id: node.id, ...node },
                position: node.position 
            });
        });

        skillTreeData.connections.forEach(conn => {
            if (skillTreeData.nodes.some(n => n.id === conn.from) && 
                skillTreeData.nodes.some(n => n.id === conn.to)) {
                elements.push({
                    group: 'edges',
                    data: { id: `${conn.from}_${conn.to}`, source: conn.from, target: conn.to }
                });
            }
        });

        // Inicializar Cytoscape
        cy = cytoscape({
            container: arvoreContainer,
            elements: elements,
            style: [
                { selector: 'node', style: { 
                    'background-color': '#666', 
                    'label': 'data(name)', 
                    'color': '#fff', 
                    'text-valign': 'center', 
                    'text-halign': 'center', 
                    'font-size': '10px', 
                    'text-wrap': 'wrap', 
                    'text-max-width': '60px', 
                    'width': '50px', 
                    'height': '50px' 
                }},
                { selector: 'edge', style: { 
                    'width': 2, 
                    'line-color': '#ccc', 
                    'target-arrow-shape': 'none', 
                    'curve-style': 'bezier' 
                }},
                { selector: 'node[type="start"]', style: { 
                    'background-color': '#f0ad4e', 
                    'width': '70px', 
                    'height': '70px' 
                }},
                { selector: '.selected', style: { 
                    'background-color': 'rgb(0, 120, 215)', 
                    'border-width': 3, 
                    'border-color': '#00ffff' 
                }},
                { selector: '.available', style: { 
                    'border-width': 3, 
                    'border-color': '#39ff14', 
                    'opacity': 0.7 
                }}
            ],
            layout: { name: 'preset' },
            zoom: 1,
            minZoom: 0.4,
            maxZoom: 2.5,
            zoomingEnabled: true,
            panningEnabled: true
        });

        // Event Listeners
        cy.on('tap', 'node', (event) => handleNodeClick(event.target.id()));

        // Tooltips
        cy.nodes().forEach(node => {
            let tooltip = null;
            node.on('mouseover', (event) => {
                const nodeData = event.target.data();
                tooltip = document.createElement('div');
                tooltip.id = 'skill-tooltip';
                tooltip.innerHTML = `
                    <strong>${nodeData.name || 'Nó sem nome'}</strong><br>
                    Custo: ${nodeData.cost || 0}<br>
                    <hr style="margin: 2px 0;">
                    ${nodeData.description || 'Sem descrição.'}
                `;
                tooltip.style.position = 'absolute';
                tooltip.style.left = `${event.originalEvent.clientX}px`;
                tooltip.style.top = `${event.originalEvent.clientY}px`;
                tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                tooltip.style.color = 'white';
                tooltip.style.padding = '8px';
                tooltip.style.borderRadius = '4px';
                tooltip.style.maxWidth = '200px';
                tooltip.style.zIndex = '1000';
                document.body.appendChild(tooltip);
            });

            node.on('mouseout', () => {
                if (tooltip) tooltip.remove();
            });
        });

        cy.on('pan zoom', () => {
            const tooltip = document.getElementById('skill-tooltip');
            if (tooltip) tooltip.remove();
        });

        // Estado Inicial
        activateInitialNodes();
        updateAvailableNodes();
        calcularEAtualizarBonus(getCurrentCharacterData());

    } catch (error) {
        console.error("Falha ao desenhar a árvore:", error);
        arvoreContainer.innerHTML = `<p style='color:red;'>Erro ao carregar a árvore: ${error.message}</p>`;
    }
}

function handleNodeClick(nodeId) {
    if (!cy || !skillTreeData) return;
    
    const node = cy.getElementById(nodeId);
    const nodeData = skillTreeData.nodes.find(n => n.id === nodeId);
    if (!nodeData || nodeData.type === 'start') return;

    if (!selectedNodes.has(nodeId)) {
        // Lógica de seleção
        if (isNodeAvailable(nodeId)) {
            selectedNodes.add(nodeId);
            node.addClass('selected');
            node.removeClass('available');
            pontosDisponiveis -= nodeData.cost;
            if (pontosDisplay) pontosDisplay.textContent = pontosDisponiveis;

            const personagem = getCurrentCharacterData();
            if (nodeData.type === 'ability') {
                personagem.habilidadesArvore.push({
                    nome: nodeData.name,
                    descricao: nodeData.description || "Sem descrição.",
                    tipo: nodeData.tipo || "Geral"
                });
            }

            updateAvailableNodes();
            calcularEAtualizarBonus(personagem);
            renderizarPersonagem(personagem);
        } else {
            alert("Não é possível selecionar este nó. Verifique os pré-requisitos e pontos.");
        }
    } else {
        // Lógica de desseleção (opcional)
        // Implemente se quiser permitir reembolsar pontos
    }
}

function activateInitialNodes() {
    if (!cy || !skillTreeData) return;
    selectedNodes.clear();
    cy.nodes().removeClass('selected');

    skillTreeData.nodes.forEach(nodeData => {
        if (nodeData.type === 'start') {
            selectedNodes.add(nodeData.id);
            const node = cy.getElementById(nodeData.id);
            if (node) node.addClass('selected');
        }
    });
}

function updateAvailableNodes() {
    if (!cy || !skillTreeData) return;
    cy.nodes().removeClass('available');

    cy.nodes().not('.selected').forEach(node => {
        if (isNodePotentiallyAvailable(node.id())) {
            node.addClass('available');
        }
    });
}

function isNodePotentiallyAvailable(nodeId) {
    const nodeData = skillTreeData.nodes.find(n => n.id === nodeId);
    if (!nodeData || nodeData.type === 'start' || selectedNodes.has(nodeId)) {
        return false;
    }

    if (pontosDisponiveis < nodeData.cost) {
        return false;
    }

    // Verificar pré-requisitos
    if (nodeData.requiresLevel && nivel < nodeData.requiresLevel) {
        return false;
    }

    if (nodeData.requiresNodes && !nodeData.requiresNodes.every(id => selectedNodes.has(id))) {
        return false;
    }

    // Verificar conexões
    const nodeElement = cy.getElementById(nodeId);
    if (!nodeElement) return false;

    let isConnectedToSelected = false;
    nodeElement.connectedEdges().forEach(edge => {
        if ((selectedNodes.has(edge.source().id()) && edge.target().id() === nodeId) || 
            (selectedNodes.has(edge.target().id()) && edge.source().id() === nodeId)) {
            isConnectedToSelected = true;
        }
    });
    
    return isConnectedToSelected;
}

function isNodeAvailable(nodeId) {
    if (!cy) return false;
    const node = cy.getElementById(nodeId);
    return node && node.hasClass('available');
}

function calcularEAtualizarBonus(personagem) {
    if (!skillTreeData || !personagem) return;

    let atributosCalculados = JSON.parse(JSON.stringify(personagem.atributosBase));

    selectedNodes.forEach(nodeId => {
        const nodeData = skillTreeData.nodes.find(n => n.id === nodeId);
        
        if (nodeData && nodeData.type === 'passive_bonus' && nodeData.attribute && nodeData.value) {
            if (atributosCalculados.hasOwnProperty(nodeData.attribute)) {
                atributosCalculados[nodeData.attribute] += nodeData.value;
            }
        }
    });

    personagem.atributosFinais = atributosCalculados;
    
    if (fichaContainer && fichaContainer.querySelector('.ficha-renderizada')) {
        for (const chave in personagem.atributosFinais) {
            const itemDisplay = document.getElementById(`atributoDisplay_${chave}`);
            if (itemDisplay) {
                itemDisplay.textContent = `${chave}: ${personagem.atributosFinais[chave]}`;
            }
        }
    }
    return personagem;
}

function getCurrentCharacterData() {
    if (personagemAtual) return personagemAtual;
    
    // Fallback caso personagemAtual não exista
    return {
        nome: document.getElementById("nomeInput")?.value || "Sem Nome",
        cor: document.getElementById("corInput")?.value || '#ffffff',
        atributosBase: { Forca: 0, Resis: 0, Int: 0, Dest: 0, Etter: 0 },
        atributosFinais: { Forca: 0, Resis: 0, Int: 0, Dest: 0, Etter: 0 },
        ramos: {},
        habilidadesArvore: []
    };
}

// ========================================
// Funções de Persistência (Opcional)
// ========================================

function saveCharacterState() {
    if (!personagemAtual) return;
    
    const state = {
        personagem: personagemAtual,
        selectedNodes: Array.from(selectedNodes),
        pontosDisponiveis: pontosDisponiveis,
        nivel: nivel
    };
    
    localStorage.setItem('characterState', JSON.stringify(state));
    console.log("Estado do personagem salvo.");
}

function loadCharacterState() {
    const savedState = localStorage.getItem('characterState');
    if (!savedState) return false;
    
    try {
        const state = JSON.parse(savedState);
        
        personagemAtual = state.personagem;
        selectedNodes = new Set(state.selectedNodes);
        pontosDisponiveis = state.pontosDisponiveis;
        nivel = state.nivel;
        
        if (pontosDisplay) pontosDisplay.textContent = pontosDisponiveis;
        if (nivelDisplay) nivelDisplay.textContent = nivel;
        
        renderizarPersonagem(personagemAtual);
        console.log("Estado do personagem carregado.");
        return true;
    } catch (error) {
        console.error("Erro ao carregar estado:", error);
        return false;
    }
}