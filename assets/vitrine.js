(() => {
  const picks = [...document.querySelectorAll('[data-fleet-pick]')];
  const cards = [...document.querySelectorAll('[data-fleet]')];
  const summary = document.querySelector('.ca-menu summary');
  if (summary) {
    const menu = summary.parentElement;
    const label = () => summary.setAttribute('aria-label', menu.open ? 'Fechar menu' : 'Abrir menu');
    label();
    menu.addEventListener('toggle', label);
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) {
        menu.open = false;
        summary.focus();
      }
    });
  }
  if (picks.length) {
    const filter = key => {
      if (!picks.some(button => button.dataset.fleetPick === key)) key = 'todos';
      for (const item of cards) item.hidden = key !== 'todos' && key !== item.dataset.fleet;
      for (const button of picks) button.setAttribute('aria-pressed', String(key === button.dataset.fleetPick));
      const count = cards.filter(card => !card.hidden).length;
      document.querySelector('[data-fleet-count]').textContent = count + (count === 1 ? ' modelo' : ' modelos');
    };
    const fromURL = () => filter(new URL(location.href).searchParams.get('categoria'));
    fromURL();
    picks[0].parentElement.hidden = false;
    for (const button of picks) button.addEventListener('click', () => {
      const key = button.dataset.fleetPick;
      filter(key);
      if (location.protocol !== 'file:') {
        const url = new URL(location.href);
        if (key === 'todos') url.searchParams.delete('categoria');
        else url.searchParams.set('categoria', key);
        url.hash = 'modelos';
        history.pushState(null, '', url);
      }
    });
    addEventListener('popstate', fromURL);
  }
  const buy = document.getElementById('modelo-compra');
  if (buy) {
    const model = new URL(location.href).searchParams.get('modelo');
    if ([...buy.options].some(option => option.value === model)) buy.value = model;
    function update() {
      const name = buy.selectedOptions[0].text;
      document.querySelector('[data-buy-title]').textContent = name;
      document.querySelector('[data-buy-copy]').textContent = 'Tenho interesse em comprar ' + name.toLocaleLowerCase('pt-BR') + '. Gostaria de saber o preço, o prazo para receber em Extrema e as condições de garantia, assistência e reposição de peças.';
      document.querySelector('[data-buy-link]').href = (buy.value === 'inline' ? 'patins' : buy.value) + '.html';
    }
    update();
    buy.addEventListener('change', () => {
      update();
      if (location.protocol !== 'file:') {
        const url = new URL(location.href);
        url.searchParams.set('modelo', buy.value);
        history.replaceState(null, '', url);
      }
    });
  }
  function copyText(kind) {
    if (kind === 'compra') return document.querySelector('[data-buy-copy]').textContent;
    if (kind === 'parceiro') return 'Visita ao ponto Curva Alta\n' + [...document.querySelectorAll('[data-visit] li')].map(node => '• ' + node.textContent).join('\n');
    const quantity = document.querySelector('#quantidade');
    if (quantity.getAttribute('aria-invalid') === 'true') return '';
    const model = document.querySelector('#modelo');
    const plan = document.querySelector('#plano');
    const text = ['Curva Alta · Simulação em Extrema', model.selectedOptions[0].text + ' · ' + plan.selectedOptions[0].text, document.querySelector('[data-contents]').textContent, 'Total de teste: ' + document.querySelector('[data-total]').textContent, 'Simulação sujeita à disponibilidade do piloto.'];
    if (location.origin === 'https://jowpurcinelli.github.io' && location.pathname.startsWith('/curva-alta/')) {
      const shareURL = new URL('aluguel.html', location.href);
      shareURL.searchParams.set('modelo', model.value);
      shareURL.searchParams.set('plano', plan.value);
      shareURL.searchParams.set('qtd', quantity.value);
      shareURL.hash = 'simulador';
      text.push(shareURL.href);
    }
    return text.join('\n');
  }
  for (const container of document.querySelectorAll('[data-copy]')) {
    const button = container.querySelector('[data-copy-button]');
    const feedback = container.querySelector('[data-copy-message]');
    const fallback = container.querySelector('[data-copy-fallback]');
    container.hidden = false;
    const clear = () => { fallback.hidden = true; feedback.textContent = ''; };
    if (buy) buy.addEventListener('change', clear);
    if (container.dataset.copy === 'aluguel') document.querySelector('#simulador').addEventListener('ca:quote', () => {
      clear();
      button.disabled = document.querySelector('#quantidade').getAttribute('aria-invalid') === 'true';
    });
    button.addEventListener('click', async () => {
      const value = copyText(container.dataset.copy);
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        fallback.hidden = true;
        feedback.textContent = 'Copiado. Você pode colar o texto em uma mensagem.';
      } catch {
        feedback.textContent = '';
        const field = fallback.querySelector('textarea');
        field.value = value;
        fallback.hidden = false;
        field.focus();
        field.select();
      }
    });
  }
})();
