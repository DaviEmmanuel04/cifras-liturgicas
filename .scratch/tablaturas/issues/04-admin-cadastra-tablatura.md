# 04: Admin cadastra e edita Tablatura

**What to build:** Na tela de edição da Música (criação e edição), o admin ganha uma seção pra gerenciar Seções de Tablatura: adicionar, preencher a grade corda×casa, renomear, remover notas/passos, excluir a seção inteira, e salvar. Reabrir a edição mostra o que foi salvo.

**Blocked by:** 03

**Status:** ready-for-human

- [x] A tela de edição/criação de Música (`admin/musica/nova` e `admin/musica/[id]/editar`) tem uma seção pra gerenciar Seções de Tablatura
- [x] Admin pode adicionar uma nova Seção com nome em texto livre, e preencher Passos numa grade corda×casa (até 6 notas simultâneas por passo)
- [x] Admin pode editar uma Seção existente: renomear, adicionar/remover Passos, mudar casas
- [x] Admin pode excluir uma Seção inteira
- [x] Seções são salvas e exibidas na ordem em que foram cadastradas (sem UI de reordenar)
- [x] Enquanto o editor de Tablatura está aberto, o Tom exibido fica travado no `tom` salvo da Música (sem transposição ao vivo durante o cadastro)
- [x] Ao salvar, o campo `tablaturas` é persistido no documento da Música no Firestore
- [x] Reabrir a tela de edição carrega e mostra as Seções previamente salvas
- [x] Cadastro/edição/exclusão passa pelo mesmo gate de autenticação que já protege `/admin` hoje — nenhuma mudança de auth nova é necessária

## Comments

Implementado em `src/components/TablaturaEditor.tsx` (novo componente: grade corda×casa por Seção, add/renomear/excluir Seção, add/remover Passo), com o campo `tablaturas?: SecaoTablatura[]` adicionado a `src/types/musica.ts` e ligado nas duas telas (`admin/musica/nova`, `admin/musica/[id]/editar`) via `addDoc`/`updateDoc`.

Trava do Tom: o componente só exibe o `tom` prop que recebe (fica burro de propósito); cada página é quem trava — `tomTravado` é fixado assim que a primeira Seção com conteúdo aparece (no carregamento, pra `editar`, ou na primeira Seção adicionada, pra ambas as telas), e o editor passa a exibir esse valor congelado em vez do campo "Tom Original" ao vivo. Isso evita I/O e efeitos: a trava acontece dentro de handlers de evento já existentes (o próprio `carregarMusica` e o wrapper `handleTablaturasChange`), não num `useEffect` derivando estado de props — esse padrão foi tentado primeiro (ref mutado durante o render) e rejeitado pelo lint (`react-hooks/refs`, "Cannot access ref value during render").

`/code-review` rodado contra o working tree (`HEAD` b75c1dc, mudanças ainda não commitadas): Spec apontou 1 achado real (trava de Tom seguindo o campo ao vivo em vez do valor salvo) — corrigido antes do commit. Standards: nenhuma violação rígida; 2 judgement calls sem bloqueio — índice de array como `key` de Passo (`TablaturaEditor.tsx`, mutável mas benigno porque todo input é controlado) e ausência de preview visual da Tablatura na pré-visualização da Cifra (nenhum viewer de Tablatura existe ainda — fica pro issue 05) — nenhum dos dois alterado.

`pnpm test`: 17/17 passando (sem testes novos — issue 04 não introduz seam testável automaticamente, conforme Testing Decisions da spec). `pnpm build` e `tsc --noEmit` limpos.
