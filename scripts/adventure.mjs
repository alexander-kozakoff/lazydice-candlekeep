// ID модуля берётся из имени папки автоматически.
const MODULE_ID = new URL("../", import.meta.url).pathname.split("/").at(-2);

export const ADVENTURE = {
    identity: {
        module: MODULE_ID,
        // МЕНЯЙ. ID документа Adventure из компендия.
        // Скопируй последнюю часть его UUID после `.Adventure.`.
        adventureId: "RgzEs2bLmNpwQywg",

        // Автоматически. Шаблон рассчитан на один компендий типа Adventure.
        get packId() {
            const module = game.modules.get(MODULE_ID);
            const packs = [...module.packs].filter(pack => pack.type === "Adventure");

            if (packs.length !== 1) {
                throw new Error(`В модуле ${MODULE_ID} ожидается ровно один компендий Adventure`);
            }

            return packs[0].id;
        },
        // Автоматически. Foundry собирает полный UUID из компендия и adventureId.
        get uuid() {
            return game.packs.get(this.packId).getUuid(this.adventureId);
        }
    },
    // ПО ЖЕЛАНИЮ. Класс оформления журнала и окна импорта.
    // Если меняешь класс, используй то же имя в CSS.
    cssClass: "candlekeep",

    // МЕНЯЙ. Описание для экрана входа в мир.
    // Применяется при импорте с галочкой «Изменить детали мира».
    description: `<p>Эта книга - сборник приключений, написанных членами сообщества Dungeons & Dragons. Каждое приключение 
начинается с того, что персонажи находят книгу в Крепости Свечей (Candlekeep) - огромной библиотеке, расположенной 
на Побережье Мечей (Sword Coast) в сеттинге Забытые Королевства. </p>`,

    // Название опций, которые будут появляться справа.
    //default: true/false - будут ли эти галочки проставлены по умолчанию
    //label - как будет у игроков отображаться название при импорте приключения

    //активация стартовой сцены, где documentId - это название сцены
    importOptions: {
        activateScene: {
            label: "Активировать стартовую сцену",
            default: true,
            // МЕНЯЙ. ID стартовой сцены из приключения, без префикса `Scene.`.
            documentId: "66QYGg8Aj7LMegdZ" // Scene.66QYGg8Aj7LMegdZ
        },
        //сразу откроет стартовый журнал, где documentId - это название журнала
        displayJournal: {
            label: "Показать журнал со Вступлением",
            default: true,
            documentId: "18i2e4umnLbFyJAC" // JournalEntry.18i2e4umnLbFyJAC
        },
        //background - изображение, которое будет выводиться как фон в меню присоединения к игре
        customizeJoin: {
            label: "Изменить детали мира",
            default: false,

            // МЕНЯЙ имя файла, если фон входа называется иначе.
            // Если имя то же, замени картинку в папке assets/arts.
            background: `modules/${MODULE_ID}/assets/arts/adventure-blank.webp`
        }
    },
    // ПО ЖЕЛАНИЮ. ID журнала, который открывается при повторном импорте.
    // Поставь null, если журнал открывать не нужно.
    releaseNotesJournalId: "18i2e4umnLbFyJAC"
};