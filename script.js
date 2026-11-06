// CONFIGURAÇÃO FIXA DO ALUNO
const CONFIG_ALUNO = {
  turma: "9B",
  numeroChamada: 11,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// DADOS BRUTOS FICTÍCIOS — 9º ANO (BASE LOCAL)
const dadosBoletimLocal = [
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

// VARIÁVEIS DE SESSÃO (EM MEMÓRIA)
let pinSessao = "";
let dadosAtuais = [];
let emEdicao = false;

// Função para converter e normalizar qualquer entrada de nota antiga para a escala de 0 a 10
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }
  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }
  let num = Number(valor);
  if (isNaN(num)) {
    return null;
  }
  if (num >= 0 && num <= 10) {
    return num;
  }
  if (num > 10 && num <= 100) {
    return num / 10;
  }
  return null;
}

// Formata o número da nota para exibição na tela (ex: 8.5 vira "8,5")
function formatarNotaParaExibicao(nota) {
  if (nota === null || nota === undefined) {
    return "—";
  }
  return Number(nota).toFixed(1).replace(".", ",");
}

// Validação de nota editada pelo estudante (0 a 10, ponto/vírgula, ou vazio)
function validarNotaEditada(valorStr) {
  if (!valorStr || valorStr.trim() === "") {
    return { valido: true, valor: null };
  }
  const strNormalizada = valorStr.trim().replace(",", ".");
  const num = Number(strNormalizada);
  if (isNaN(num) || num < 0 || num > 10) {
    return { valido: false, valor: null };
  }
  return { valido: true, valor: num };
}

// Validação de faltas editadas pelo estudante (inteiro >= 0)
function validarFaltaEditada(valorStr) {
  if (valorStr === "" || valorStr === null || valorStr === undefined) {
    return { valido: false, valor: null };
  }
  const str = String(valorStr).trim();
  if (!/^\d+$/.test(str)) {
    return { valido: false, valor: null };
  }
  const num = parseInt(str, 10);
  if (isNaN(num) || num < 0) {
    return { valido: false, valor: null };
  }
  return { valido: true, valor: num };
}

// Renderização da tabela e cards de resumo
function renderizarBoletim() {
  const tabelaCorpo = document.getElementById("tabela-corpo");
  tabelaCorpo.innerHTML = "";

  let somaMediasValidas = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let qtdBomDesempenho = 0;
  let qtdAtencao = 0;

  dadosAtuais.forEach((item, idx) => {
    let n1, n2, n3, faltasArr;

    if (item.faltas !== undefined) {
      n1 = normalizarNota(item.tri1);
      n2 = normalizarNota(item.tri2);
      n3 = normalizarNota(item.tri3);
      faltasArr = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    } else {
      n1 = item.nota_tri1 !== undefined ? item.nota_tri1 : null;
      n2 = item.nota_tri2 !== undefined ? item.nota_tri2 : null;
      n3 = item.nota_tri3 !== undefined ? item.nota_tri3 : null;
      faltasArr = [
        item.falta_tri1 || 0,
        item.falta_tri2 || 0,
        item.falta_tri3 || 0
      ];
    }

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

    const totalFaltasDisciplina = faltasArr.reduce((a, b) => Number(a) + Number(b), 0);
    totalFaltasGeral += totalFaltasDisciplina;

    const tr = document.createElement("tr");

    if (!emEdicao) {
      const tdNome = document.createElement("td");
      const strongNome = document.createElement("strong");
      strongNome.textContent = item.disciplina || item.nome;
      tdNome.appendChild(strongNome);

      const tdTri1 = document.createElement("td");
      tdTri1.textContent = formatarNotaParaExibicao(n1);

      const tdTri2 = document.createElement("td");
      tdTri2.textContent = formatarNotaParaExibicao(n2);

      const tdTri3 = document.createElement("td");
      tdTri3.textContent = formatarNotaParaExibicao(n3);

      const tdMedia = document.createElement("td");
      const strongMedia = document.createElement("strong");
      strongMedia.textContent = formatarNotaParaExibicao(mediaDisciplina);
      tdMedia.appendChild(strongMedia);

      const tdFaltas = document.createElement("td");
      tdFaltas.textContent = totalFaltasDisciplina;

      const tdSit = document.createElement("td");
      tdSit.className = situacaoClass;
      tdSit.textContent = situacaoText;

      tr.appendChild(tdNome);
      tr.appendChild(tdTri1);
      tr.appendChild(tdTri2);
      tr.appendChild(tdTri3);
      tr.appendChild(tdMedia);
      tr.appendChild(tdFaltas);
      tr.appendChild(tdSit);
    } else {
      const tdNome = document.createElement("td");
      const strongNome = document.createElement("strong");
      strongNome.textContent = item.disciplina || item.nome;
      tdNome.appendChild(strongNome);

      const val1 = n1 !== null ? String(n1).replace(".", ",") : "";
      const val2 = n2 !== null ? String(n2).replace(".", ",") : "";
      const val3 = n3 !== null ? String(n3).replace(".", ",") : "";

      const tdTri1 = document.createElement("td");
      tdTri1.innerHTML = `<input type="text" class="input-edicao input-n1" data-idx="${idx}" value="${val1}">`;

      const tdTri2 = document.createElement("td");
      tdTri2.innerHTML = `<input type="text" class="input-edicao input-n2" data-idx="${idx}" value="${val2}">`;

      const tdTri3 = document.createElement("td");
      tdTri3.innerHTML = `<input type="text" class="input-edicao input-n3" data-idx="${idx}" value="${val3}">`;

      const tdMedia = document.createElement("td");
      tdMedia.textContent = formatarNotaParaExibicao(mediaDisciplina);

      const tdFaltas = document.createElement("td");
      tdFaltas.innerHTML = `
        <div style="display:flex; gap:4px; align-items:center;">
          <input type="text" title="Faltas 1º Tri" class="input-edicao input-f1" data-idx="${idx}" value="${faltasArr[0]}">
          <input type="text" title="Faltas 2º Tri" class="input-edicao input-f2" data-idx="${idx}" value="${faltasArr[1]}">
          <input type="text" title="Faltas 3º Tri" class="input-edicao input-f3" data-idx="${idx}" value="${faltasArr[2]}">
        </div>
      `;

      const tdSit = document.createElement("td");
      tdSit.className = situacaoClass;
      tdSit.textContent = situacaoText;

      tr.appendChild(tdNome);
      tr.appendChild(tdTri1);
      tr.appendChild(tdTri2);
      tr.appendChild(tdTri3);
      tr.appendChild(tdMedia);
      tr.appendChild(tdFaltas);
      tr.appendChild(tdSit);
    }

    tabelaCorpo.appendChild(tr);
  });

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
}

// Inicialização de eventos da página
document.addEventListener("DOMContentLoaded", () => {
  const btnEntrar = document.getElementById("btn-entrar");
  const inputPin = document.getElementById("input-pin");
  const msgLogin = document.getElementById("msg-login");

  const areaLogin = document.getElementById("area-login");
  const conteudoBoletim = document.getElementById("conteudo-boletim");

  const btnAlterarDados = document.getElementById("btn-alterar-dados");
  const areaBotoesEdicao = document.getElementById("area-botoes-edicao");
  const btnSalvar = document.getElementById("btn-salvar");
  const btnCancelar = document.getElementById("btn-cancelar");
  const msgBoletim = document.getElementById("msg-boletim");

  // Ação de Login (POST abrir)
  async function realizarLogin() {
    const pinDigitado = inputPin.value.trim();
    if (!pinDigitado) {
      msgLogin.textContent = "Por favor, digite seu PIN.";
      msgLogin.className = "msg-status msg-erro";
      return;
    }

    msgLogin.textContent = "Conectando...";
    msgLogin.className = "msg-status msg-sucesso";
    btnEntrar.disabled = true;

    try {
      const response = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turma: CONFIG_ALUNO.turma,
          numero_chamada: CONFIG_ALUNO.numeroChamada,
          pin: pinDigitado
        })
      });

      if (response.status === 401) {
        msgLogin.textContent = "Turma, chamada ou PIN inválidos.";
        msgLogin.className = "msg-status msg-erro";
        btnEntrar.disabled = false;
        return;
      }

      if (response.status === 429) {
        msgLogin.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
        msgLogin.className = "msg-status msg-erro";
        btnEntrar.disabled = false;
        return;
      }

      if (!response.ok) {
        msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
        msgLogin.className = "msg-status msg-erro";
        btnEntrar.disabled = false;
        return;
      }

      const resData = await response.json();

      // Guarda PIN em memória da sessão e limpa o input
      pinSessao = pinDigitado;
      inputPin.value = "";

      // Trata dados recebidos da API vs dados locais
      if (resData && resData.dados && Array.isArray(resData.dados.disciplinas) && resData.dados.disciplinas.length > 0) {
        dadosAtuais = resData.dados.disciplinas;
      } else {
        dadosAtuais = dadosBoletimLocal;
      }

      areaLogin.style.display = "none";
      conteudoBoletim.style.display = "block";
      renderizarBoletim();

    } catch (err) {
      msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
      msgLogin.className = "msg-status msg-erro";
      btnEntrar.disabled = false;
    }
  }

  btnEntrar.addEventListener("click", realizarLogin);
  inputPin.addEventListener("keyup", (e) => {
    if (e.key === "Enter") realizarLogin();
  });

  // Modo de Edição
  btnAlterarDados.addEventListener("click", () => {
    emEdicao = true;
    btnAlterarDados.style.display = "none";
    areaBotoesEdicao.style.display = "block";
    msgBoletim.textContent = "";
    renderizarBoletim();
  });

  btnCancelar.addEventListener("click", () => {
    emEdicao = false;
    btnAlterarDados.style.display = "inline-block";
    areaBotoesEdicao.style.display = "none";
    msgBoletim.textContent = "";
    renderizarBoletim();
  });

  // Ação de Salvar (PUT salvar)
  btnSalvar.addEventListener("click", async () => {
    msgBoletim.textContent = "";
    let houverErro = false;

    // Limpa destaque de erros anteriores
    document.querySelectorAll(".input-edicao").forEach(inp => inp.classList.remove("input-invalido"));

    const novasDisciplinas = [];

    for (let i = 0; i < dadosAtuais.length; i++) {
      const discOriginal = dadosAtuais[i];
      const nomeDisc = discOriginal.disciplina || discOriginal.nome;

      const inN1 = document.querySelector(`.input-n1[data-idx="${i}"]`);
      const inN2 = document.querySelector(`.input-n2[data-idx="${i}"]`);
      const inN3 = document.querySelector(`.input-n3[data-idx="${i}"]`);

      const inF1 = document.querySelector(`.input-f1[data-idx="${i}"]`);
      const inF2 = document.querySelector(`.input-f2[data-idx="${i}"]`);
      const inF3 = document.querySelector(`.input-f3[data-idx="${i}"]`);

      const rN1 = validarNotaEditada(inN1.value);
      if (!rN1.valido) { inN1.classList.add("input-invalido"); houverErro = true; }

      const rN2 = validarNotaEditada(inN2.value);
      if (!rN2.valido) { inN2.classList.add("input-invalido"); houverErro = true; }

      const rN3 = validarNotaEditada(inN3.value);
      if (!rN3.valido) { inN3.classList.add("input-invalido"); houverErro = true; }

      const rF1 = validarFaltaEditada(inF1.value);
      if (!rF1.valido) { inF1.classList.add("input-invalido"); houverErro = true; }

      const rF2 = validarFaltaEditada(inF2.value);
      if (!rF2.valido) { inF2.classList.add("input-invalido"); houverErro = true; }

      const rF3 = validarFaltaEditada(inF3.value);
      if (!rF3.valido) { inF3.classList.add("input-invalido"); houverErro = true; }

      if (!houverErro) {
        novasDisciplinas.push({
          nome: nomeDisc,
          nota_tri1: rN1.valor,
          nota_tri2: rN2.valor,
          nota_tri3: rN3.valor,
          falta_tri1: rF1.valor,
          falta_tri2: rF2.valor,
          falta_tri3: rF3.valor
        });
      }
    }

    if (houverErro) {
      msgBoletim.textContent = "Verifique os campos destacados em vermelho.";
      msgBoletim.className = "msg-status msg-erro";
      return;
    }

    msgBoletim.textContent = "Salvando...";
    msgBoletim.className = "msg-status msg-sucesso";
    btnSalvar.disabled = true;

    try {
      const response = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turma: CONFIG_ALUNO.turma,
          numero_chamada: CONFIG_ALUNO.numeroChamada,
          pin: pinSessao,
          dados: {
            disciplinas: novasDisciplinas
          }
        })
      });

      if (!response.ok) {
        msgBoletim.textContent = "Não foi possível salvar as alterações. Tente novamente.";
        msgBoletim.className = "msg-status msg-erro";
        btnSalvar.disabled = false;
        return;
      }

      dadosAtuais = novasDisciplinas;
      emEdicao = false;
      btnSalvar.disabled = false;

      btnAlterarDados.style.display = "inline-block";
      areaBotoesEdicao.style.display = "none";
      msgBoletim.textContent = "Dados salvos com sucesso.";
      msgBoletim.className = "msg-status msg-sucesso";

      renderizarBoletim();

    } catch (err) {
      msgBoletim.textContent = "Não foi possível salvar as alterações. Tente novamente.";
      msgBoletim.className = "msg-status msg-erro";
      btnSalvar.disabled = false;
    }
  });
});