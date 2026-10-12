# Al-Rabbah Tactics

Prancheta tática do **Al-Rabbah**, o time da sexta-feira. Serve para montar a escalação do racha, desenhar jogadas e animar a movimentação dos jogadores, no computador ou no celular.

## O que dá para fazer

- **Três campos:** society (7x7, o padrão), campo (11x11) e futsal (5x5)
- **Dois times** com nome e cor configuráveis, goleiro destacado e reservas no banco
- **Formações prontas** (2-3-1, 3-2-1, 4-4-2, 4-3-3, 1-2-1...)
- **Elenco do Al-Rabbah** salvo no navegador, com **sorteio dos times do racha**
- **Desenho:** seta, seta tracejada, desenho livre, zona, com 6 cores
- **Desfazer/refazer** (Ctrl+Z / Ctrl+Y)
- **Animação** por quadros: monte o quadro 1, crie o 2, mova os jogadores e dê play
- **Biblioteca de jogadas** salva no navegador
- **Baixar imagem (PNG)** com o escudo no centro
- **Compartilhar por link**, sem servidor: a jogada vai comprimida dentro do link
- **Celular:** toque para editar, arraste para mover; em pé, o campo gira sozinho

## Tecnologias

| | |
|---|---|
| [React 19](https://react.dev) | interface |
| [TypeScript](https://www.typescriptlang.org) | tipos, para pegar erros antes de rodar |
| [Vite](https://vite.dev) | servidor de desenvolvimento e build |
| [Tailwind CSS 4](https://tailwindcss.com) | estilos |
| [Vitest](https://vitest.dev) | testes |
| SVG | o campo e as peças são desenhados em SVG, em **metros** |

## Rodando

```bash
npm install      # instala as dependências
npm run dev      # abre em http://localhost:5173
npm test         # roda os testes
npm run build    # gera a versão de produção em dist/
```

Deploy: o Vercel detecta tudo sozinho pelo `vercel.json`.

## Como o código está organizado

```
src/
├── domain/          ← REGRAS DO JOGO (sem React, só TypeScript puro)
│   ├── types.ts         tipos: Play (jogada), Player, Frame (quadro), Drawing
│   ├── pitches.ts       medidas de cada campo e cores do gramado
│   ├── formations.ts    formações de cada modalidade
│   ├── board.ts         funções que alteram a jogada + desfazer/refazer
│   ├── animation.ts     cálculo das posições no meio da animação
│   ├── share.ts         compactar a jogada para o link
│   └── board.test.ts    testes de tudo acima
├── state/           ← estado do React (hooks)
│   ├── useBoard.ts      jogada atual + histórico + salvamento automático
│   ├── usePlayback.ts   "relógio" da animação
│   ├── useIsPortrait.ts detecta celular em pé
│   └── storage.ts       localStorage (jogada atual, biblioteca, elenco)
├── components/      ← o que aparece na tela
│   ├── Board.tsx        a prancheta: arrastar e desenhar (Pointer Events)
│   ├── PitchMarkings.tsx linhas do campo, gols e escudo
│   ├── Pieces.tsx       jogador, bola e desenhos
│   ├── Toolbar.tsx      ferramentas e cores
│   ├── AnimationBar.tsx quadros e play
│   ├── SidePanel.tsx    times, elenco/sorteio e biblioteca
│   ├── PlayerDialog.tsx editar jogador
│   └── ui.tsx, Icons.tsx botões, janelas e ícones
├── lib/exportPng.ts ← SVG → PNG
├── config.ts        ← escudo, cores de desenho
└── App.tsx          ← junta tudo
```

### As três ideias principais

1. **A jogada é só dados.** `Play` é um objeto simples (sem classes), que vai direto para JSON, para o localStorage ou para o link.
2. **Funções puras.** Toda alteração (`movePiece`, `addFrame`, `drawTeams`...) recebe uma jogada e **devolve uma nova**, sem mexer na original. Por isso o desfazer é só "voltar para a versão anterior", e dá para testar sem abrir o navegador.
3. **Coordenadas em metros.** O SVG usa `viewBox` em metros (society = 50×30). O navegador cuida de escalar para qualquer tela, e `Board.tsx` converte o toque/clique de pixels para metros com `getScreenCTM()`.

### Ajustando para o campo de vocês

As medidas estão em `src/domain/pitches.ts`. Por exemplo, se o society de sexta tiver 45×28 m, basta trocar `length: 50, width: 30`.

## Créditos

Inspirado no [tactics-board](https://github.com/gljubojevic/tactics-board) de **Goran Ljubojević**, que foi a base de estudo deste projeto. Esta versão foi reescrita do zero por **João Henrique Fanfa** para o Al-Rabbah.

## i am
João Henrique Fanfa 2026
