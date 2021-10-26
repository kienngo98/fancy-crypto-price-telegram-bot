const { Telegraf } = require('telegraf');
const bot = new Telegraf('2022625702:AAF6rVOli5gxbedcAbhaldA8uyLU8HEosmA');
const COMMANDS = {
    price: new RegExp(/^\/v /), //>> "/v btc"
    chart: new RegExp(/^\/chart /) // >> "/chart btc"
}

bot.hears(COMMANDS.price, (ctx) => {
    const fullCommand = ctx.update.message.text;
    const arguments = fullCommand.split(' ').map(ele => ele.trim());
    if (!arguments || !arguments.length || !arguments.length < 2 || !arguments[1]) {
        ctx.telegram.sendMessage(ctx.message.chat.id, 'Error: Missing coin\'s ticker');
        return;
    }
    const ticker = arguments[1];

    console.log(ctx.update.message.text);
    // ctx.telegram.sendMessage(ctx.message.chat.id, text);
});

bot.launch()