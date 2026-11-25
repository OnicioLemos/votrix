// Junta projetos e contagem de votos para a dashboard (RN24, RN25)
// e para o pódio (RN30–RN32).
const ProjetoModel = require('./ProjetoModel');
const VotoModel = require('./VotoModel');

// RN25: 1 casa decimal
function percentual(votos, total) {
  if (total === 0) return 0;
  return Math.round((votos / total) * 1000) / 10;
}

const ResultadoModel = {
  async porProjeto() {
    const [projetos, contagens] = await Promise.all([
      ProjetoModel.listarTodos(),
      VotoModel.contarPorProjeto(),
    ]);

    const mapa = new Map(contagens.map((c) => [c.projetoId, c]));
    const totalVotos = contagens.reduce((soma, c) => soma + c.votos, 0);

    const itens = projetos
      // RN20: projeto desativado some da votação, mas seus votos continuam contando
      .filter((p) => p.ativo || mapa.has(p.id))
      .map((p) => {
        const c = mapa.get(p.id);
        const votos = c ? c.votos : 0;
        return {
          id: p.id,
          nome: p.nome,
          equipe: p.equipe,
          imagemUrl: p.imagemUrl,
          ativo: p.ativo,
          votos,
          percentual: percentual(votos, totalVotos),
          ultimoVoto: c ? c.ultimoVoto : null,
        };
      })
      .sort((a, b) => b.votos - a.votos || a.nome.localeCompare(b.nome));

    return { totalVotos, projetos: itens };
  },

  async podio() {
    const { totalVotos, projetos } = await this.porProjeto();

    // RN32: projetos com zero voto não entram no pódio
    const ranking = projetos
      .filter((p) => p.votos > 0)
      // RN31: mais votos primeiro; empate -> quem recebeu o último voto mais cedo
      .sort(
        (a, b) =>
          b.votos - a.votos ||
          new Date(a.ultimoVoto) - new Date(b.ultimoVoto)
      );

    // RN31: persistindo o empate (mesmos votos e mesmo horário), divide a posição
    const resultado = [];
    ranking.forEach((p, i) => {
      const anterior = resultado[i - 1];
      const empatado =
        anterior &&
        anterior.votos === p.votos &&
        new Date(anterior.ultimoVoto).getTime() === new Date(p.ultimoVoto).getTime();
      const posicao = empatado ? anterior.posicao : i + 1;
      resultado.push({ ...p, posicao });
    });

    // RN30 / RN32: só as posições 1, 2 e 3 que foram preenchidas
    return {
      totalVotos,
      podio: resultado
        .filter((p) => p.posicao <= 3)
        .map(({ ultimoVoto, ativo, ...resto }) => resto),
    };
  },
};

module.exports = ResultadoModel;
