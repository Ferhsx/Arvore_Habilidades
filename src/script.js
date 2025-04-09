//inicio codigo
let pontosDisponiveis = 3;

const pontosDisplay = document.getElementById("pontos");
const nivelDisplay = document.getElementById("nivel");

const personagens = [
    {
      nome: "Kael Ignis",
      cor: "#FF4500",
      ramos: {
        Combate: ["Golpe Flamejante", "Explosão Ígnea", "Lança de Fogo"],
        Investigação: ["Análise de Cinzas", "Visão Térmica", "Rastreamento por Calor"],
        Poder: ["Domínio do Fogo", "Fênix Interior", "Erupção Total"]
      }
    },
    {
      nome: "Lysa Glacius",
      cor: "#00BFFF",
      ramos: {
        Combate: ["Lâmina de Gelo", "Nevasca Cortante", "Encerramento Ártico"],
        Investigação: ["Sentir Vibrações", "Escanear Ambiente", "Mapa de Temperatura"],
        Poder: ["Congelamento Global", "Espinhos de Gelo", "Prisão Congelante"]
      }
    }
  ];

  const conteiner = document.getElementById("arvConteiner");

  