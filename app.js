/* =========================
   NASTAVENÍ
========================= */

const STORAGE_KEY =
    "beerTrackerStateV3";


/*
    Malé pivo se počítá jako
    polovina velkého.
*/

const SMALL_BEER_FACTOR = 0.5;


/*
    Aktuálně vybraný člověk.
    Toto není nutné ukládat.
*/

let selectedPersonId = null;


/* =========================
   NAČTENÍ DAT
========================= */

let state = loadState();


function loadState() {

    /*
        Nejprve zkusíme aktuální
        verzi dat.
    */

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (saved) {

        try {

            return normalizeState(
                JSON.parse(saved)
            );

        } catch (error) {

            console.error(
                "Chyba při načítání dat:",
                error
            );

        }

    }


    /*
        Pokud existují data ze starší
        verze aplikace, pokusíme se
        je převést.
    */

    const olderVersion =
        localStorage.getItem(
            "beerTrackerStateV2"
        );


    if (olderVersion) {

        try {

            const converted =
                normalizeState(
                    JSON.parse(
                        olderVersion
                    )
                );

            return converted;

        } catch (error) {

            console.error(
                "Starší data se nepodařilo načíst.",
                error
            );

        }

    }


    /*
        Úplně stará verze aplikace.
    */

    let oldPeople = [];
    let oldCurrentKeg = null;
    let oldHistory = [];


    try {

        oldPeople =
            JSON.parse(
                localStorage.getItem(
                    "people"
                ) || "[]"
            );

        oldCurrentKeg =
            JSON.parse(
                localStorage.getItem(
                    "currentKeg"
                ) || "null"
            );

        oldHistory =
            JSON.parse(
                localStorage.getItem(
                    "history"
                ) || "[]"
            );

    } catch (error) {

        console.error(
            "Stará data se nepodařilo načíst."
        );

    }


    const people =
        oldPeople.map(person => ({

            id:
                String(
                    person.id ||
                    createId()
                ),

            name:
                person.name

        }));


    let currentKeg = null;


    if (oldCurrentKeg) {

        const counts = {};


        oldPeople.forEach(
            (person, index) => {

                const personId =
                    people[index].id;


                counts[personId] = {

                    large:
                        Number(
                            person.large
                        ) || 0,

                    small:
                        Number(
                            person.small
                        ) || 0

                };

            }
        );


        currentKeg = {

            id:
                createId(),

            name:
                oldCurrentKeg.name ||
                "Starý sud",

            price:
                Number(
                    oldCurrentKeg.price
                ) || 0,

            started:
                oldCurrentKeg.started ||
                new Date()
                    .toISOString(),

            counts:
                counts

        };

    }


    const history =
        oldHistory.map(keg => ({

            id:
                String(
                    keg.id ||
                    createId()
                ),

            name:
                keg.name ||
                "Sud",

            price:
                Number(
                    keg.price
                ) || 0,

            started:
                keg.started ||
                new Date()
                    .toISOString(),

            finished:
                keg.finished ||
                new Date()
                    .toISOString(),

            people:
                (keg.people || [])
                    .map(person => ({

                        personId:
                            String(
                                person.personId ||
                                createId()
                            ),

                        name:
                            person.name,

                        large:
                            Number(
                                person.large
                            ) || 0,

                        small:
                            Number(
                                person.small
                            ) || 0

                    }))

        }));


    return {

        people:
            people,

        currentKeg:
            currentKeg,

        history:
            history

    };

}


/* =========================
   KONTROLA STRUKTURY DAT
========================= */

function normalizeState(data) {

    const people =
        Array.isArray(data.people)
            ? data.people.map(
                person => ({

                    id:
                        String(
                            person.id ||
                            createId()
                        ),

                    name:
                        String(
                            person.name ||
                            "Bez jména"
                        )

                })
            )
            : [];


    let currentKeg = null;


    if (data.currentKeg) {

        currentKeg = {

            id:
                String(
                    data.currentKeg.id ||
                    createId()
                ),

            name:
                String(
                    data.currentKeg.name ||
                    "Sud"
                ),

            price:
                Number(
                    data.currentKeg.price
                ) || 0,

            started:
                data.currentKeg.started ||
                new Date()
                    .toISOString(),

            counts:
                data.currentKeg.counts ||
                {}

        };

    }


    const history =
        Array.isArray(data.history)
            ? data.history
            : [];


    return {

        people:
            people,

        currentKeg:
            currentKeg,

        history:
            history

    };

}


/* =========================
   ULOŽENÍ
========================= */

function saveState() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
    );

}


/* =========================
   POMOCNÉ FUNKCE
========================= */

function createId() {

    return (
        Date.now()
            .toString(36)
        +
        Math.random()
            .toString(36)
            .substring(2)
    );

}


function escapeHtml(text) {

    return String(text)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


function formatMoney(value) {

    return new Intl.NumberFormat(

        "cs-CZ",

        {
            style:
                "currency",

            currency:
                "CZK",

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }

    ).format(
        Number(value) || 0
    );

}


function formatDate(date) {

    if (!date) {
        return "";
    }


    const parsed =
        new Date(date);


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return date;

    }


    return parsed
        .toLocaleString(
            "cs-CZ"
        );

}


/*
    Jedna jednotka = jedno velké.

    Malé = 0,5 jednotky.
*/

function beerUnits(
    large,
    small
) {

    return (
        Number(large || 0)
        +
        Number(small || 0)
        *
        SMALL_BEER_FACTOR
    );

}


/* =========================
   NOVÝ SUD
========================= */

function startNewKeg() {

    if (state.currentKeg) {

        alert(
            "Nejdřív uzavři aktuální sud."
        );

        return;

    }


    const nameInput =
        document.getElementById(
            "newKegName"
        );


    const priceInput =
        document.getElementById(
            "newKegPrice"
        );


    const name =
        nameInput.value.trim();


    const price =
        Number(
            priceInput.value
                .replace(",", ".")
        );


    if (name === "") {

        alert(
            "Zadej název sudu."
        );

        return;

    }


    if (
        !Number.isFinite(price)
        ||
        price <= 0
    ) {

        alert(
            "Zadej platnou celkovou cenu sudu."
        );

        return;

    }


    const counts = {};


    state.people.forEach(
        person => {

            counts[person.id] = {

                large: 0,
                small: 0

            };

        }
    );


    state.currentKeg = {

        id:
            createId(),

        name:
            name,

        price:
            price,

        started:
            new Date()
                .toISOString(),

        counts:
            counts

    };


    saveState();

    renderAll();

}


/* =========================
   ÚPRAVA AKTUÁLNÍHO SUDU
========================= */

function editCurrentKeg() {

    const keg =
        state.currentKeg;


    if (!keg) {
        return;
    }


    const name =
        prompt(
            "Název sudu:",
            keg.name
        );


    if (name === null) {
        return;
    }


    if (
        name.trim() === ""
    ) {

        alert(
            "Název nesmí být prázdný."
        );

        return;

    }


    const priceText =
        prompt(
            "Celková cena sudu v Kč:",
            keg.price
        );


    if (priceText === null) {
        return;
    }


    const price =
        Number(
            priceText
                .replace(",", ".")
        );


    if (
        !Number.isFinite(price)
        ||
        price <= 0
    ) {

        alert(
            "Zadej platnou cenu."
        );

        return;

    }


    keg.name =
        name.trim();

    keg.price =
        price;


    saveState();

    renderAll();

}


/* =========================
   POČTY AKTUÁLNÍHO ČLOVĚKA
========================= */

function getCurrentCount(
    personId
) {

    if (!state.currentKeg) {

        return {

            large: 0,
            small: 0

        };

    }


    if (
        !state.currentKeg
            .counts[personId]
    ) {

        state.currentKeg
            .counts[personId] = {

                large: 0,
                small: 0

            };

    }


    return state.currentKeg
        .counts[personId];

}


/* =========================
   PŘIČTENÍ / ODEČTENÍ PIVA
========================= */

function changeBeer(
    personId,
    type,
    amount
) {

    if (!state.currentKeg) {

        alert(
            "Nejdřív založ nový sud."
        );

        return;

    }


    const count =
        getCurrentCount(
            personId
        );


    count[type] +=
        amount;


    if (
        count[type] < 0
    ) {

        count[type] = 0;

    }


    saveState();


    renderSelectedPersonPanel();

    renderCurrentSummary();

}


/* =========================
   PŘIDÁNÍ ČLOVĚKA
========================= */

function addPerson() {

    const input =
        document.getElementById(
            "personName"
        );


    const name =
        input.value.trim();


    if (name === "") {
        return;
    }


    const exists =
        state.people.some(
            person =>
                person.name
                    .toLowerCase()
                ===
                name.toLowerCase()
        );


    if (exists) {

        alert(
            "Člověk s tímto jménem už existuje."
        );

        return;

    }


    const person = {

        id:
            createId(),

        name:
            name

    };


    state.people.push(
        person
    );


    if (state.currentKeg) {

        state.currentKeg
            .counts[person.id] = {

                large: 0,
                small: 0

            };

    }


    selectedPersonId =
        person.id;


    input.value = "";


    saveState();

    renderAll();

}


/* =========================
   PŘEJMENOVÁNÍ ČLOVĚKA
========================= */

function renamePerson(
    personId
) {

    const person =
        state.people.find(
            person =>
                person.id ===
                personId
        );


    if (!person) {
        return;
    }


    const newName =
        prompt(
            "Nové jméno:",
            person.name
        );


    if (newName === null) {
        return;
    }


    const clean =
        newName.trim();


    if (clean === "") {

        alert(
            "Jméno nesmí být prázdné."
        );

        return;

    }


    const duplicate =
        state.people.some(
            other =>
                other.id !==
                    personId
                &&
                other.name
                    .toLowerCase()
                ===
                clean.toLowerCase()
        );


    if (duplicate) {

        alert(
            "Člověk s tímto jménem už existuje."
        );

        return;

    }


    person.name =
        clean;


    /*
        V historii jméno úmyslně
        neměníme.

        Historie tak zachovává stav,
        který byl v době uzavření sudu.
    */


    saveState();

    renderAll();

}


/* =========================
   SMAZÁNÍ ČLOVĚKA
========================= */

function deletePerson(
    personId
) {

    const person =
        state.people.find(
            person =>
                person.id ===
                personId
        );


    if (!person) {
        return;
    }


    /*
        Pokud už má v aktuálním sudu
        piva, nedovolíme ho smazat.
    */

    if (state.currentKeg) {

        const count =
            getCurrentCount(
                personId
            );


        if (
            count.large > 0
            ||
            count.small > 0
        ) {

            alert(
                "Tento člověk má v aktuálním sudu načárkovaná piva. Nejdřív je odečti na nulu nebo sud uzavři."
            );

            return;

        }

    }


    const confirmed =
        confirm(
            `Opravdu chceš smazat "${person.name}" ze seznamu lidí?\n\nVe starší historii zůstane zachovaný.`
        );


    if (!confirmed) {
        return;
    }


    state.people =
        state.people.filter(
            person =>
                person.id !==
                personId
        );


    if (state.currentKeg) {

        delete state
            .currentKeg
            .counts[personId];

    }


    if (
        selectedPersonId ===
        personId
    ) {

        selectedPersonId =
            null;

    }


    saveState();

    renderAll();

}


/* =========================
   VÝBĚR ČLOVĚKA
========================= */

function ensureSelectedPerson() {

    /*
        Pokud vybraný člověk
        stále existuje, nic neměníme.
    */

    if (
        selectedPersonId
        &&
        state.people.some(
            person =>
                person.id ===
                selectedPersonId
        )
    ) {

        return;

    }


    /*
        Jinak vybereme prvního
        člověka v seznamu.
    */

    if (
        state.people.length > 0
    ) {

        selectedPersonId =
            state.people[0].id;

    } else {

        selectedPersonId =
            null;

    }

}


function selectPerson(
    personId
) {

    selectedPersonId =
        personId;


    renderPeopleSelector();

    renderSelectedPersonPanel();

}


/* =========================
   VÝPOČET AKTUÁLNÍHO SUDU
========================= */

function calculateCurrentKeg() {

    if (!state.currentKeg) {
        return null;
    }


    let totalLarge = 0;

    let totalSmall = 0;


    state.people.forEach(
        person => {

            const count =
                getCurrentCount(
                    person.id
                );


            totalLarge +=
                Number(
                    count.large
                ) || 0;


            totalSmall +=
                Number(
                    count.small
                ) || 0;

        }
    );


    const totalUnits =
        beerUnits(
            totalLarge,
            totalSmall
        );


    const pricePerUnit =
        totalUnits > 0
            ?
            state.currentKeg.price
            /
            totalUnits
            :
            0;


    return {

        totalLarge:
            totalLarge,

        totalSmall:
            totalSmall,

        totalUnits:
            totalUnits,

        pricePerUnit:
            pricePerUnit,

        smallPrice:
            pricePerUnit
            *
            SMALL_BEER_FACTOR

    };

}


/* =========================
   VÝPOČET HISTORICKÉHO SUDU
========================= */

function calculateHistoryKeg(
    keg
) {

    let totalLarge = 0;

    let totalSmall = 0;


    keg.people.forEach(
        person => {

            totalLarge +=
                Number(
                    person.large
                ) || 0;


            totalSmall +=
                Number(
                    person.small
                ) || 0;

        }
    );


    const totalUnits =
        beerUnits(
            totalLarge,
            totalSmall
        );


    const pricePerUnit =
        totalUnits > 0
            ?
            Number(keg.price)
            /
            totalUnits
            :
            0;


    return {

        totalLarge:
            totalLarge,

        totalSmall:
            totalSmall,

        totalUnits:
            totalUnits,

        pricePerUnit:
            pricePerUnit,

        smallPrice:
            pricePerUnit
            *
            SMALL_BEER_FACTOR

    };

}


/* =========================
   UZAVŘENÍ SUDU
========================= */

function closeCurrentKeg() {

    const keg =
        state.currentKeg;


    if (!keg) {
        return;
    }


    const summary =
        calculateCurrentKeg();


    if (
        summary.totalUnits === 0
    ) {

        alert(
            "V sudu zatím není načárkované žádné pivo."
        );

        return;

    }


    let peopleText = "";


    state.people.forEach(
        person => {

            const count =
                getCurrentCount(
                    person.id
                );


            const units =
                beerUnits(
                    count.large,
                    count.small
                );


            if (
                units === 0
            ) {

                return;

            }


            const payment =
                units
                *
                summary.pricePerUnit;


            peopleText +=

                `\n${person.name}: `
                +
                `${count.large} velkých, `
                +
                `${count.small} malých`
                +
                ` → ${formatMoney(payment)}`;

        }
    );


    const message =

        `UZAVŘENÍ SUDU\n\n`

        +

        `${keg.name}\n`

        +

        `Cena sudu: ${formatMoney(keg.price)}\n\n`

        +

        `Velkých: ${summary.totalLarge}\n`

        +

        `Malých: ${summary.totalSmall}\n`

        +

        `Pivních jednotek: ${summary.totalUnits}\n\n`

        +

        `Cena velkého: ${formatMoney(summary.pricePerUnit)}\n`

        +

        `Cena malého: ${formatMoney(summary.smallPrice)}\n`

        +

        peopleText

        +

        `\n\nOpravdu sud uzavřít?`;


    const confirmed =
        confirm(message);


    if (!confirmed) {
        return;
    }


    /*
        Do historie uložíme kopii
        aktuálního stavu.
    */

    const record = {

        id:
            keg.id,

        name:
            keg.name,

        price:
            keg.price,

        started:
            keg.started,

        finished:
            new Date()
                .toISOString(),

        people:
            state.people.map(
                person => {

                    const count =
                        getCurrentCount(
                            person.id
                        );


                    return {

                        personId:
                            person.id,

                        name:
                            person.name,

                        large:
                            count.large,

                        small:
                            count.small

                    };

                }
            )

    };


    state.history.push(
        record
    );


    /*
        Seznam lidí zůstává.

        Pouze aktuální sud zmizí.
        Při založení nového sudu
        dostanou všichni opět nuly.
    */

    state.currentKeg =
        null;


    saveState();

    renderAll();


    /*
        Po uzavření automaticky
        přejdeme do historie.
    */

    switchTab(
        "history"
    );

}


/* =========================
   ÚPRAVA STARÉHO SUDU
========================= */

function editHistoryKeg(
    kegId
) {

    const keg =
        state.history.find(
            keg =>
                String(keg.id) ===
                String(kegId)
        );


    if (!keg) {
        return;
    }


    const name =
        prompt(
            "Název sudu:",
            keg.name
        );


    if (name === null) {
        return;
    }


    if (
        name.trim() === ""
    ) {

        alert(
            "Název nesmí být prázdný."
        );

        return;

    }


    const priceText =
        prompt(
            "Celková cena sudu v Kč:",
            keg.price
        );


    if (
        priceText === null
    ) {

        return;

    }


    const price =
        Number(
            priceText
                .replace(",", ".")
        );


    if (
        !Number.isFinite(price)
        ||
        price <= 0
    ) {

        alert(
            "Zadej platnou cenu."
        );

        return;

    }


    keg.name =
        name.trim();


    keg.price =
        price;


    saveState();

    renderAll();

}


/* =========================
   OPRAVA ČÁREK V HISTORII
========================= */

function editHistoryPerson(
    kegId,
    personIndex
) {

    const keg =
        state.history.find(
            keg =>
                String(keg.id) ===
                String(kegId)
        );


    if (!keg) {
        return;
    }


    const person =
        keg.people[
            personIndex
        ];


    if (!person) {
        return;
    }


    const largeText =
        prompt(
            `Počet velkých – ${person.name}:`,
            person.large
        );


    if (
        largeText === null
    ) {

        return;

    }


    const large =
        Number(
            largeText
        );


    if (
        !Number.isInteger(large)
        ||
        large < 0
    ) {

        alert(
            "Počet velkých musí být celé nezáporné číslo."
        );

        return;

    }


    const smallText =
        prompt(
            `Počet malých – ${person.name}:`,
            person.small
        );


    if (
        smallText === null
    ) {

        return;

    }


    const small =
        Number(
            smallText
        );


    if (
        !Number.isInteger(small)
        ||
        small < 0
    ) {

        alert(
            "Počet malých musí být celé nezáporné číslo."
        );

        return;

    }


    person.large =
        large;


    person.small =
        small;


    /*
        Nemusíme ručně přepočítávat
        peníze.

        Vždy se počítají z aktuálních
        čárek daného sudu.
    */

    saveState();

    renderAll();

}


/* =========================
   VYKRESLENÍ NOVÉHO SUDU
========================= */

function renderKegSetup() {

    const element =
        document.getElementById(
            "kegSetup"
        );


    if (state.currentKeg) {

        element.innerHTML = "";

        return;

    }


    element.innerHTML = `

        <section class="section-card">

            <h2>Založit nový sud</h2>


            <div class="new-keg-form">

                <input
                    type="text"
                    id="newKegName"
                    placeholder="Název sudu, např. Bernard 11°"
                >


                <input
                    type="number"
                    inputmode="decimal"
                    id="newKegPrice"
                    placeholder="Celková cena sudu v Kč"
                    min="0"
                    step="0.01"
                >


                <button
                    class="start-keg-button"
                    onclick="startNewKeg()"
                >
                    🍺 ZAČÍT NOVÝ SUD
                </button>

            </div>

        </section>

    `;

}


/* =========================
   INFORMACE O AKTUÁLNÍM SUDU
========================= */

function renderCurrentKegInfo() {

    const element =
        document.getElementById(
            "currentKegInfo"
        );


    if (!state.currentKeg) {

        element.innerHTML = "";

        return;

    }


    const keg =
        state.currentKeg;


    element.innerHTML = `

        <section class="current-keg">

            <h2>
                🍺 ${escapeHtml(keg.name)}
            </h2>


            <div>
                Cena sudu:

                <strong>
                    ${formatMoney(keg.price)}
                </strong>
            </div>


            <div>
                Začátek:

                ${formatDate(keg.started)}
            </div>


            <div class="keg-actions">

                <button
                    class="normal-button"
                    onclick="editCurrentKeg()"
                >
                    Upravit sud
                </button>


                <button
                    class="close-keg-button"
                    onclick="closeCurrentKeg()"
                >
                    Uzavřít sud
                </button>

            </div>

        </section>

    `;

}


/* =========================
   VYKRESLENÍ VÝBĚRU LIDÍ
========================= */

function renderPeopleSelector() {

    ensureSelectedPerson();

    const element =
        document.getElementById(
            "peopleSelector"
        );

    element.innerHTML = "";


    if (state.people.length === 0) {

        element.innerHTML = `
            <p>
                Zatím tu nikdo není.
                Přidej člověka ve Správě lidí.
            </p>
        `;

        return;
    }


    /*
        Desktopová tlačítka
    */

    const buttons =
        document.createElement("div");

    buttons.className =
        "people-selector desktop-person-selector";


    state.people.forEach(person => {

        const button =
            document.createElement("button");

        button.className =
            "person-select-button";


        if (
            person.id === selectedPersonId
        ) {

            button.classList.add(
                "selected"
            );

        }


        button.textContent =
            person.name;


        button.onclick =
            function() {

                selectPerson(
                    person.id
                );

            };


        buttons.appendChild(
            button
        );

    });


    element.appendChild(
        buttons
    );


    /*
        Mobilní rozbalovací seznam
    */

    const mobileWrapper =
        document.createElement("div");

    mobileWrapper.className =
        "mobile-person-selector";


    const label =
        document.createElement("label");

    label.textContent =
        "Vyber člověka";


    const select =
        document.createElement("select");

    select.className =
        "person-select-dropdown";


    state.people.forEach(person => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            person.id;

        option.textContent =
            person.name;

        option.selected =
            person.id ===
            selectedPersonId;


        select.appendChild(
            option
        );

    });


    select.addEventListener(
        "change",
        function() {

            selectPerson(
                this.value
            );

        }
    );


    mobileWrapper.appendChild(
        label
    );

    mobileWrapper.appendChild(
        select
    );


    element.appendChild(
        mobileWrapper
    );

}


/* =========================
   PANEL VYBRANÉHO ČLOVĚKA
========================= */

function renderSelectedPersonPanel() {

    ensureSelectedPerson();


    const element =
        document.getElementById(
            "selectedPersonPanel"
        );


    element.innerHTML = "";


    if (!selectedPersonId) {
        return;
    }


    const person =
        state.people.find(
            person =>
                person.id ===
                selectedPersonId
        );


    if (!person) {
        return;
    }


    const count =
        getCurrentCount(
            person.id
        );


    const disabledText =
        state.currentKeg
            ?
            ""
            :
            "disabled";


    element.innerHTML = `

        <div class="selected-person-panel">


            <div class="selected-person-name">

                ${escapeHtml(person.name)}

            </div>


            <div class="selected-counts">


                <div class="selected-count">

                    <span class="selected-count-label">
                        Velké
                    </span>

                    <span class="selected-count-value">
                        ${count.large}
                    </span>

                </div>


                <div class="selected-count">

                    <span class="selected-count-label">
                        Malé
                    </span>

                    <span class="selected-count-value">
                        ${count.small}
                    </span>

                </div>


            </div>


            <div class="big-plus-buttons">


                <button
                    class="big-plus-button"
                    onclick="changeBeer('${person.id}', 'large', 1)"
                    ${disabledText}
                >
                    + VELKÉ
                </button>


                <button
                    class="big-plus-button"
                    onclick="changeBeer('${person.id}', 'small', 1)"
                    ${disabledText}
                >
                    + MALÉ
                </button>


            </div>


            <div class="minus-action-buttons">


                <button
                    class="minus-action-button"
                    onclick="changeBeer('${person.id}', 'large', -1)"
                    ${disabledText}
                >
                    − velké
                </button>


                <button
                    class="minus-action-button"
                    onclick="changeBeer('${person.id}', 'small', -1)"
                    ${disabledText}
                >
                    − malé
                </button>


            </div>


            ${
                !state.currentKeg
                    ?
                    `
                    <p style="
                        text-align:center;
                        margin-bottom:0;
                        margin-top:15px;
                    ">
                        Nejdřív založ nový sud.
                    </p>
                    `
                    :
                    ""
            }


        </div>

    `;

}


/* =========================
   SPRÁVA LIDÍ
========================= */

function renderPeopleManagement() {

    const element =
        document.getElementById(
            "peopleManagementList"
        );


    element.innerHTML = "";


    if (
        state.people.length === 0
    ) {

        element.innerHTML =
            "<p>Zatím tu nikdo není.</p>";

        return;

    }


    state.people.forEach(
        person => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "management-person";


            row.innerHTML = `

                <div class="management-person-name">

                    ${escapeHtml(person.name)}

                </div>


                <div class="management-actions">


                    <button
                        class="management-button"
                        onclick="renamePerson('${person.id}')"
                    >
                        Přejmenovat
                    </button>


                    <button
                        class="management-button management-delete"
                        onclick="deletePerson('${person.id}')"
                    >
                        Smazat
                    </button>


                </div>

            `;


            element.appendChild(
                row
            );

        }
    );

}


/* =========================
   SOUHRN AKTUÁLNÍHO SUDU
========================= */

function renderCurrentSummary() {

    const element =
        document.getElementById(
            "currentSummary"
        );


    if (!state.currentKeg) {

        element.innerHTML = "";

        return;

    }


    const summary =
        calculateCurrentKeg();


    element.innerHTML = `

        <section class="summary-card">

            <h2>
                Aktuální souhrn
            </h2>


            <div class="summary-grid">


                <div class="summary-item">

                    Velkých

                    <span class="summary-value">
                        ${summary.totalLarge}
                    </span>

                </div>


                <div class="summary-item">

                    Malých

                    <span class="summary-value">
                        ${summary.totalSmall}
                    </span>

                </div>


                <div class="summary-item">

                    Pivních jednotek

                    <span class="summary-value">
                        ${summary.totalUnits}
                    </span>

                </div>


                <div class="summary-item">

                    Cena velkého

                    <span class="summary-value">

                        ${
                            summary.totalUnits > 0
                                ?
                                formatMoney(
                                    summary.pricePerUnit
                                )
                                :
                                "—"
                        }

                    </span>

                </div>


            </div>


            ${
                summary.totalUnits > 0
                    ?
                    `
                    <p>
                        Orientační cena malého:

                        <strong>
                            ${formatMoney(
                                summary.smallPrice
                            )}
                        </strong>
                    </p>
                    `
                    :
                    `
                    <p>
                        Cena jednoho piva se
                        vypočítá podle skutečného
                        počtu čárek.
                    </p>
                    `
            }


        </section>

    `;

}


/* =========================
   HISTORIE
========================= */

function renderHistory() {

    const element =
        document.getElementById(
            "history"
        );


    element.innerHTML = "";


    if (
        state.history.length === 0
    ) {

        element.innerHTML = `
            <p>
                Zatím není žádný
                uzavřený sud.
            </p>
        `;

        return;

    }


    state.history

        .slice()

        .reverse()

        .forEach(
            keg => {

                const calc =
                    calculateHistoryKeg(
                        keg
                    );


                const card =
                    document.createElement(
                        "section"
                    );


                card.className =
                    "keg-card";


                let peopleHtml = "";


                keg.people.forEach(
                    (person, index) => {

                        const units =
                            beerUnits(
                                person.large,
                                person.small
                            );


                        const payment =
                            units
                            *
                            calc.pricePerUnit;


                        /*
                            Lidi s nulovou spotřebou
                            v historii nemusíme
                            zobrazovat.
                        */

                        if (
                            units === 0
                        ) {

                            return;

                        }


                        peopleHtml += `

                            <div class="history-person">

                                <div>

                                    <strong>
                                        ${escapeHtml(person.name)}
                                    </strong>

                                    <div>
                                        ${person.large} velkých,
                                        ${person.small} malých
                                    </div>

                                    <div class="payment">
                                        ${formatMoney(payment)}
                                    </div>

                                </div>


                                <button
                                    class="small-edit-button"
                                    onclick="editHistoryPerson('${keg.id}', ${index})"
                                >
                                    Upravit
                                </button>

                            </div>

                        `;

                    }
                );


                card.innerHTML = `

                    <h3>
                        ${escapeHtml(keg.name)}
                    </h3>


                    <div class="keg-meta">

                        Cena sudu:

                        <strong>
                            ${formatMoney(keg.price)}
                        </strong>

                        <br>

                        ${formatDate(keg.started)}

                        –

                        ${formatDate(keg.finished)}

                    </div>


                    <div class="summary-grid">


                        <div class="summary-item">

                            Velkých

                            <span class="summary-value">
                                ${calc.totalLarge}
                            </span>

                        </div>


                        <div class="summary-item">

                            Malých

                            <span class="summary-value">
                                ${calc.totalSmall}
                            </span>

                        </div>


                        <div class="summary-item">

                            Jednotek

                            <span class="summary-value">
                                ${calc.totalUnits}
                            </span>

                        </div>


                        <div class="summary-item">

                            Cena velkého

                            <span class="summary-value">

                                ${
                                    calc.totalUnits > 0
                                        ?
                                        formatMoney(
                                            calc.pricePerUnit
                                        )
                                        :
                                        "—"
                                }

                            </span>

                        </div>


                    </div>


                    <div class="keg-actions">

                        <button
                            class="normal-button"
                            onclick="editHistoryKeg('${keg.id}')"
                        >
                            Upravit název / cenu
                        </button>

                    </div>


                    <div class="history-people">

                        ${peopleHtml}

                    </div>

                `;


                element.appendChild(
                    card
                );

            }
        );

}


/* =========================
   STATISTIKY
========================= */

function renderStatistics() {

    const element =
        document.getElementById(
            "statistics"
        );


    if (
        state.history.length === 0
    ) {

        element.innerHTML = `

            <section class="stats-card">

                <p>
                    Statistiky se objeví
                    po uzavření prvního sudu.
                </p>

            </section>

        `;

        return;

    }


    let totalLarge = 0;

    let totalSmall = 0;

    let totalMoney = 0;


    const peopleStats = {};


    state.history.forEach(
        keg => {

            const calc =
                calculateHistoryKeg(
                    keg
                );


            totalLarge +=
                calc.totalLarge;


            totalSmall +=
                calc.totalSmall;


            totalMoney +=
                Number(
                    keg.price
                ) || 0;


            keg.people.forEach(
                person => {

                    const key =
                        person.personId
                        ||
                        person.name;


                    if (
                        !peopleStats[key]
                    ) {

                        peopleStats[key] = {

                            name:
                                person.name,

                            large:
                                0,

                            small:
                                0,

                            units:
                                0,

                            paid:
                                0

                        };

                    }


                    const units =
                        beerUnits(
                            person.large,
                            person.small
                        );


                    peopleStats[key]
                        .name =
                        person.name;


                    peopleStats[key]
                        .large +=
                        Number(
                            person.large
                        ) || 0;


                    peopleStats[key]
                        .small +=
                        Number(
                            person.small
                        ) || 0;


                    peopleStats[key]
                        .units +=
                        units;


                    peopleStats[key]
                        .paid +=
                        units
                        *
                        calc.pricePerUnit;

                }
            );

        }
    );


    const totalUnits =
        beerUnits(
            totalLarge,
            totalSmall
        );


    const sortedPeople =
        Object.values(
            peopleStats
        )

        .filter(
            person =>
                person.units > 0
        )

        .sort(
            (a, b) =>
                b.units -
                a.units
        );


    let peopleHtml = "";


    sortedPeople.forEach(
        (person, index) => {

            peopleHtml += `

                <div class="stats-person">


                    <div class="stats-person-name">

                        ${index + 1}.
                        ${escapeHtml(person.name)}

                    </div>


                    <div class="stats-line">

                        Velká:

                        <strong>
                            ${person.large}
                        </strong>

                    </div>


                    <div class="stats-line">

                        Malá:

                        <strong>
                            ${person.small}
                        </strong>

                    </div>


                    <div class="stats-line">

                        Pivní jednotky:

                        <strong>
                            ${person.units}
                        </strong>

                    </div>


                    <div class="stats-line">

                        Celkem za něj připadá:

                        <strong>
                            ${formatMoney(person.paid)}
                        </strong>

                    </div>


                </div>

            `;

        }
    );


    element.innerHTML = `

        <section class="stats-card">

            <h2>
                Celkem
            </h2>


            <div class="summary-grid">


                <div class="summary-item">

                    Sudů

                    <span class="summary-value">
                        ${state.history.length}
                    </span>

                </div>


                <div class="summary-item">

                    Velkých

                    <span class="summary-value">
                        ${totalLarge}
                    </span>

                </div>


                <div class="summary-item">

                    Malých

                    <span class="summary-value">
                        ${totalSmall}
                    </span>

                </div>


                <div class="summary-item">

                    Jednotek

                    <span class="summary-value">
                        ${totalUnits}
                    </span>

                </div>


            </div>


            <p>

                Celková cena všech sudů:

                <strong>
                    ${formatMoney(totalMoney)}
                </strong>

            </p>

        </section>


        <section class="stats-card">

            <h2>
                Pořadí podle spotřeby
            </h2>


            ${peopleHtml}

        </section>

    `;

}


/* =========================
   EXPORT DAT
========================= */

function exportData() {

    const data =
        JSON.stringify(
            state,
            null,
            2
        );


    const blob =
        new Blob(

            [data],

            {
                type:
                    "application/json"
            }

        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    const date =
        new Date()
            .toISOString()
            .slice(0, 10);


    link.href =
        url;


    link.download =
        `pivni-pocitadlo-${date}.json`;


    link.click();


    URL.revokeObjectURL(
        url
    );

}


/* =========================
   IMPORT DAT
========================= */

function importData(
    file
) {

    if (!file) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        function(event) {

            try {

                const imported =
                    JSON.parse(
                        event
                            .target
                            .result
                    );


                const confirmed =
                    confirm(
                        "Import přepíše všechna současná data. Pokračovat?"
                    );


                if (!confirmed) {
                    return;
                }


                state =
                    normalizeState(
                        imported
                    );


                selectedPersonId =
                    null;


                saveState();

                renderAll();


                alert(
                    "Záloha byla úspěšně načtena."
                );

            } catch (error) {

                alert(
                    "Soubor se nepodařilo načíst. Zkontroluj, že jde o správnou JSON zálohu."
                );

            }

        };


    reader.readAsText(
        file
    );

}


/* =========================
   SMAZÁNÍ VŠECH DAT
========================= */

function deleteAllData() {

    const first =
        confirm(
            "Opravdu chceš smazat úplně všechna data?"
        );


    if (!first) {
        return;
    }


    const second =
        confirm(
            "Smaže se aktuální sud, všichni lidé i celá historie. Tuto akci nelze vrátit zpět. Pokračovat?"
        );


    if (!second) {
        return;
    }


    /*
        Smažeme současnou i starší
        verze dat.
    */

    localStorage.removeItem(
        STORAGE_KEY
    );


    localStorage.removeItem(
        "beerTrackerStateV2"
    );


    localStorage.removeItem(
        "people"
    );


    localStorage.removeItem(
        "currentKeg"
    );


    localStorage.removeItem(
        "history"
    );


    state = {

        people: [],

        currentKeg: null,

        history: []

    };


    selectedPersonId =
        null;


    renderAll();


    switchTab(
        "current"
    );

}


/* =========================
   ZÁLOŽKY
========================= */

function switchTab(
    tabName
) {

    document
        .querySelectorAll(
            ".tab-button"
        )
        .forEach(
            button => {

                button
                    .classList
                    .toggle(

                        "active",

                        button
                            .dataset
                            .tab
                        ===
                        tabName

                    );

            }
        );


    document
        .querySelectorAll(
            ".tab-content"
        )
        .forEach(
            section => {

                section
                    .classList
                    .toggle(

                        "active",

                        section.id
                        ===
                        `tab-${tabName}`

                    );

            }
        );


    if (
        tabName === "history"
    ) {

        renderHistory();

    }


    if (
        tabName === "stats"
    ) {

        renderStatistics();

    }

}


/* =========================
   CELKOVÉ VYKRESLENÍ
========================= */

function renderAll() {

    renderKegSetup();

    renderCurrentKegInfo();

    renderPeopleSelector();

    renderSelectedPersonPanel();

    renderPeopleManagement();

    renderCurrentSummary();

    renderHistory();

    renderStatistics();

}


/* =========================
   UDÁLOSTI
========================= */

/*
    Přepínání záložek
*/

document
    .querySelectorAll(
        ".tab-button"
    )
    .forEach(
        button => {

            button
                .addEventListener(

                    "click",

                    function() {

                        switchTab(
                            this
                                .dataset
                                .tab
                        );

                    }

                );

        }
    );


/*
    Přidání člověka
*/

document
    .getElementById(
        "addPersonButton"
    )
    .addEventListener(
        "click",
        addPerson
    );


/*
    Enter při zadávání jména
*/

document
    .getElementById(
        "personName"
    )
    .addEventListener(

        "keydown",

        function(event) {

            if (
                event.key ===
                "Enter"
            ) {

                addPerson();

            }

        }

    );


/*
    Export
*/

document
    .getElementById(
        "exportButton"
    )
    .addEventListener(
        "click",
        exportData
    );


/*
    Import
*/

document
    .getElementById(
        "importFile"
    )
    .addEventListener(

        "change",

        function() {

            importData(
                this.files[0]
            );


            /*
                Umožní znovu vybrat
                stejný soubor.
            */

            this.value = "";

        }

    );


/*
    Kompletní smazání
*/

document
    .getElementById(
        "deleteAllButton"
    )
    .addEventListener(
        "click",
        deleteAllData
    );


/* =========================
   PRVNÍ SPUŠTĚNÍ
========================= */

renderAll();