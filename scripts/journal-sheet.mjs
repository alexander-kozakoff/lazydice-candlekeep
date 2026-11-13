/**
 * Кастомный лист журнала на основе современного "D&D 5e Бланка Журнала"
 * (dnd5e.applications.journal.JournalEntrySheet5e).
 *
 * Наследуясь именно от этого класса (а не от старого JournalSheet5e), мы
 * получаем "бесплатно" встроенную в систему навигацию между журналами —
 * ту самую кнопку-попап "Предыдущая / Следующая страница", которая уже
 * есть в стандартном бланке. Свой код для этого писать не нужно.
 *
 * Дополнительно добавляет:
 *  - свой CSS-класс на окно листа;
 *  - клик по ссылкам на сцену прямо из текста журнала;
 *  - группировку страниц в боковом меню (оглавлении) по разделам — раздел
 *    достаётся из названия страницы по разделителю, например:
 *      "Часть 1: Введение"  ->  раздел "Часть 1", страница "Введение"
 */
import { ADVENTURE } from "./adventure.mjs";
const MODULE_ID = ADVENTURE.id;

export default class lazydiceJournalSheet extends dnd5e.applications.journal.JournalEntrySheet5e {
  constructor(doc, options) {
    super(doc, options);
    this.options.classes.push(ADVENTURE.cssClass);
  }

  /**
   * Проставляет класс темы (light/dark) на окно листа — от этого зависят
   * CSS-переменные вида --color-text-emphatic (цвет текста заголовков и т.д.).
   * Без этого класса переменные берут дефолтное значение, из-за чего текст
   * может стать белым/нечитаемым вместо тёмного.
   * @inheritDoc
   */
  async _renderFrame(options) {
    const frame = await super._renderFrame(options);
    let theme = foundry.applications.apps.DocumentSheetConfig.getSheetThemeForDocument(this.document);
    if (!theme) {
      try {
        const colorScheme = game.settings.get("core", "colorScheme");
        theme = colorScheme === "dark" ? "dark" : "light";
      } catch (e) {
        theme = "light";
      }
    }
    frame.classList.add("themed", `theme-${theme}`);
    return frame;
  }

  /** @inheritDoc */
  async _onRender(context, options) {
    // Важно вызвать super — именно тут рендерится встроенная навигация
    // между журналами (previous/parent/next), которую даёт сама dnd5e.
    await super._onRender(context, options);

    const html = this.element;

    html.querySelectorAll('[data-type="Scene"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        event.stopImmediatePropagation();
        event.preventDefault();
        game.scenes.get(event.currentTarget.dataset.id)?.view();
      });
    });

    this._groupSidebarPages(html);
  }

  /* -------------------------------------------- */
  /*  Группировка страниц в оглавлении по разделам */
  /* -------------------------------------------- */

  /**
   * Проходит по списку страниц в сайдбаре и перед первой страницей
   * каждого нового раздела вставляет заголовок раздела.
   * @param {HTMLElement} html
   */
  _groupSidebarPages(html) {
    // Селектор может отличаться в зависимости от версии верстки — если
    // группировка не появится, проверь в DevTools (F12) реальный класс
    // списка страниц слева и подставь его сюда.
    const list = html.querySelector(".journal-sidebar .toc ol, .pages-list .directory-list");
    if (!list || list.dataset.gosGrouped) return;

    const entries = Array.from(list.children).filter((el) => el.matches("li"));
    let currentSection = null;

    for (const entry of entries) {
      const label = entry.querySelector("a, strong, .page-title")?.textContent?.trim() ?? "";
      const section = this._extractSection(label);

      if (section && section !== currentSection) {
        currentSection = section;
        const header = document.createElement("li");
        header.className = "directory-section gos-journal-section";
        header.innerHTML = `<h3 class="section-header">${section}</h3>`;
        list.insertBefore(header, entry);
      }
    }

    list.dataset.gosGrouped = "true";
  }

  /**
   * Достаёт раздел из названия страницы по разделителю ":", "—" или "-".
   * "Часть 1: Введение" -> "Часть 1"
   * Если разделителя нет — страница остаётся в текущем разделе (или без раздела).
   * @param {string} label
   * @returns {string|null}
   */
  _extractSection(label) {
    if (!label) return null;
    const match = label.match(/^(.+?)\s*[:—-]\s*(.+)$/);
    return match ? match[1].trim() : null;
  }
}
