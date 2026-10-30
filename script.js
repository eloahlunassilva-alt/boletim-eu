// DADOS BRUTOS FICTÍCIOS — 9º ANO
const dadosBoletim = [
  { disciplina: "Língua Portuguesa", tri1: 78, tri2: "8,2", tri3: 8.6, faltas: [2, 2, 1] },
  { disciplina: "Matemática", tri1: 55, tri2: "5,4", tri3: null, faltas: [3, 2, 2] },
  { disciplina: "Ciências", tri1: 84, tri2: 7.9, tri3: "8,3", faltas: [1, 1, 1] },
  { disciplina: "História", tri1: "7,1", tri2: 82, tri3: null, faltas: [1, 2, 1] },
  { disciplina: "Geografia", tri1: 69, tri2: "7,5", tri3: 7.8, faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 88, tri2: 8.4, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Arte", tri1: "9,2", tri2: 87, tri3: 9.0, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 96, tri2: "9,3", tri3: null, faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 91, tri2: 8.9, tri3: "9,4", faltas: [1, 1, 0] },
  { disciplina: "Educação Financeira", tri1: 76, tri2: "7,2", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Rec. Aprend. Matemática", tri1: 58, tri2: "5,9", tri3: 6.2, faltas: [2, 2, 1] },
  { disciplina: "Leitura Rec. Aprend. Lingua Portuguesa", tri1: 72, tri2: "7,6", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 49, tri2: 5.5, tri3: "5,8", faltas: [2, 2, 2] },
  { disciplina: "Literatura Arte e Movimento", tri1: "8,0", tri2: 84, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Práticas Experimentais", tri1: 64, tri2: "6,6", tri3: 7.0, faltas: [1, 1, 1] }
];

// Frequência demonstrativa estática (solicitada para esta etapa)
// Nota: Este percentual é apenas demonstrativo e não é calculado a partir das faltas acumuladas.
const FREQUENCIA_DEMONSTRATIVA = 92;

// Função para converter e normalizar qualquer entrada de nota para a escala de 0 a 10
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Se for string, substitui vírgula por ponto
  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }

  let num = Number(valor);

  // Se não for um número válido, descarta
  if (isNaN(num)) {
    return null;
  }

  // Regra: valores entre 0 e 10 permanecem iguais
  if (num >= 0 && num <= 10) {
    return num;
  }

  // Regra: valores maiores que 10 e menores/iguais a 100 são divididos por 10
  if (num > 10 && num <= 100) {
    return num / 10;
  }

  // Valores fora das regras acima são considerados inválidos
  return null;
}

// Formata o número da nota para exibição na tela (ex: 8.5 vira "8,5")
function formatarNotaParaExibicao(nota) {
  if (nota === null) {
    return "—";
  }
  return nota.toFixed(1).replace(".", ",");
}

// Quando o HTML terminar de carregar, executa a montagem do boletim
document.addEventListener("DOMContentLoaded", () => {
  const tabelaCorpo = document.getElementById("tabela-corpo");

  let somaMediasValidas = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let qtdBomDesempenho = 0;
  let qtdAtencao = 0;

  // Percorre cada uma das 15 disciplinas
  dadosBoletim.forEach((item) => {
    // 1. Normaliza as notas dos três trimestres
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // 2. Calcula a média usando somente notas válidas
    let somaNotasDisc = 0;
    let qtdNotasDisc = 0;

    if (n1 !== null) { somaNotasDisc += n1; qtdNotasDisc++; }
    if (n2 !== null) { somaNotasDisc += n2; qtdNotasDisc++; }
    if (n3 !== null) { somaNotasDisc += n3; qtdNotasDisc++; }

    let mediaDisciplina = null;
    let situacaoText = "Nota ainda não disponível";
    let situacaoClass = "";

    if (qtdNotasDisc > 0) {
      mediaDisciplina = somaNotasDisc / qtdNotasDisc;
      somaMediasValidas += mediaDisciplina;
      qtdDisciplinasComMedia++;

      if (mediaDisciplina >= 6.0) {
        situacaoText = "Bom desempenho";
        situacaoClass = "status-bom";
        qtdBomDesempenho++;
      } else {
        situacaoText = "Atenção";
        situacaoClass = "status-atencao";
        qtdAtencao++;
      }
    }

    // 3. Soma as faltas da disciplina
    const totalFaltasDisciplina = item.faltas.reduce((a, b) => a + b, 0);
    totalFaltasGeral += totalFaltasDisciplina;

    // 4. Cria a linha da tabela (tr)
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><strong>${item.disciplina}</strong></td>
      <td>${formatarNotaParaExibicao(n1)}</td>
      <td>${formatarNotaParaExibicao(n2)}</td>
      <td>${formatarNotaParaExibicao(n3)}</td>
      <td><strong>${formatarNotaParaExibicao(mediaDisciplina)}</strong></td>
      <td>${totalFaltasDisciplina}</td>
      <td class="${situacaoClass}">${situacaoText}</td>
    `;

    tabelaCorpo.appendChild(tr);
  });

  // 5. Preenche os Cards de Resumo na parte superior
  const mediaGeralEl = document.getElementById("media-geral");
  if (qtdDisciplinasComMedia > 0) {
    const mediaGeral = somaMediasValidas / qtdDisciplinasComMedia;
    mediaGeralEl.textContent = mediaGeral.toFixed(1).replace(".", ",");
  } else {
    mediaGeralEl.textContent = "—";
  }

  document.getElementById("total-faltas").textContent = totalFaltasGeral;
  document.getElementById("qtd-bom-desempenho").textContent = qtdBomDesempenho;
  document.getElementById("qtd-atencao").textContent = qtdAtencao;
});