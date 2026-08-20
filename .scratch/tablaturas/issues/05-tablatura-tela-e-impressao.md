# 05: Tablatura visível na tela e na impressão, com transposição e toggles

**What to build:** Qualquer visitante que abrir uma Música com Tablatura cadastrada vê o bloco fixo acima da letra, sempre transposto junto com o Tom selecionado. Na impressão, um checkbox controla se a tab entra na folha; "somente letra" oculta a tab tanto na tela quanto na impressão.

**Blocked by:** 03, 04

**Status:** ready-for-human

- [x] Música com ao menos uma Seção de Tablatura mostra o bloco de Tablatura automaticamente na tela, fixo acima da letra, seções na ordem cadastrada
- [x] Música sem nenhuma Seção não mostra bloco nenhum
- [x] Ao transpor o Tom no viewer, as casas de todas as Seções acompanham (reaproveitando o mesmo `semitons` já usado pros acordes), com ajuste de oitava quando necessário
- [x] Quando "somente letra" está marcado, o bloco de Tablatura fica oculto na tela
- [x] Checkbox "incluir tablatura na impressão" aparece na barra de opções de impressão somente quando a música tem Tablatura
- [x] O estado do checkbox é efêmero (não persiste entre sessões/recarregamentos), igual ao `printDiagrams` já existente
- [x] Marcar o checkbox inclui o bloco de Tablatura na folha impressa (`hidden print:block`); desmarcado, não aparece na impressão
- [x] Quando "somente letra" está marcado, a Tablatura fica oculta na impressão mesmo que o checkbox de tablatura esteja marcado
- [x] Visualização e impressão da Tablatura não exigem login (mantém o acesso aberto que a Música já tem hoje)

## Comments

Implementado em `src/components/TablaturaViewer.tsx` (novo, exibição somente-leitura corda×casa, reaproveita `transporTablatura`) e `CifraViewer.tsx` (bloco fixo acima da letra na tela + `printTablatura` efêmero + bloco `hidden print:block` dedicado antes do `CifraRenderer`, no mesmo padrão do `printDiagrams` existente). `CORDAS_TABLATURA` extraído pra `types/tablatura.ts` e compartilhado com `TablaturaEditor.tsx` pra não duplicar o array de rótulos de corda. `pnpm test`: 17/17 passando (sem testes novos — seam único da feature já coberto em 03). `tsc --noEmit` e `eslint` limpos (nenhum erro/warning novo). `/code-review` rodado contra `HEAD` (0f5fc3a): Spec e Standards convergiram no mesmo achado — o bloco de impressão inicial reaproveitava o wrapper com estilo de tela (header cinza, bordas) em vez do padrão `hidden print:block` já usado pelos diagramas; corrigido separando um bloco de tela (`print:hidden`) e um bloco de impressão dedicado sem o chrome interativo. Demais achados (non-null assertion, localização de `CORDAS_TABLATURA`) foram julgamentos menores, sem ação necessária.
