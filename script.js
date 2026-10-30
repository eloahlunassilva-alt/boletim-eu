const CONFIG_ALUNO = {
    turma: "9B",
    numeroChamada: 11,
    apiUrl: "https://boletim-api.profbt.com.br"
};

const DADOS_LOCAIS = {
    disciplinas: [
        { nome: "Língua Portuguesa", n1: 8.0, n2: 7.5, n3: 8.5, f1: 1, f2: 0, f3: 2 },
        { nome: "Matemática", n1: 7.0, n2: 6.5, n3: 7.5, f1: 2, f2: 1, f3: 0 },
        { nome: "História", n1: 9.0, n2: 8.5, n3: 9.5, f1: 0, f2: 0, f3: 0 },
        { nome: "Geografia", n1: 8.5, n2: 8.0, n3: 8.0, f1: 1, f2: 1, f3: 1 },
        { nome: "Ciências", n1: 7.5, n2: 8.0, n3: 8.5, f1: 0, f2: 2, f3: 0 },
        { nome: "Inglês", n1: 9.0, n2: 9.5, n3: 9.0, f1: 0, f2: 0, f3: 1 },
        { nome: "Arte", n1: 10.0, n2: 9.5, n3: 10.0, f1: 0, f2: 0, f3: 0 },
        { nome: "Educação Física", n1: 9.5, n2: 9.0, n3: 9.5, f1: 0, f2: 1, f3: 0 }
    ]
};

let sessaoPin = "";
let dadosAtuais = null;

document.addEventListener("DOMContentLoaded", () => {
    inicializarElementos();
});

function inicializarElementos() {
    const formLogin = document.getElementById("form-login");
    const btnAlterar = document.getElementById("btn-alterar");
    const btnCancelar = document.getElementById("btn-cancelar");
    const formEdicao = document.getElementById("form-edicao");

    if (formLogin) {
        formLogin.addEventListener("submit", tratarLogin);
    }
    if (btnAlterar) {
        btnAlterar.addEventListener("click", abrirModalEdicao);
    }
    if (btnCancelar) {
        btnCancelar.addEventListener("click", fecharModalEdicao);
    }
    if (formEdicao) {
        formEdicao.addEventListener("submit", tratarSalvarDados);
    }
}

async function tratarLogin(event) {
    event.preventDefault();
    const pinInput = document.getElementById("pin-input");
    const loginMensagem = document.getElementById("login-mensagem");
    const btnEntrar = document.getElementById("btn-entrar");

    const pinDigitado = pinInput.value.trim();
    if (!pinDigitado) return;

    loginMensagem.className = "mensagem";
    loginMensagem.textContent = "Conectando...";
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
            loginMensagem.className = "mensagem erro";
            loginMensagem.textContent = "Turma, chamada ou PIN inválidos.";
            btnEntrar.disabled = false;
            return;
        }

        if (response.status === 429) {
            loginMensagem.className = "mensagem erro";
            loginMensagem.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
            btnEntrar.disabled = false;
            return;
        }

        if (!response.ok) {
            loginMensagem.className = "mensagem erro";
            loginMensagem.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
            btnEntrar.disabled = false;
            return;
        }

        const resData = await response.json();
        sessaoPin = pinDigitado;
        pinInput.value = "";

        if (resData.dados && resData.dados.disciplinas && resData.dados.disciplinas.length > 0) {
            dadosAtuais = normalizarDados(resData.dados.disciplinas);
        } else {
            dadosAtuais = JSON.parse(JSON.stringify(DADOS_LOCAIS.disciplinas));
        }

        exibirBoletim();
    } catch (error) {
        loginMensagem.className = "mensagem erro";
        loginMensagem.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
        btnEntrar.disabled = false;
    }
}

function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "") return null;
    if (typeof valor === "string") {
        valor = valor.replace(",", ".");
    }
    let num = Number(valor);
    if (isNaN(num)) return null;
    if (num > 10) num = num / 10;
    return num;
}

function normalizarFalta(valor) {
    if (valor === null || valor === undefined || valor === "") return 0;
    let num = parseInt(valor, 10);
    return isNaN(num) || num < 0 ? 0 : num;
}

function normalizarDados(listaDisciplinas) {
    return listaDisciplinas.map(d => ({
        nome: String(d.nome || d.disciplina || "Sem nome"),
        n1: normalizarNota(d.n1),
        n2: normalizarNota(d.n2),
        n3: normalizarNota(d.n3),
        f1: normalizarFalta(d.f1),
        f2: normalizarFalta(d.f2),
        f3: normalizarFalta(d.f3)
    }));
}

function calcularMediaDisciplina(n1, n2, n3) {
    let soma = 0;
    let qtd = 0;
    if (n1 !== null) { soma += n1; qtd++; }
    if (n2 !== null) { soma += n2; qtd++; }
    if (n3 !== null) { soma += n3; qtd++; }
    return qtd > 0 ? soma / qtd : null;
}

function formatarNota(num) {
    return num !== null ? num.toFixed(1).replace(".", ",") : "-";
}

function exibirBoletim() {
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("boletim-section").classList.remove("hidden");
    renderizarTabelaECards();
}

function renderizarTabelaECards() {
    const tbody = document.getElementById("tabela-corpo");
    tbody.innerHTML = "";

    let somaMedias = 0;
    let qtdMedias = 0;
    let totalFaltasGeral = 0;

    dadosAtuais.forEach(d => {
        const media = calcularMediaDisciplina(d.n1, d.n2, d.n3);
        const faltasDisc = d.f1 + d.f2 + d.f3;
        totalFaltasGeral += faltasDisc;

        let sitText = "-";
        let sitClass = "";
        if (media !== null) {
            somaMedias += media;
            qtdMedias++;
            if (media >= 6.0) {
                sitText = "Aprovado";
                sitClass = "status-aprovado";
            } else if (media >= 4.0) {
                sitText = "Recuperação";
                sitClass = "status-recuperacao";
            } else {
                sitText = "Reprovado";
                sitClass = "status-reprovado";
            }
        }

        const tr = document.createElement("tr");

        const tdNome = document.createElement("td");
        tdNome.textContent = d.nome;
        tr.appendChild(tdNome);

        const tdN1 = document.createElement("td");
        tdN1.textContent = formatarNota(d.n1);
        tr.appendChild(tdN1);

        const tdN2 = document.createElement("td");
        tdN2.textContent = formatarNota(d.n2);
        tr.appendChild(tdN2);

        const tdN3 = document.createElement("td");
        tdN3.textContent = formatarNota(d.n3);
        tr.appendChild(tdN3);

        const tdMedia = document.createElement("td");
        tdMedia.textContent = formatarNota(media);
        tr.appendChild(tdMedia);

        const tdFaltas = document.createElement("td");
        tdFaltas.textContent = faltasDisc;
        tr.appendChild(tdFaltas);

        const tdSit = document.createElement("td");
        tdSit.textContent = sitText;
        if (sitClass) tdSit.className = sitClass;
        tr.appendChild(tdSit);

        tbody.appendChild(tr);
    });

    const mediaGeralEl = document.getElementById("media-geral");
    const totalFaltasEl = document.getElementById("total-faltas");
    const situacaoGeralEl = document.getElementById("situacao-geral");

    if (qtdMedias > 0) {
        const mediaGeral = somaMedias / qtdMedias;
        mediaGeralEl.textContent = mediaGeral.toFixed(1).replace(".", ",");
        if (mediaGeral >= 6.0) {
            situacaoGeralEl.textContent = "Aprovado";
            situacaoGeralEl.className = "destaque status-aprovado";
        } else if (mediaGeral >= 4.0) {
            situacaoGeralEl.textContent = "Recuperação";
            situacaoGeralEl.className = "destaque status-recuperacao";
        } else {
            situacaoGeralEl.textContent = "Reprovado";
            situacaoGeralEl.className = "destaque status-reprovado";
        }
    } else {
        mediaGeralEl.textContent = "-";
        situacaoGeralEl.textContent = "-";
        situacaoGeralEl.className = "destaque";
    }

    totalFaltasEl.textContent = totalFaltasGeral;
}

function abrirModalEdicao() {
    const container = document.getElementById("container-campos-edicao");
    const modalMensagem = document.getElementById("modal-mensagem");
    modalMensagem.textContent = "";
    modalMensagem.className = "mensagem";
    container.innerHTML = "";

    dadosAtuais.forEach((d, idx) => {
        const item = document.createElement("div");
        item.className = "edicao-item";

        const h4 = document.createElement("h4");
        h4.textContent = d.nome;
        item.appendChild(h4);

        const grid = document.createElement("div");
        grid.className = "edicao-grid";

        const criarInput = (label, value, field, type) => {
            const wrap = document.createElement("div");
            wrap.className = "form-group";
            const lbl = document.createElement("label");
            lbl.textContent = label;
            const inp = document.createElement("input");
            inp.type = type;
            inp.dataset.idx = idx;
            inp.dataset.field = field;
            inp.value = value !== null && value !== undefined ? String(value).replace(".", ",") : "";
            wrap.appendChild(lbl);
            wrap.appendChild(inp);
            return wrap;
        };

        grid.appendChild(criarInput("1º Trim (Nota)", d.n1, "n1", "text"));
        grid.appendChild(criarInput("2º Trim (Nota)", d.n2, "n2", "text"));
        grid.appendChild(criarInput("3º Trim (Nota)", d.n3, "n3", "text"));
        grid.appendChild(criarInput("1º Trim (Faltas)", d.f1, "f1", "text"));
        grid.appendChild(criarInput("2º Trim (Faltas)", d.f2, "f2", "text"));
        grid.appendChild(criarInput("3º Trim (Faltas)", d.f3, "f3", "text"));

        item.appendChild(grid);
        container.appendChild(item);
    });

    document.getElementById("modal-edicao").classList.remove("hidden");
}

function fecharModalEdicao() {
    document.getElementById("modal-edicao").classList.add("hidden");
}

function validarNotaDigitada(str) {
    if (str === null || str === undefined || str.trim() === "") return { ok: true, val: null };
    const limpo = str.trim().replace(",", ".");
    if (!/^\d+(\.\d+)?$/.test(limpo)) return { ok: false };
    const val = Number(limpo);
    if (val < 0 || val > 10) return { ok: false };
    return { ok: true, val: val };
}

function validarFaltaDigitada(str) {
    if (str === null || str === undefined || str.trim() === "") return { ok: false };
    const limpo = str.trim();
    if (!/^\d+$/.test(limpo)) return { ok: false };
    const val = parseInt(limpo, 10);
    if (val < 0) return { ok: false };
    return { ok: true, val: val };
}

async function tratarSalvarDados(event) {
    event.preventDefault();
    const modalMensagem = document.getElementById("modal-mensagem");
    const inputs = document.querySelectorAll("#container-campos-edicao input");
    const btnSalvar = document.getElementById("btn-salvar");

    modalMensagem.className = "mensagem";
    modalMensagem.textContent = "";

    inputs.forEach(i => i.classList.remove("campo-invalido"));

    let erroValidacao = false;
    const novosDados = JSON.parse(JSON.stringify(dadosAtuais));

    inputs.forEach(inp => {
        const idx = Number(inp.dataset.idx);
        const field = inp.dataset.field;
        const valStr = inp.value;

        if (field.startsWith("n")) {
            const res = validarNotaDigitada(valStr);
            if (!res.ok) {
                inp.classList.add("campo-invalido");
                erroValidacao = true;
            } else {
                novosDados[idx][field] = res.val;
            }
        } else if (field.startsWith("f")) {
            const res = validarFaltaDigitada(valStr);
            if (!res.ok) {
                inp.classList.add("campo-invalido");
                erroValidacao = true;
            } else {
                novosDados[idx][field] = res.val;
            }
        }
    });

    if (erroValidacao) {
        modalMensagem.className = "mensagem erro";
        modalMensagem.textContent = "Corrija os campos destacados. Notas de 0 a 10 e faltas números inteiros.";
        return;
    }

    modalMensagem.textContent = "Salvando...";
    btnSalvar.disabled = true;

    try {
        const response = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                turma: CONFIG_ALUNO.turma,
                numero_chamada: CONFIG_ALUNO.numeroChamada,
                pin: sessaoPin,
                dados: {
                    disciplinas: novosDados
                }
            })
        });

        if (!response.ok) {
            modalMensagem.className = "mensagem erro";
            modalMensagem.textContent = "Falha ao salvar alterações no servidor. Tente novamente.";
            btnSalvar.disabled = false;
            return;
        }

        dadosAtuais = novosDados;
        renderizarTabelaECards();
        modalMensagem.className = "mensagem sucesso";
        modalMensagem.textContent = "Dados salvos com sucesso.";
        btnSalvar.disabled = false;

        setTimeout(() => {
            fecharModalEdicao();
        }, 1200);

    } catch (error) {
        modalMensagem.className = "mensagem erro";
        modalMensagem.textContent = "Erro de conexão ao salvar os dados. Tente novamente.";
        btnSalvar.disabled = false;
    }
}