import { ADVENTURE } from "./adventure.mjs";
const IMPORT_HANDLERS = {
  activateScene,
  displayJournal,
  customizeJoin
};
/* -------------------------------------------- */
/*  Customize Import Form                       */
/* -------------------------------------------- */

/**
 * Add HTML options to the importer form
 * @returns {string}
 */
export function renderAdventureImporter(app, html) {
  if (app.adventure.pack !== ADVENTURE.identity.packId) return;

  html.find(".window-content").addClass(ADVENTURE.cssClass);
  html.find("h2").addClass("border");

  const contents = html.find(".adventure-contents");
  const imported = !!game.settings.get("core", "adventureImports")?.[ADVENTURE.identity.uuid];

  if (imported) addImportControls(app.adventure, contents[0]);

  contents.append(formatOptions());
  app.setPosition();

  if (imported && ADVENTURE.releaseNotesJournalId) {
    const journal = [...app.adventure.journal].find(
        j => j.id === ADVENTURE.releaseNotesJournalId
    );
    const page = journal?.pages?.contents?.[0];

    if (page) {
      new JournalEntry(journal.toObject()).sheet.render(true, {pageId: page.id});
    }
  }
}

/* -------------------------------------------- */

/**
 * Format adventure import options block.
 * @returns {string}
 */
//код, который вставляет html блок в блок импорт приключения. см importOptions в файле adventure.jms
function formatOptions() {
  let options = `<section class="import-form"><h2 class="border">Options</h2>`;
  for ( const [name, option] of Object.entries(ADVENTURE.importOptions) ) {
    options += `<div class="form-group">
      <label class="checkbox">
        <input type="checkbox" name="${name}" title="${option.label}" ${option.default ? "checked" : ""}/>
          ${option.label}
      </label>
    </div>`;
  }
  options += `</section>`;
  return options;
}

/* -------------------------------------------- */

/**
 * Add controls for which content to import.
 * @param {Adventure} adventure  The adventure document.
 * @param {HTMLElement} content  The adventure content container.
 */
//код, который позволяет выбирать, какой контент из приключения выхотите импортировать
function addImportControls(adventure, content) {
  const heading = content.querySelector("h2");
  const list = content.querySelector(".import-controls");
  const section = document.createElement("section");
  section.classList.add("import-controls");
  let html = `
    <div class="form-group">
      <label class="checkbox">
        <input type="checkbox" name="importFields" value="all" title="Import All" checked>
        Import All
      </label>
    </div>
  `;
  for ( const [field, cls] of Object.entries(Adventure.contentFields) ) {
    const count = adventure[field].size;
    if ( !count ) continue;
    const label = game.i18n.localize(count > 1 ? cls.metadata.labelPlural : cls.metadata.label);
    html += `
      <div class="form-group">
        <label class="checkbox">
          <input type="checkbox" name="importFields" value="${field}" title="Import ${label}"
                 checked disabled>
          <i class="${CONFIG[cls.documentName].sidebarIcon}"></i>
          ${count} ${label}
        </label>
      </div>
    `;
  }
  section.innerHTML = html;
  section.insertAdjacentElement("afterbegin", heading);
  list.before(section);
  list.remove();
  section.querySelector('[value="all"]').addEventListener("change", onToggleImportAll);
}

//Ниже идет обработка логики импорта + настроек приключения (стартовый журнал, сцена, и т.д.)
/* -------------------------------------------- */

/**
 * Handle toggling the import all checkbox.
 * @param {Event} event  The change event.
 */
function onToggleImportAll(event) {
  const target = event.currentTarget;
  const section = target.closest(".import-controls");
  const checked = target.checked;
  section.querySelectorAll("input").forEach(input => {
    if ( input.value !== "folders" ) input.disabled = checked;
    if ( checked ) input.checked = true;
  });
  target.disabled = false;
}

/* -------------------------------------------- */
/*  Handle Import                               */
/* -------------------------------------------- */

/**
 * Perform post-import tasks.
 * @param {Adventure} adventure  The adventure document.
 * @param {object} formData      The submitted adventure form data.
 * @param {object} created       An object of created document data.
 * @param {object} updated       An object of updated document data.
 */
export function onImport(adventure, formData, created, updated) {
  return handleImportOptions(adventure, formData, created, updated);
}

/* -------------------------------------------- */
/*  Handle Import Options                       */
/* -------------------------------------------- */

/**
 * Handle options supported by the importer
 * @param {Adventure} adventure
 * @param {object} formData
 * @param {object} created
 * @param {object} updated
 * @returns {Promise<void>}
 */
async function handleImportOptions(adventure, formData, created, updated) {
  if (adventure.pack !== ADVENTURE.identity.packId) return;

  for (const [name, option] of Object.entries(ADVENTURE.importOptions)) {
    if (!formData[name]) continue;

    const handler = IMPORT_HANDLERS[name];
    if (handler) {
      try {
        await handler(adventure, option);
      } catch (error) {
        console.error(`LazyDice — ${option.label}`, error);
        ui.notifications.warn(`Не удалось выполнить «${option.label}». Подробности в консоли.`);
      }
    } else {
      console.warn(`No import handler registered for "${name}"`);
    }
  }
}

/**
 * Activate an initial scene
 * @param {Adventure} adventure   The adventure being imported
 * @param {object} option         The configured import option
 * @returns {Promise<*>}
 */
export async function activateScene(adventure, option) {
  const scene = game.scenes.get(option.documentId);
  return scene.activate();
}

/* -------------------------------------------- */

/**
 * Display an initial journal entry
 * @param {Adventure} adventure     The adventure being imported
 * @param {object} option           The configured import option
 * @returns {Promise<*>}
 */
export async function displayJournal(adventure, option) {
  const journal = game.journal.get(option.documentId);
  journal.sheet.render(true);
}

/* -------------------------------------------- */

/**
 * Customize the world description and background image
 * @param {Adventure} adventure     The adventure being imported
 * @param {object} option           The configured import option
 * @returns {Promise<*>}
 */
export async function customizeJoin(adventure, option) {
  const worldData = {
    action: "editWorld",
    id: game.world.id,
    description: ADVENTURE.description,
    background: option.background
  }
  await foundry.utils.fetchJsonWithTimeout(foundry.utils.getRoute("setup"), {
    method: "POST",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(worldData)
  });
  game.world.updateSource(worldData);
}

/* -------------------------------------------- */
/*  Handle Import Controls                      */
/* -------------------------------------------- */

/**
 * Remove adventure content that the user indicated they did not want to import.
 * @param {Adventure} adventure  The adventure document.
 * @param {object} formData      The submitted adventure form data.
 * @param {object} toCreate      An object of document data to create.
 * @param {object} toUpdate      An object of document data to update.
 */
export function handleImportControls(adventure, formData, toCreate, toUpdate) {
  if (adventure.pack !== ADVENTURE.identity.packId || adventure.id !== ADVENTURE.identity.adventureId) return;
  if (!game.settings.get("core", "adventureImports")?.[adventure.uuid]) return;

  const fields = formData?.importFields;
  if (!Array.isArray(fields) || fields.includes("all")) return;

  const contentFields = Adventure.contentFields;
  const keep = new Set(["Folder"]);
  for (const field of fields.filter(Boolean)) {
    if (!Object.hasOwn(contentFields, field)) return;
    keep.add(contentFields[field].documentName);
  }

  for (const docs of [toCreate, toUpdate]) {
    for (const type of Object.keys(docs)) {
      if (!keep.has(type)) delete docs[type];
    }
    if (docs.Folder) {
      docs.Folder = docs.Folder.filter(folder => keep.has(folder.type));
    }
  }
}