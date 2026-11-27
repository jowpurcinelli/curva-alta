(() => {
  const panel = document.querySelector('#simulador');
  if (!panel) return;
  const rows = Array.from(document.querySelectorAll('[data-plan]'), (element) => ({
    element,
    model: element.closest('[data-model]').dataset.model,
    ...element.dataset,
  }));
  if (!rows.length) return;

  const model = panel.querySelector('#modelo');
  const mode = panel.querySelector('#modalidade');
  const plan = panel.querySelector('#plano');
  const quantity = panel.querySelector('#quantidade');
  const quantityLabel = panel.querySelector('#quantidade-label');
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const number = new Intl.NumberFormat('pt-BR');
  const summary = document.getElementById('rent-summary');
  const total = summary.querySelector('[data-total]');
  const breakdown = summary.querySelector('[data-breakdown]');
  const contents = summary.querySelector('[data-contents]');
  const planNote = summary.querySelector('[data-note]');
  const modelRequired = document.querySelector('#model-requirements');
  const modelIncluded = document.querySelector('#model-included');
  const params = new URLSearchParams(location.search);
  let currentPackageShape = '';

  function options(select, values, choice) {
    select.replaceChildren(...values.map(([id, title]) => new Option(title, id)));
    if (values.some(([id]) => id === choice)) select.value = choice;
  }

  function display() {
    const item = rows.find((row) => row.plan === plan.value);
    if (!item) return;
    const units = Number(item.units);
    const sessions = Number(item.sessions);
    const shape = [units, sessions].join('/');
    if (currentPackageShape && currentPackageShape !== shape) quantity.value = '1';
    currentPackageShape = shape;
    const count = quantity.valueAsNumber;
    const cents = Number(item.cents);
    const unitCents = cents * count;
    const skates = item.model === 'inline' || item.model === 'quad';
    const guided = item.kind === 'Guiado privativo';
    quantityLabel.textContent = guided ? 'Quantidade de grupos de duas pessoas' : units === 2 ? 'Quantidade de duplas' : units > 2 ? 'Quantidade de grupos' : sessions > 1 ? 'Quantidade de pacotes individuais' : skates ? 'Quantidade de pares de patins' : 'Quantidade de equipamentos';
    const valid = Number.isSafeInteger(count) && count > 0 && Number.isSafeInteger(unitCents) && Number.isSafeInteger(count * units * sessions);
    quantity.setAttribute('aria-invalid', !valid);
    const section = item.element.closest('[data-model]');
    modelRequired.textContent = section.querySelector('[data-requirements]').textContent;
    modelIncluded.textContent = section.querySelector('[data-included]').textContent;
    planNote.textContent = item.element.querySelector('[data-plan-note]')?.textContent || '';
    planNote.hidden = !planNote.textContent;
    if (!valid) {
      total.textContent = 'Valor a calcular';
      breakdown.textContent = 'Informe uma quantidade inteira a partir de 1.';
      contents.textContent = '';
      return;
    }
    const equipment = count * units;
    const set = units === 2 ? (count === 1 ? 'dupla' : 'duplas') : (count === 1 ? 'pacote' : 'pacotes');
    const group = guided ? ' · inclui duas bicicletas e guia por grupo' : units === 2 ? ' · o preço da dupla já inclui os dois equipamentos' : '';
    total.textContent = money.format(unitCents / 100);
    breakdown.textContent = number.format(count) + ' ' + set + ' × ' + money.format(cents / 100) + group + '.';
    const items = skates ? (equipment === 1 ? 'par de patins' : 'pares de patins') : (equipment === 1 ? 'equipamento' : 'equipamentos');
    contents.textContent = number.format(equipment) + (equipment === 1 ? ' participante · ' : ' participantes · ') + number.format(equipment) + ' ' + items + ' por sessão · ' + number.format(sessions) + (sessions === 1 ? ' sessão de ' : ' sessões de ') + item.duration + '.';
  }

  function plansForModel(modelId, preferredPlan, preferredKind) {
    const list = rows.filter((row) => row.model === modelId);
    if (!list.length) return;
    const chosen = list.find((row) => row.plan === preferredPlan);
    const kinds = new Map(list.map((row) => [row.kind, row.kindLabel]));
    options(mode, Array.from(kinds), chosen?.kind || preferredKind);
    options(plan, list.filter((row) => row.kind === mode.value).map((row) => [row.plan, row.label]), chosen?.plan);
    display();
  }

  function setLink(planId) {
    const row = rows.find((item) => item.plan === planId);
    if (!row) return false;
    model.value = row.model;
    quantity.value = '1';
    plansForModel(row.model, row.plan);
    return true;
  }
  function persistSelection() {
    const link = new URL(location.href);
    link.searchParams.set('modelo', model.value);
    link.searchParams.set('plano', plan.value);
    history.replaceState(null, '', link);
  }

  model.addEventListener('change', () => { plansForModel(model.value); persistSelection(); });
  mode.addEventListener('change', () => { plansForModel(model.value, null, mode.value); persistSelection(); });
  plan.addEventListener('change', () => { display(); persistSelection(); });
  quantity.addEventListener('input', display);
  document.querySelectorAll('[data-select-plan]').forEach((link) => link.addEventListener('click', (event) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !setLink(link.dataset.selectPlan)) return;
    event.preventDefault();
    const url = new URL(link.href);
    history.replaceState(null, '', url);
    panel.scrollIntoView();
    model.focus({ preventScroll: true });
  }));
  if (!setLink(params.get('plano'))) {
    if (Array.from(model.options).some((option) => option.value === params.get('modelo'))) model.value = params.get('modelo');
    plansForModel(model.value);
  }
  panel.hidden = false;
  if (location.hash === '#simulador') requestAnimationFrame(() => panel.scrollIntoView());
})();
