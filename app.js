const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
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
    price: new RegExp(/^\/v /), //>> "/va btc"
    chart: new RegExp(/^\/chart /), // >> "/chart btc"
    error: 
}

bot.hears(COMMANDS.price, (ctx) => {
    const fullCommand = ctx.update.message.text;
    const arguments = fullCommand.split(' ').map(ele => ele.trim());
    console.log(arguments.length);
    console.log(!arguments || !arguments.length || !arguments.length < 2 || !arguments[1])
    if (!arguments || !arguments.length || arguments.length < 2 || !arguments[1]) {
        ctx.telegram.sendMessage(ctx.message.chat.id, 'Error: Missing coin\'s ticker');
        return;
    }
    const symbol = arguments[1];
    const foundRecord = ALL_COINS.find(item => item.symbol && item.symbol.toLowerCase().trim() === symbol.toLowerCase().trim());
    if (!foundRecord) {
        ctx.telegram.sendMessage(ctx.message.chat.id, `Sorry. Could not find $${symbol.toUpperCase()} from Coingecko's database`);
        return;
    }
    ctx.telegram.sendMessage(ctx.message.chat.id, foundRecord);
    const coinId = foundRecord.id; // Coingecko uses ID instead of Symbol to lookup the prices

    console.log(ctx.update.message.text);
    // ctx.telegram.sendMessage(ctx.message.chat.id, text);
});

async function getAllCoingeckoCoins() {
    return fetch('https://api.coingecko.com/api/v3/coins/list?include_platform=true').then(res => res.json());
}

async function getPriceFromTicker(ticker, comapreWithEth = false) {
    if (!ticker) {
        console.error('Missing ticker');
        return;
    }

}
bot.launch()