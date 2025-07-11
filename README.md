# reviewComment# Avaliações de Produtos

Aplicação simples para avaliações de produtos feita em HTML, CSS e JavaScript puro. Usuários podem:

* Adicionar avaliações com nota em estrelas (1 a 5)
* Deixar comentários, nome, idade e email
* Ver média das avaliações, filtro por nota, ordenação
* Votar em avaliações, compartilhar nas redes sociais
* Visualizar detalhes de cada avaliação

## Recursos

* Sistema de estrelas interativo (mouseover/click)
* Persistência em LocalStorage
* Ordenação e filtro por estrelas/votos
* Modal para adicionar e detalhar avaliações
* Toasts de feedback para ações
* Compatível com Font Awesome (CDN)
* Responsivo para desktop/mobile

## Como usar

1. **Clone ou baixe este repositório**
2. Abra o arquivo `index.html` em qualquer navegador moderno
3. Pronto! Todos os dados ficam salvos localmente (LocalStorage)

## Estrutura dos arquivos

* `index.html` — Estrutura do app e modais
* `styles.css` — Estilos principais e responsividade
* `app.js` — Toda a lógica da aplicação

## Dependências

* [Font Awesome 6](https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css) via CDN

## Dicas

* Os dados NÃO vão para servidor, são salvos só no navegador do usuário.
* Para resetar tudo, basta limpar o LocalStorage do navegador.

## Exemplo de uso

![Tela do modal de nova avaliação](exemplo-modal.png)

## Possíveis melhorias

* Validação mais avançada de campos
* Limpeza automática de avaliações antigas
* Backend (Node/Express) para salvar dados em banco
* Upload de imagem do usuário
* Paginação de avaliações

---

**Desenvolvido por Wesley, 2025**
