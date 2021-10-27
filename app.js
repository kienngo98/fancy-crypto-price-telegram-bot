const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); // for JS api calls
const nodeHtmlToImage = require('node-html-to-image'); // to convert HTML to an image

const { Telegraf } = require('telegraf');
const bot = new Telegraf('2022625702:AAF6rVOli5gxbedcAbhaldA8uyLU8HEosmA');
// const COINMARKETCAP_API_KEY = '518451e4-2a6c-48b6-8b6e-a3c08ea4225f';
let ALL_COINS = [];
getAllCoingeckoCoins().then(data => {
    ALL_COINS = data;
    console.log(`Loaded ${ALL_COINS.length} coins data from Coingecko`);
})
.catch(err => {
    console.error(err);
});

const COMMANDS = {
    price1: new RegExp(/^\/va /), //>> "/va btc"
    chart: new RegExp(/^\/chart /), // >> "/chart btc"
    compare: new RegExp(/^\/compare /),
}

bot.hears(COMMANDS.compare, (ctx) => {
    const fullCommand = ctx.update.message.text;
    const arguments = fullCommand.split(' ').map(ele => ele.trim());
    if (!arguments || !arguments.length || arguments.length < 3) {
        ctx.telegram.sendMessage(ctx.message.chat.id, '/compare requires at least 2 tickers');
        return;
    }
    if (arguments.length > 4) {
        ctx.telegram.sendMessage(ctx.message.chat.id, 'Can only compare 3 coins at once, due to limited mobile screen size');
        return;
    }
    const coinIds = arguments
        .filter(arg => arg !== '/compare')
        .map(symbol => {
            const foundInDatabase = ALL_COINS.find(item => item.symbol && item.symbol.toLowerCase().trim() === symbol.toLowerCase().trim());
            if (!foundInDatabase) {
                ctx.telegram.sendMessage(ctx.message.chat.id, `Cannot find symbol $${symbol} from Coingecko database`);
                return false;
            }
            return foundInDatabase.id;
        })
        .filter(item => !!item);
    console.log('comapre symbol: ', coinIds)
    if (!coinIds.length) return;
    const requests = coinIds.map(coinId => getFullDataFromCoinId(coinId));
    Promise.all(requests).then(data => {
        console.log(data);
        if (!data || !data.length) {

            return;
        }
        const text = generateCompareResponse(data);
        ctx.telegram.sendMessage(ctx.message.chat.id, text, { parse_mode: 'HTML' });
    })
});

function generateCompareResponse(dataArray) {
    const getSpaces = (minusStr) => {
        minusStr = minusStr.toString();
        const defaultSpacing = 6;
        let spacing = '';
        for (let i = 0; i < defaultSpacing - minusStr.length; i++) spacing += ' ';
        return spacing;
    }
    const getRoundNum = (number) => {
        return Math.round(number);
    }
    const shortenNum = (number) => {
        number = getRoundNum(number);
        let newValue = number;
        if (number >= 1000) {
            const suffixes = ["", "K", "M", "B","T"];
            const suffixNum = Math.floor( (""+number).length/3 );
            let shortValue = '';
            for (let precision = 2; precision >= 1; precision--) {
                shortValue = parseFloat( (suffixNum != 0 ? (number / Math.pow(1000,suffixNum) ) : number).toPrecision(precision));
                const dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
                if (dotLessShortValue.length <= 2) { break; }
            }
            if (shortValue % 1 != 0)  shortValue = shortValue.toFixed(1);
            newValue = shortValue+suffixes[suffixNum];
        }
        return newValue;
    }
    text = `
<pre>
| Symbols  | ${dataArray.map(item => item.symbol.toUpperCase() + getSpaces(item.symbol)).join('|')}
|----------------------------
| Price/USD| ${dataArray.map(item => '$' + shortenNum(item.market_data.current_price.usd) + getSpaces('$' + shortenNum(item.market_data.current_price.usd))).join('|')}
| # Rank   | ${dataArray.map(item => item.market_cap_rank + getSpaces(item.market_cap_rank.toString())).join('|')}
| From ATH | ${dataArray.map(item => shortenNum(item.market_data.ath_change_percentage.usd) + '%' + getSpaces(shortenNum(item.market_data.ath_change_percentage.usd) + '%')).join('|')}
| From ATL | ${dataArray.map(item => shortenNum(item.market_data.atl_change_percentage.usd) + '%' + getSpaces(shortenNum(item.market_data.atl_change_percentage.usd) + '%')).join('|')}
| Mktcap   | ${dataArray.map(item => '$' + shortenNum(item.market_data.market_cap.usd) + getSpaces('$' + shortenNum(item.market_data.market_cap.usd))).join('|')}
| FDV ($)  | ${dataArray.map(item => '$' + shortenNum(item.market_data.fully_diluted_valuation.usd) + getSpaces('$' + shortenNum(item.market_data.fully_diluted_valuation.usd))).join('|')}
| 1D (%)   | ${dataArray.map(item => shortenNum(item.market_data.price_change_percentage_24h) + '%' + getSpaces(shortenNum(item.market_data.price_change_percentage_24h) + '%')).join('|')}
| 7D (%)   | ${dataArray.map(item => shortenNum(item.market_data.price_change_percentage_7d) + '%' + getSpaces(shortenNum(item.market_data.price_change_percentage_7d) + '%')).join('|')}
| 14D (%)  | ${dataArray.map(item => shortenNum(item.market_data.price_change_percentage_14d) + '%' + getSpaces(shortenNum(item.market_data.price_change_percentage_14d) + '%')).join('|')}
| 30D (%)  | ${dataArray.map(item => shortenNum(item.market_data.price_change_percentage_30d) + '%' + getSpaces(shortenNum(item.market_data.price_change_percentage_30d) + '%')).join('|')}
| 60D (%)  | ${dataArray.map(item => shortenNum(item.market_data.price_change_percentage_60d) + '%' + getSpaces(shortenNum(item.market_data.price_change_percentage_60d) + '%')).join('|')}
| 200D (%) | ${dataArray.map(item => shortenNum(item.market_data.price_change_percentage_200d) + '%' + getSpaces(shortenNum(item.market_data.price_change_percentage_200d) + '%')).join('|')}
| 1Y (%)   | ${dataArray.map(item => shortenNum(item.market_data.price_change_percentage_1y) + '%' + getSpaces(shortenNum(item.market_data.price_change_percentage_1y) + '%')).join('|')}
|__________|_________________
Data fetched from Coingecko | VA
</pre>
    `;
    return text;
}

async function getFullDataFromCoinId(coinId) {
    const url = 
        'https://api.coingecko.com/api/v3/coins/' +
        `${coinId}` +
        `?localization=${false}` +
        `&tickers=${false}` +
        `&market_data=${true}` +
        `&community_data=${false}` +
        `&developer_data=${false}` +
        `&sparkline=${false}`;
    return fetch(url).then(res => res.json());
}

async function getAllCoingeckoCoins(coinId) {
    return fetch('https://api.coingecko.com/api/v3/coins/list?include_platform=true').then(res => res.json());
}

async function getPriceFromCoinId(coinId, compareWithEth = true) {
    const vsCurrencies = ['usd'];
    if (coinId !== 'bitcoin') vsCurrencies.push('btc');
    if (compareWithEth && coinId !== 'ethereum') vsCurrencies.push('eth');
    if (!coinId) {
        console.error('Missing coinId');
        return;
    }
    const url = 
        'https://api.coingecko.com/api/v3/simple/price' +
        `?ids=${coinId}` +
        `&vs_currencies=${vsCurrencies.join('%2C')}` +
        `&include_market_cap=true` +
        `&include_24hr_vol=true` +
        `&include_24hr_change=true` +
        `&include_last_updated_at=true`;
    return fetch(url).then(res => res.json());
}

// bot.hears(COMMANDS.price1, (ctx) => {
//     const fullCommand = ctx.update.message.text;
//     const arguments = fullCommand.split(' ').map(ele => ele.trim());
//     if (!arguments || !arguments.length || arguments.length < 2 || !arguments[1]) {
//         ctx.telegram.sendMessage(ctx.message.chat.id, 'Error: Missing coin\'s ticker');
//         return;
//     }
//     const symbol = arguments[1];
//     const foundRecord = ALL_COINS.find(item => item.symbol && item.symbol.toLowerCase().trim() === symbol.toLowerCase().trim());
//     if (!foundRecord) {
//         ctx.telegram.sendMessage(ctx.message.chat.id, `Sorry. Could not find $${symbol.toUpperCase()} from Coingecko's database`);
//         return;
//     }
//     const coinId = foundRecord.id; // Coingecko uses ID instead of Symbol to lookup the prices
//     getPriceFromCoinId(coinId).then(data => {
//         if (!data || !data[coinId]) {
//             console.error('API data error');
//             ctx.telegram.sendMessage(ctx.message.chat.id, `Sorry. Coingecko API did not response`);
//             return;
//         }
//         const htmlText = generatePriceResponse(data[coinId], foundRecord);
//         nodeHtmlToImage({
//             output: './image.png',
//             html: htmlText,
//             quality: 100,

//         })
//         .then(() => {
//             console.log('The image was created successfully!');
//             bot.telegram.sendPhoto(ctx.chat.id, {
//                 source: 'image.png'
//             });
//         });
//     });
// });

// function generatePriceResponse(data, coinData) {
//     const date = new Date();
//     const currentDate = date.toTimeString();
//     const getPriceAgainstBtc = () => {
//         if (!data.btc) return '';
//         return `
//             Price/BTC: ${data.btc} &#8383;
//         `;
//     }
//     const getPriceAgainstEthereum = () => {
//         if (!data.eth) return '';
//         return `
//             Price/ETH: ${data.eth} ♦
//         `;
//     }
//     return `
//         <html>
//         <head>
//             <style>
//                 body {
//                     width: 300px;
//                     height: 300px;
//                 }
//                 #imageBody{
//                     width: 300px;
//                     height: 300px;
//                     display: flex;
//                     flex-direction: column;
//                     background-image: url("${getRandomBackgroundImage()}");
//                     background-position: center;
//                     background-repeat: no-repeat;
//                     background-size: cover;
//                 }
//                 #coinHeader {
//                     display: flex;
//                     text-align: center;
//                     font-size: 17px;
//                     background-color: violet;
//                 }
//                 #coinHeader > b {
//                     margin: auto;
//                 }
//                 #mainImageInfo {
//                     display: flex;
//                     flex-direction: column;
//                     text-align: center;
//                 }
//                 #mainImageInfo > div {
//                     background-color: white;
//                 }
//                 em {
//                     color: gray;
//                 }
//                 hr {
//                     width: 100%;
//                 }
//             </style>
//             </head>
//             <body>
//                 <div id="imageBody">
//                     <div id="coinHeader">
//                         <b>${coinData.name} - $${coinData.symbol.toUpperCase()}</b>
//                     </div>
//                     <div id="mainImageInfo">
//                         <em>Price updated at ${currentDate}</em>
//                         <hr>
//                         <div>Price/USD: $${data.usd}</div>
//                         <div>${getPriceAgainstBtc()}</div>
//                         <div>${getPriceAgainstEthereum()}</div>

//                     </div>
//                 </div>
//             </body>
//         </html>
//     `;
// }

// function getRandomBackgroundImage() {
//     return 'https://data.whicdn.com/images/259803969/original.gif';
// }
bot.launch();