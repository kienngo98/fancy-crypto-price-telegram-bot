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
    price: new RegExp(/^\/v /), //>> "/va btc"
    chart: new RegExp(/^\/chart /), // >> "/chart btc"
}

bot.hears(COMMANDS.price, (ctx) => {
    const fullCommand = ctx.update.message.text;
    const arguments = fullCommand.split(' ').map(ele => ele.trim());
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
    const coinId = foundRecord.id; // Coingecko uses ID instead of Symbol to lookup the prices
    getPriceFromCoinId(coinId).then(data => {
        if (!data || !data[coinId]) {
            console.error('API data error');
            ctx.telegram.sendMessage(ctx.message.chat.id, `Sorry. Coingecko API did not response`);
            return;
        }
        const htmlText = generatePriceResponse(data[coinId], foundRecord);
        nodeHtmlToImage({
            output: './image.png',
            html: htmlText,
            quality: 100,

        })
        .then(() => {
            console.log('The image was created successfully!');
            bot.telegram.sendPhoto(ctx.chat.id, {
                source: 'image.png'
            });
        });
    });
});

function generatePriceResponse(data, coinData) {
    return `
        <div style="width: 300px; height: 300px">
            <b>${coinData.name} - $${coinData.symbol}</b>
            <hr style="width: 100%">
            
        </div>
    `;
}

function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild; 
}

async function getAllCoingeckoCoins() {
    return fetch('https://api.coingecko.com/api/v3/coins/list?include_platform=true').then(res => res.json());
}

async function getPriceFromCoinId(coinId, compareWithEth = true) {
    const vsCurrencies = ['btc', 'usd'];
    if (compareWithEth) vsCurrencies.push('eth');
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
bot.launch()

/*
<b>bold</b>, <strong>bold</strong>
<i>italic</i>, <em>italic</em>
<u>underline</u>, <ins>underline</ins>
<s>strikethrough</s>, <strike>strikethrough</strike>, <del>strikethrough</del>
<b>bold <i>italic bold <s>italic bold strikethrough</s> <u>underline italic bold</u></i> bold</b>
<a href="http://www.example.com/">inline URL</a>
<a href="tg://user?id=123456789">inline mention of a user</a>
<code>inline fixed-width code</code>
<pre>pre-formatted fixed-width code block</pre>
<pre><code class="language-python">pre-formatted fixed-width code block written in the Python programming language</code></pre>



*bold \*text*
_italic \*text_
__underline__
~strikethrough~
*bold _italic bold ~italic bold strikethrough~ __underline italic bold___ bold*
[inline URL](http://www.example.com/)
[inline mention of a user](tg://user?id=123456789)
`inline fixed-width code`
```
pre-formatted fixed-width code block
```
```python
pre-formatted fixed-width code block written in the Python programming language
```
*/