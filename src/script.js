  let pontosDisponiveis = 10;
  let nivel = 1;
  const habilidadesAtivas = new Set();

  
  const pontosDisplay = document.getElementById("pontos");
  const nivelDisplay = document.getElementById("nivel");
  const container = document.getElementById("arvConteiner");
  const teste = document.querySelector('.test');

  pontosDisplay.textContent = pontosDisponiveis;

  function subirNivel() {
    nivel++;
    pontosDisponiveis += 3;
    nivelDisplay.textContent = nivel;
    pontosDisplay.textContent = pontosDisponiveis;
  }

  function adicionarHabilidade(idDoconteiner){
    const container = document.getElementById(idDoconteiner);
    const Input = document.createElement("input");
    Input.type = "text";
    Input.placeholder = "Nova Habilidade";
    container.appendChild(Input);
    container.appendChild(document.createElement("br"));
  }

  function criarPersonagem () {
    const nome = document.getElementById("nomeInput").value || "Sem Nome";
    const cor = document.getElementById("corInput").value;

    const combate = Array.from(document.querySelectorAll('#combateInputs input')).map(input => input.value);
    const investigacao = Array.from(document.querySelectorAll('#investigacaoInputs input')).map(input => input.value);
    const poder = Array.from(document.querySelectorAll('#poderInputs input')).map(input => input.value);


    const personagem = {
      nome: nome,
      cor: cor,
      ramos: {
        Combate: combate,
        Investigação: investigacao,
        Poder: poder
      }
    };


    renderizarPersonagem(personagem);
    teste.style.display = 'none';
    
  }

  function renderizarPersonagem(personagem) {
    container.innerHTML = "";
    habilidadesAtivas.clear();

    const tree = document.createElement("div");
    tree.style.borderLeft = `5px solid ${personagem.cor}`;
    tree.style.paddingLeft = "10px";

    const title = document.createElement("h2");
    title.textContent = personagem.nome;
    tree.appendChild(title);

    const branchesWrapper = document.createElement("div");
    branchesWrapper.classList.add("branches-wrapper");

    for (const ramo in personagem.ramos) {
      const branch = document.createElement("div");
      branch.classList.add("branch");

      const label = document.createElement("h3");
      label.textContent = ramo;
      branch.appendChild(label);

      personagem.ramos[ramo].forEach((hab, index) => {
        const skill = document.createElement("div");
        skill.classList.add("skill");
        skill.textContent = hab || "(vazio)";
        skill.dataset.nome = hab;
        skill.dataset.index = index;
        skill.dataset.ramo = ramo;

        skill.onclick = () => {
          const nome = skill.dataset.nome;
          const index = parseInt(skill.dataset.index);
          const ramoAtual = skill.dataset.ramo;

          if (!nome || skill.classList.contains("active") || pontosDisponiveis <= 0) return;

          if (index > 0) {
            const anterior = personagem.ramos[ramoAtual][index - 1];
            if (!habilidadesAtivas.has(anterior)) return;
          }

          const ramosAtivos = new Set();
          habilidadesAtivas.forEach((habNome) => {
            for (const ramo in personagem.ramos) {
              if (personagem.ramos[ramo].includes(habNome)) {
                ramosAtivos.add(ramo);
              }
            }
          });

          const ramosDiferentes = Array.from(ramosAtivos).filter(r => r !== ramoAtual).length;
          const custo = 1 + ramosDiferentes;

          if (pontosDisponiveis < custo) return;

          skill.classList.add("active");
          habilidadesAtivas.add(nome);
          pontosDisponiveis -= custo;
          pontosDisplay.textContent = pontosDisponiveis;
        };

        branch.appendChild(skill);
      });

      branchesWrapper.appendChild(branch);
    }

    tree.appendChild(branchesWrapper);
    container.appendChild(tree);
  }