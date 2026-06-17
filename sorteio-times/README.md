# 🏐 Sorteio de Times

App web (PWA) para cadastrar jogadores e sortear times de vôlei equilibrados.
Funciona 100% offline depois de instalado. Dados salvos no próprio aparelho (LocalStorage).

## Arquivos
```
index.html
styles.css
app.js
manifest.json
service-worker.js
.nojekyll
icons/  (ícones do app)
```

## Como publicar no GitHub Pages
1. Crie um repositório (ex: `sorteio-times`).
2. Suba **todos** os arquivos acima na raiz do repositório.
3. Vá em **Settings → Pages**.
4. Em *Build and deployment* escolha **Deploy from a branch**.
5. Branch: `main` · Pasta: `/ (root)` → **Save**.
6. Em ~1 min o site fica no ar em:
   `https://SEU-USUARIO.github.io/sorteio-times/`

> O `service-worker.js` exige HTTPS — o GitHub Pages já fornece. Não funciona abrindo o arquivo direto (`file://`) com SW, mas o app abre normalmente.

## Instalar no iPhone (vira app na tela inicial)
1. Abra o link no **Safari** (precisa ser Safari).
2. Toque no botão **Compartilhar** (quadrado com seta).
3. **Adicionar à Tela de Início** → **Adicionar**.
4. O app abre em tela cheia, sem barra do navegador, e funciona offline.

## Backup dos dados (importante)
O iOS pode limpar dados de apps pouco usados. Para não perder o cadastro:
- Na tela inicial → **💾 Backup** → **E** (exporta um texto que você cola no WhatsApp/Notas).
- Para restaurar em outro aparelho: **💾 Backup** → **I** e cole o texto.

## Modos de sorteio
- **Normal:** distribuição aleatória, respeitando quantidade de times, tamanho e composição por sexo.
- **Rankeado:** usa as estrelas (1 a 5) e equilibra a soma de pontos entre os times, mantendo as quotas de sexo.
