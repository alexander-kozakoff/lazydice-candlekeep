import lazydiceJournalSheet from "./journal-sheet.mjs";
import {
  handleImportControls,
  onImport,
  renderAdventureImporter
} from "./importer.mjs";
import { ADVENTURE } from "./adventure.mjs";
console.log("LazyDice main loaded");
/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */

Hooks.on("init", () => {

  // Register Journal Sheet
 //регистрируем новый кастомный лист. label - это название, которое будет отображено при нажатии на шестеренку в журнале (опция "Бланк")
 //lazydiceJournalSheet - название класса листа, можете придумать его сами. Например, lazydiceJournalSheet
  DocumentSheetConfig.registerSheet(JournalEntry, ADVENTURE.identity.module, lazydiceJournalSheet, {
    types: ["base"],
    label: game.modules.get(ADVENTURE.identity.module).title,
    makeDefault: false
  });

});

Hooks.on("ready", async () => {
  if (!game.user.isGM) return;

  const { module, adventureId } = ADVENTURE.identity;

  try {
    const packId = ADVENTURE.identity.packId;
    const pack = game.packs.get(packId);
    if (!pack) throw new Error(`Компендий ${packId} недоступен.`);

    const uuid = pack.getUuid(adventureId);
    if (game.settings.get("core", "adventureImports")?.[uuid]) return;

    const adventure = await pack.getDocument(adventureId);
    if (!adventure) {
      throw new Error(`Документ с ID ${adventureId} не найден в компендии ${packId}.`);
    }

    await adventure.sheet.render(true);
  } catch (error) {
    console.error(`LazyDice — автооткрытие приключения ${adventureId}`, error);
    ui.notifications.warn(`${module} — ${error.message}`);
  }
});

/* -------------------------------------------- */
/*  Adventure Import					        */
/* -------------------------------------------- */

Hooks.on("renderAdventureImporter", renderAdventureImporter);
Hooks.on("preImportAdventure", handleImportControls);
Hooks.on("importAdventure", onImport);