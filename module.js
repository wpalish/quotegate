import {
  F,
  S,
  R,
  C,
  live,
  rows,
  byId,
  unique,
  required,
  minor,
  amount,
  interval,
  noOverlap,
  changed,
  immutable,
  admin,
  totalLines,
  summary,
  clock,
  label,
} from "./core/rules.js";
const definition = {
  slug: "quotegate",
  reference: 100,
  title: "QuoteGate",
  description:
    "Публичный предварительный расчёт услуги из утверждённого тарифа с неизменным снимком цены в заявке.",
  limitations:
    "Одна организация · Собственный сервер · Ручной ввод · Без банковских и внешних интеграций",
  collections: [
    C(
      "services",
      "Услуги",
      [
        F("name", "Услуга"),
        S("currency", "Валюта", ["KZT", "USD", "KGS", "UZS"]),
        F("price", "Цена единицы", "money"),
        F("setup", "Фиксированная часть", "money"),
        F("minimum", "Минимум единиц", "integer", { min: 1, max: 100000 }),
        F("maximum", "Максимум единиц", "integer", { min: 1, max: 100000 }),
        F("scope", "Объём и исключения", "textarea"),
        S("status", "Состояние", [
          ["draft", "Черновик"],
          ["published", "Публичный расчёт"],
        ]),
      ],
      { writeRole: "admin", publicLinks: true },
    ),
    C("quotes", "Расчёты-заявки", [
      R("service", "Услуга", "services", { readOnly: true }),
      F("quantity", "Единиц", "integer", { min: 1, max: 100000, readOnly: true }),
      F("contact", "Контакт для ответа", "email", { required: false, readOnly: true }),
      S("status", "Состояние", [
        ["quoted", "Расчёт создан"],
        ["reviewed", "Обсуждён"],
        ["declined", "Отклонён"],
      ]),
    ]),
  ],
  validate(state, before, command, actor) {
    for (const s of rows(state, "services"))
      required(s.maximum >= s.minimum, "Максимум меньше минимума.");
    for (const q of rows(state, "quotes")) {
      const s = byId(state, "services", q.service),
        old = changed(before, "quotes", q.id);
      if (!old) {
        required(!s.archived, "Новый расчёт недоступен для архивной услуги.");
        required(
          s.status === "published" &&
            q.quantity >= s.minimum &&
            q.quantity <= s.maximum,
          "Количество вне опубликованного диапазона.",
        );
      }
      required(
        Number.isSafeInteger(q.total) && q.total >= 0,
        "Неверный итог расчёта.",
      );
      if (old)
        immutable(old, q, [
          "service",
          "quantity",
          "contact",
          "total",
          "snapshot",
        ]);
    }
  },
  summarize(state) {
    return rows(state, "quotes").map((q) =>
      summary(
        q.snapshot.name,
        "Предварительно: " + amount(q.total) + " " + q.snapshot.currency,
        "Единиц: " + q.quantity,
        q.snapshot.scope,
        "Это расчёт для обсуждения, не договор и не платёж.",
      ),
    );
  },
  normalizeRow(key, row, state, old) {
    if (key === "quotes") {
      if (old) {
        row.total = old.total;
        row.snapshot = old.snapshot;
      } else {
        const s = byId(state, "services", row.service);
        row.total = minor(s.setup) + row.quantity * minor(s.price);
        row.snapshot = {
          name: s.name,
          currency: s.currency,
          price: s.price,
          setup: s.setup,
          scope: s.scope,
        };
      }
    }
    return row;
  },
  publicForm(state, id) {
    const s = rows(state, "services").find(
      (x) => x.id === id && !x.archived && x.status === "published",
    );
    return s
      ? {
          title: s.name,
          description:
            s.scope +
            " Цена единицы: " +
            s.price +
            " " +
            s.currency +
            "; фиксированная часть: " +
            s.setup,
          fields: [
            {
              key: "quantity",
              label: "Количество единиц",
              type: "number",
              min: s.minimum,
              max: s.maximum,
            },
            {
              key: "contact",
              label: "Почта для ответа (необязательно)",
              type: "email",
              required: false,
            },
          ],
        }
      : null;
  },
  publicCommand(state, id, input) {
    return {
      collection: "quotes",
      data: {
        service: id,
        quantity: input.quantity,
        contact: input.contact || "",
        status: "quoted",
      },
    };
  },
  publicReceipt(row) {
    return {
      total: amount(row.total),
      currency: row.snapshot.currency,
      note: "Предварительная оценка по снимку тарифа. Объём, налоги и условия обсуждаются до договора.",
    };
  },
};
export default definition;
