# 05: Seletor de Versão e link compartilhável

**What to build:** Quem visita uma Música com 2+ Versões vê um seletor pra escolher qual ler, e a escolha fica refletida na URL da página.

**Blocked by:** 1

**Status:** ready-for-agent

- [ ] Música com uma única Versão: nenhuma mudança visível em relação ao comportamento atual
- [ ] Música com 2+ Versões: seletor com o rótulo de cada uma, visível na página pública
- [ ] Sem versão especificada na URL: mostra a Principal (via a resolução do ticket 1)
- [ ] Escolher uma Versão no seletor reflete essa escolha na própria URL da página, de forma que reabrir esse link carregue direto naquela Versão
- [ ] Um link apontando pra uma Versão que não existe mais cai pra Principal sem erro nem tela em branco
- [ ] Transposição ao vivo e impressão continuam funcionando normalmente sobre a Versão selecionada
