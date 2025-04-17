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

function adicionarHabilidade(idDoconteiner) {
  const container = document.getElementById(idDoconteiner);
  const Input = document.createElement("input");
  Input.type = "text";
  Input.placeholder = "Nova Habilidade";
  container.appendChild(Input);
  container.appendChild(document.createElement("br"));
}

function criarPersonagem() {
  const nome = document.getElementById("nomeInput").value || "Sem Nome";
  const cor = document.getElementById("corInput").value;

  const combate = Array.from(document.querySelectorAll('#combateInputs input')).map(input => input.value);
  const investigacao = Array.from(document.querySelectorAll('#investigacaoInputs input')).map(input => input.value);
  const poder = Array.from(document.querySelectorAll('#poderInputs input')).map(input => input.value);

  const atributoContainer = document.getElementById('atributo');
  const atrbInputs = atributoContainer.querySelectorAll('input');
  const atrb = {
    forca: parseInt(atrbInputs[0].value) || 0,
    resis: parseInt(atrbInputs[1].value) || 0,
    int: parseInt(atrbInputs[2].value) || 0,
    dest: parseInt(atrbInputs[3].value) || 0,
    etter: parseInt(atrbInputs[4].value) || 0,
  };

  if (atrbInputs.value > 5){
    alert("Valor de atributo ilegal")
  }

  const personagem = {
    nome: nome,
    cor: cor,
    atributos: atrb,
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
  container.innerHTML = ""; // Limpa o conteúdo antigo

  const ficha = document.createElement("div");
  ficha.style.borderLeft = `5px solid ${personagem.cor}`;
  ficha.style.paddingLeft = "10px";

  const title = document.createElement("h2");
  title.textContent = personagem.nome;
  ficha.appendChild(title);


  const atributosTitulo = document.createElement("h4");
  atributosTitulo.textContent = "Atributos";
  ficha.appendChild(atributosTitulo);

  const atributosLista = document.createElement("ul");
  for (const chave in personagem.atributos) {
    const item = document.createElement("li");
    item.textContent = `${chave}: ${personagem.atributos[chave]}`;
    atributosLista.appendChild(item);
  }
  ficha.appendChild(atributosLista);

  const ramoWrapper = document.createElement("div");
  ramoWrapper.classList.add("ficha-wrapper");

  for (const ramo in personagem.ramos) {
    const ramoDiv = document.createElement("div");
    ramoDiv.classList.add("ramo");

    const ramoTitulo = document.createElement("h3");
    ramoTitulo.textContent = ramo;
    ramoDiv.appendChild(ramoTitulo);

    ramoWrapper.appendChild(ramoDiv);
  

  personagem.ramos[ramo].forEach((habilidade) => {
    const textoHab = document.createElement("p");
    textoHab.textContent = habilidade || "(vazio)";
    textoHab.classList.add("habilidade-texto");
    ramoDiv.appendChild(textoHab);
  });

    ramoWrapper.appendChild(ramoDiv);
  }

  ficha.appendChild(ramoWrapper);
  container.appendChild(ficha);
}

//começo da arvore de habilidade

