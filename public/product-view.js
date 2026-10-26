// Product surfaces only. All mutations stay in app.js and the validated server API.
const node = (tag, text, cls) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
};
const money = (value, currency = "KZT", minor = false) =>
  `${new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minor ? Number(value) / 100 : Number(value))} ${currency}`;
const time = (value) =>
  value
    ? new Date(value).toLocaleString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Не указано";
function flag(row, labels) {
  return node(
    "span",
    row.archived ? "Архив" : labels[row.status] || row.status,
    "record-state " + (row.archived ? "archived" : row.status),
  );
}
function fact(host, label, value, cls = "") {
  const block = node("div", undefined, "fact " + cls);
  block.append(node("dt", label), node("dd", value ?? "—"));
  host.append(block);
  return block;
}
function external(label, url, cls = "text-link") {
  const a = node("a", label, cls);
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw Error("scheme");
    a.href = parsed.href;
    a.target = "_blank";
    a.rel = "noopener";
  } catch {
    a.removeAttribute("href");
    a.textContent = label + " · ссылка недоступна";
  }
  return a;
}
function focusRecord(host, id) {
  const target = [...host.querySelectorAll("[data-record-id]")].find(
    (e) => e.dataset.recordId === id,
  );
  target?.focus({ preventScroll: true });
}
function publicLink(row, label = "Открыть публичную форму") {
  return external(
    label,
    location.origin + "/#public=" + encodeURIComponent(row.id),
    "button secondary",
  );
}
function header(ctx, title, copy, context) {
  const { screen } = ctx;
  screen.replaceChildren();
  const heading = node("section", undefined, "workspace-heading");
  heading.setAttribute("aria-label", context);
  const titleRow = node("div", undefined, "workspace-title-row");
  titleRow.append(node("h1", title));
  heading.append(titleRow, node("p", copy, "workspace-description"));
  screen.append(heading);
  return heading;
}
function tools(ctx) {
  const {
    screen,
    config,
    active,
    user,
    button,
    input,
    create,
    refresh,
    query,
    showArchived,
    search,
    archive,
  } = ctx;
  const collection = config.collections.find((item) => item.key === active);
  const actions = node("div", undefined, "actions heading-actions");
  if (
    !collection.createDisabled &&
    (collection.writeRole !== "admin" || user.role === "admin")
  )
    actions.append(
      button(collection.addLabel || "Добавить запись", create, "primary"),
    );
  actions.append(button("Обновить", refresh));
  screen.querySelector(".workspace-title-row").append(actions);
  const toolbar = node("div", undefined, "workspace-toolbar");
  const searchBox = node("div", undefined, "search-tools");
  const queryInput = input(
    searchBox,
    "search",
    "Найти в разделе",
    query,
    "search",
    false,
  );
  queryInput.placeholder = "Название, статус или содержание";
  queryInput.addEventListener("input", () => search(queryInput.value));
  const archivedLabel = node("label", "С архивом");
  const archivedInput = node("input");
  archivedInput.type = "checkbox";
  archivedInput.checked = showArchived;
  archivedInput.addEventListener("change", () =>
    archive(archivedInput.checked),
  );
  archivedLabel.prepend(archivedInput);
  searchBox.append(archivedLabel);
  toolbar.append(searchBox);
  screen.append(toolbar);
  const host = node("section");
  host.id = "records";
  host.setAttribute("aria-label", "Рабочие записи");
  screen.append(host);
}
function empty(ctx, description, dependency) {
  const {
    host,
    values,
    state,
    active,
    query,
    button,
    clear,
    create,
    user,
    config,
    navigate,
  } = ctx;
  if (values.length) return false;
  const c = config.collections.find((x) => x.key === active),
    hasRecords = state.data[active].length > 0;
  const box = node("section", undefined, "empty-records");
  box.append(
    node(
      "h2",
      hasRecords
        ? query
          ? "Ничего не найдено"
          : "Здесь только архивные записи"
        : "Начните с первой записи",
    ),
    node(
      "p",
      hasRecords
        ? "Измените поиск или покажите архив. Сохранённая история остаётся доступной."
        : description,
    ),
  );
  if (hasRecords) box.append(button("Сбросить поиск и показать архив", clear));
  else if (dependency)
    box.append(
      button(dependency.label, () => navigate(dependency.key), "primary"),
    );
  else if (
    !c.createDisabled &&
    (c.writeRole !== "admin" || user.role === "admin")
  )
    box.append(button(c.addLabel || "Добавить запись", create, "primary"));
  else
    box.append(
      node(
        "p",
        c.createDisabled
          ? "Ответы появляются только после отправки публичной формы."
          : "Записи в этом разделе подготавливает администратор.",
        "muted",
      ),
    );
  host.append(box);
  return true;
}
function count(ctx) {
  const toolbar = ctx.host.previousElementSibling;
  let counter = toolbar.querySelector(".record-count");
  if (!counter) {
    counter = node("p", undefined, "record-count");
    counter.setAttribute("role", "status");
    counter.setAttribute("aria-live", "polite");
    toolbar.append(counter);
  }
  counter.textContent = `Показано ${ctx.values.length} из ${ctx.state.data[ctx.active].length}`;
}
function editorLayout(screen, form, aside) {
  const layout = node("div", undefined, "editor-layout");
  form.before(layout);
  layout.append(form, aside);
  return layout;
}
function note(title, text, cls = "context-note") {
  const e = node("aside", undefined, cls);
  e.append(node("h2", title), node("p", text));
  return e;
}
function publicLayout({ screen, form, E }, eyebrow, help) {
  const intro = node("section", undefined, "public-intro"),
    title = screen.querySelector(":scope > h1"),
    description = title.nextElementSibling;
  title.before(intro);
  intro.append(node("p", eyebrow, "eyebrow"), title, description);
  document.getElementById("identity").textContent = "Публичная форма";
  const aside = note("Перед отправкой", help);
  const layout = node("div", undefined, "public-layout");
  form.before(layout);
  layout.append(form, aside);
}
const serviceStates = {
  draft: "Черновик тарифа",
  published: "Публичный тариф",
};
const quoteStates = {
  quoted: "Расчёт создан",
  reviewed: "Обсуждён",
  declined: "Отклонён",
};
let selected = {};
export function renderWorkspace(ctx) {
  header(
    ctx,
    ctx.active === "services"
      ? "Тарифы и границы работ"
      : "Сохранённые расчёты",
    ctx.active === "services"
      ? "Объём, цена и диапазон количества — основа публичного расчёта."
      : "Снимок цены на момент обращения сохраняется при изменении тарифа.",
    "QuoteGate / Студия оценки",
  );
  tools(ctx);
}
export function renderProductRecords(ctx) {
  const { host, active, values, button, edit } = ctx;
  host.replaceChildren();
  count(ctx);
  if (
    empty(
      ctx,
      active === "services"
        ? "Опишите услугу, цену и исключения. После публикации клиент сможет получить предварительный расчёт."
        : "Создайте опубликованный тариф, затем сохраните расчёт в кабинете или через публичную ссылку.",
      active === "quotes" &&
        !ctx.state.data.services.some(
          (x) => !x.archived && x.status === "published",
        )
        ? { key: "services", label: "Подготовить тариф" }
        : null,
    )
  )
    return;
  const layout = node("div", undefined, "estimate-desk"),
    list = node("div", undefined, "document-index"),
    preview = node("article", undefined, "estimate-document");
  list.setAttribute(
    "aria-label",
    active === "services" ? "Выбрать тариф" : "Выбрать расчёт",
  );
  const current = values.find((x) => x.id === selected[active]) || values[0];
  selected[active] = current.id;
  for (const row of values) {
    const service = active === "services",
      b = button(
        "",
        () => {
          selected[active] = row.id;
          renderProductRecords(ctx);
          focusRecord(host, row.id);
        },
        "document-choice",
      );
    b.dataset.recordId = row.id;
    b.setAttribute("aria-pressed", String(row.id === current.id));
    b.append(
      node("span", service ? row.name : row.snapshot.name, "choice-title"),
      flag(row, service ? serviceStates : quoteStates),
      node(
        "span",
        service
          ? `${money(row.price, row.currency)} / ед.`
          : `${money(row.total, row.snapshot.currency, true)} · ${row.quantity} ед.`,
        "choice-detail",
      ),
    );
    list.append(b);
  }
  const row = current,
    service = active === "services",
    snapshot = service ? row : row.snapshot;
  preview.append(
    node(
      "p",
      service ? "ТАРИФ / ОБЪЁМ РАБОТ" : "ПРЕДВАРИТЕЛЬНЫЙ РАСЧЁТ",
      "eyebrow",
    ),
    node("h2", snapshot.name),
    flag(row, service ? serviceStates : quoteStates),
  );
  const scope = node("section", undefined, "scope-section");
  scope.append(
    node("h3", "Объём и исключения"),
    node("p", snapshot.scope, "preserve-lines"),
  );
  preview.append(scope);
  const lines = node("dl", undefined, "price-lines");
  if (!service) fact(lines, "Количество", `${row.quantity} ед.`);
  fact(lines, "Цена единицы", money(snapshot.price, snapshot.currency));
  fact(lines, "Фиксированная часть", money(snapshot.setup, snapshot.currency));
  if (service)
    fact(lines, "Допустимое количество", `${row.minimum}–${row.maximum} ед.`);
  else
    fact(
      lines,
      "Сохранённый итог",
      money(row.total, snapshot.currency, true),
      "total-line",
    );
  preview.append(lines);
  if (service) {
    preview.append(
      node(
        "p",
        "Публичная ссылка работает для опубликованного неархивного тарифа.",
        "document-caption",
      ),
    );
  } else {
    const history = node("section", undefined, "snapshot-note");
    history.append(
      node("h3", "Снимок цены сохранён"),
      node("p", `Контакт для ответа: ${row.contact || "не оставлен"}`),
      node("p", `Создан ${time(row.createdAt)} · ${row.id}`),
      node(
        "p",
        "«Обсуждён» — ручная отметка сотрудника. Этот расчёт не подтверждает согласование, договор или оплату.",
      ),
    );
    preview.append(history);
  }
  const actions = node("div", undefined, "actions");
  actions.append(
    button(
      service ? "Открыть тариф" : "Открыть и изменить статус",
      () => edit(row),
      "primary",
    ),
  );
  if (service && row.status === "published" && !row.archived)
    actions.append(publicLink(row, "Проверить публичный расчёт"));
  preview.append(actions);
  layout.append(list, preview);
  host.append(layout);
}
export function decorateEditor({ screen, form, c, row, state, E }) {
  if (c.key === "services") {
    const aside = note(
      "Как клиент увидит тариф",
      "Предпросмотр меняется при вводе. Опубликованный расчёт считает и сохраняет сервер.",
      "editor-preview",
    );
    const preview = node("div", undefined, "estimate-document compact");
    aside.append(preview);
    const update = () => {
      const fields = new FormData(form);
      preview.replaceChildren(
        node("p", "ПРЕДПРОСМОТР ТАРИФА", "eyebrow"),
        node("h3", fields.get("name") || "Название услуги"),
      );
      const dl = node("dl", undefined, "price-lines");
      fact(
        dl,
        "Цена единицы",
        money(fields.get("price") || 0, fields.get("currency") || "KZT"),
      );
      fact(
        dl,
        "Фиксированная часть",
        money(fields.get("setup") || 0, fields.get("currency") || "KZT"),
      );
      fact(
        dl,
        "Количество",
        `${fields.get("minimum") || "…"}–${fields.get("maximum") || "…"} ед.`,
      );
      preview.append(
        dl,
        node(
          "p",
          fields.get("scope") || "Добавьте объём работ и исключения.",
          "preserve-lines",
        ),
      );
    };
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    update();
    editorLayout(screen, form, aside);
  } else if (row) {
    const aside = note(
      "Сохранённая оценка",
      "Услуга, количество, контакт и цена неизменны. Меняется только ручная отметка обработки.",
      "editor-preview",
    );
    const dl = node("dl", undefined, "price-lines");
    fact(dl, "Услуга", row.snapshot.name);
    fact(dl, "Количество", row.quantity);
    fact(dl, "Цена единицы", money(row.snapshot.price, row.snapshot.currency));
    fact(
      dl,
      "Фиксированная часть",
      money(row.snapshot.setup, row.snapshot.currency),
    );
    fact(
      dl,
      "Итог по снимку",
      money(row.total, row.snapshot.currency, true),
      "total-line",
    );
    aside.append(dl, node("p", row.snapshot.scope, "preserve-lines"));
    editorLayout(screen, form, aside);
  } else {
    const aside = note(
      "Оценку посчитает сервер",
      "Выберите опубликованную услугу. Допустимое количество задано в тарифе; итог сохранится вместе со снимком цены.",
    );
    editorLayout(screen, form, aside);
  }
}
export function decoratePublic(ctx) {
  publicLayout(
    ctx,
    "QuoteGate / Предварительная оценка",
    "Введите количество в опубликованном диапазоне. Сохранённая сумма появится после отправки. Объём, налоги и условия согласуются отдельно до договора.",
  );
}

// Fragment navigation and request generations are shared by initial load and browser history.
export function parseHashRoute(hash, collectionKeys) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (params.has("public")) return { kind: "public", id: params.get("public") };
  const section = params.get("section");
  return {
    kind: "workspace",
    section: collectionKeys.includes(section) ? section : null,
  };
}
export function createRouteGuard() {
  let current = 0;
  return {
    next: () => ++current,
    current: () => current,
    isCurrent: (ticket) => ticket === current,
  };
}
