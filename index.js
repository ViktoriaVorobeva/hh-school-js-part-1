/* eslint-disable no-restricted-imports */
import Maps from '/maps.js';
import { findCountryRequest, calcRoute } from './api.js';

const MAXREQUESTLENGTH = 10;
const JOINEDSYMBOL = '→';

// Загрузка данных через await
// async function getDataAsync(url) {
//     // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
//     const response = await fetch(url, {
//         method: 'GET',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         redirect: 'follow',
//     });

//     // При сетевой ошибке (мы оффлайн) из `fetch` вылетит эксцепшн.
//     // Тут мы даём ему просто вылететь из функции дальше наверх.
//     // Если же его нужно обработать, придётся обернуть в `try` и сам `fetch`:
//     //
//     // try {
//     //     response = await fetch(url, {...});
//     // } catch (error) {
//     //     // Что-то делаем
//     //     throw error;
//     // }

//     // Если мы тут, значит, запрос выполнился.
//     // Но там может быть 404, 500, и т.д., поэтому проверяем ответ.
//     if (response.ok) {
//         return response.json();
//     }

//     // Пример кастомной ошибки (если нужно проставить какие-то поля
//     // для внешнего кода). Можно выкинуть и сам `response`, смотря
//     // какой у вас контракт. Главное перевести код в ветку `catch`.
//     const error = {
//         status: response.status,
//         customError: 'wtfAsync',
//     };
//     throw error;
// }

// Загрузка данных через промисы (то же самое что `getDataAsync`)
function getDataPromise(url) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
    }).then(
        (response) => {
            // Если мы тут, значит, запрос выполнился.
            // Но там может быть 404, 500, и т.д., поэтому проверяем ответ.
            if (response.ok) {
                return response.json();
            }
            // Пример кастомной ошибки (если нужно проставить какие-то поля
            // для внешнего кода). Можно зареджектить и сам `response`, смотря
            // какой у вас контракт. Главное перевести код в ветку `catch`.
            return Promise.reject({
                status: response.status,
                customError: 'wtfPromise',
            });
        },

        // При сетевой ошибке (мы оффлайн) из fetch вылетит эксцепшн,
        // и мы попадём в `onRejected` или в `.catch()` на промисе.
        // Если не добавить `onRejected` или `catch`, при ошибке будет
        // эксцепшн `Uncaught (in promise)`.
        (error) => {
            // Если не вернуть `Promise.reject()`, для внешнего кода
            // промис будет зарезолвлен с `undefined`, и мы не попадём
            // в ветку `catch` для обработки ошибок, а скорее всего
            // получим другой эксцепшн, потому что у нас `undefined`
            // вместо данных, с которыми мы работаем.
            return Promise.reject(error);
        }
    );
}

// Две функции просто для примера, выберите с await или promise, какая нравится
const getData = getDataPromise;
// getDataAsync ||

async function loadCountriesData() {
    let countries = [];
    try {
        // ПРОВЕРКА ОШИБКИ №1: ломаем этот урл, заменяя all на allolo,
        // получаем кастомную ошибку.
        countries = await getData(
            'https://restcountries.com/v3.1/all?fields=name&fields=cca3&fields=borders&fields=area'
        );
    } catch (error) {
        // console.log('catch for getData');
        // console.error(error);
        throw error;
    }
    return countries.reduce((result, country) => {
        result[country.cca3] = country;
        return result;
    }, {});
}

const form = document.getElementById('form');
const fromCountry = document.getElementById('fromCountry');
const toCountry = document.getElementById('toCountry');
const countriesList = document.getElementById('countriesList');
const submit = document.getElementById('submit');
const output = document.getElementById('output');

(async () => {
    fromCountry.disabled = true;
    toCountry.disabled = true;
    submit.disabled = true;

    output.textContent = 'Loading…';
    let countriesData = {};
    try {
        // ПРОВЕРКА ОШИБКИ №2: Ставим тут брейкпоинт и, когда дойдёт
        // до него, переходим в оффлайн-режим. Получаем эксцепшн из `fetch`.
        countriesData = await loadCountriesData();
    } catch (error) {
        // console.log('catch for loadCountriesData');
        // console.error(error);
        output.textContent = 'Something went wrong. Try to reset your compluter.';
        return;
    }
    output.textContent = '';

    // Заполняем список стран для подсказки в инпутах
    Object.keys(countriesData)
        .sort((a, b) => countriesData[b].area - countriesData[a].area)
        .forEach((code) => {
            const option = document.createElement('option');
            option.value = countriesData[code].name.common;
            countriesList.appendChild(option);
        });

    fromCountry.disabled = false;
    toCountry.disabled = false;
    submit.disabled = false;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        fromCountry.disabled = true;
        toCountry.disabled = true;
        submit.disabled = true;
        // TODO: Вывести, откуда и куда едем, и что идёт расчёт.
        const fromRequest = await findCountryRequest(fromCountry.value, Object.values(countriesData));
        const toRequest = await findCountryRequest(toCountry.value, Object.values(countriesData));
        if (fromCountry.value === toCountry.value) {
            output.textContent = 'Need to choose different countries. This is the same country';
        } else if (fromRequest && toRequest) {
            output.textContent = 'Calculating...';
            Maps.setEndPoints(fromRequest.cca3, toRequest.cca3);
            // TODO: Рассчитать маршрут из одной страны в другую за минимум запросов.
            const { paths, countRequests } = await calcRoute(fromRequest, toRequest, Object.values(countriesData));
            output.textContent = '';
            // TODO: Вывести маршрут и общее количество запросов.
            if (paths.length > 0 && paths[0].length < MAXREQUESTLENGTH) {
                const filteredPaths = paths.filter((path) => path.length < MAXREQUESTLENGTH);
                filteredPaths.forEach((path) => {
                    Maps.markAsVisited(path.map((country) => country.cca3));
                });
                const htmlPaths = filteredPaths.map((path) => {
                    return path
                        .map((country) => {
                            return country.name.common;
                        })
                        .join(JOINEDSYMBOL);
                });

                output.innerHTML = `
            <p>Finded paths:</p>
            ${htmlPaths.map((path) => `<p>${path}</p>`).join('')}
            <p>Count of requests: ${countRequests}</p>
            `;
            } else if (paths.length === 0) {
                output.textContent = 'No paths. This is island/water';
            } else {
                output.textContent = 'Too long path. Choose other countries';
            }
        } else {
            output.textContent = 'Need to choose countries';
        }

        fromCountry.disabled = false;
        toCountry.disabled = false;
        submit.disabled = false;

        form.reset();
    });
})();
