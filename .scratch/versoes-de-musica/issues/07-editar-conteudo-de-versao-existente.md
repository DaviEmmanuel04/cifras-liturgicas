# 07: Editar o conteúdo de uma Versão existente, não só a Principal

**What to build:** Um seletor "Editando: [rótulo ▾]" no topo da tela de edição da Música troca qual Versão está carregada no formulário. Salvar sempre grava na Versão selecionada no momento — o mesmo mecanismo serve tanto pra Principal quanto pras demais, sem um modo separado.

**Blocked by:** 3

**Status:** ready-for-agent

## Contexto

Descoberto em uso real: a partir do ticket 3 (gerenciar Versões existentes), a lista de Versões só permite renomear o rótulo, promover a Principal ou apagar — não há como editar o Tom/Cifra/Tablatura de uma Versão que não seja a Principal sem promovê-la primeiro. O formulário principal sempre editou "a Principal" diretamente, e `handleSubmit` só sincroniza `versaoPrincipalId` dentro de `versoes`.

## Critérios

- [ ] Música com uma única Versão (`versoes` ausente): nenhuma mudança visível — o seletor não aparece, comportamento idêntico ao atual
- [ ] Música com 2+ Versões: um seletor no topo da tela lista o rótulo de cada Versão (a Principal identificada); trocar a seleção carrega o Tom/Cifra/Tablatura daquela Versão no formulário
- [ ] Trocar de Versão no seletor é bloqueado enquanto há edição pendente não salva no formulário (mesma regra já aplicada a "Duplicar Versão"/"Promover a Principal")
- [ ] Salvar grava o conteúdo do formulário na Versão selecionada no momento — nos campos de topo da Música (espelhados, como hoje) só quando a Versão selecionada é a Principal; senão, só dentro de `versoes`
- [ ] Título/Artista/Categoria/Tempo continuam sendo da Música (não de cada Versão) e continuam editáveis normalmente, não importa qual Versão esteja selecionada
- [ ] "Duplicar Versão" e "Salvar Tom Transposto como Nova Versão" continuam operando sobre o que está carregado no formulário no momento — passam a poder partir de qualquer Versão selecionada, não só da Principal
- [ ] Apagar a Versão que está aberta no formulário no momento devolve a edição pra Principal (ou, se a coleção esvaziar, pro modo implícito de versão única) em vez de deixar o formulário apontando pra uma Versão que não existe mais
