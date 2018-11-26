const puppeteer = require('puppeteer');
const express = require('express');

const SERVER = '1089';
const SET_COUNT = 5;

const app = express();

app.get('/', async (req, res) => {

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('http://l2on.net/');
    await page.setCookie({ name: 'world', value: SERVER });

    const itemId = req.query.id;

    await page.goto('http://l2on.net/?c=market&a=item&id=' + itemId);

    const result = await page.evaluate(() => {
        var sell_table = parseTable(document, 'group_sell');
        var buy_table = parseTable(document, 'group_buy');

        var collectedData = {
            sale: sell_table,
            buy: buy_table
        };
        return collectedData;

        function parseTable(doc, table) {
            var table = doc
                .getElementById(table)
                .getElementsByClassName('tablesorter')[0]
                .getElementsByTagName('tbody')[0];

            var averagePrice = 0;
            var minPrice = Number.MAX_SAFE_INTEGER;
            var maxPrice = 0;

            const rows = table.getElementsByTagName('tr');
            const setSize = Math.min(10, rows.length);
            for (var i = 0; i < setSize; i++) {
                var price = parseFloat(rows[i]
                    .getElementsByClassName('right')[0]
                    .innerHTML
                    .replace(/\s+/g, ''));
                averagePrice += price;

                if (price > maxPrice)
                    maxPrice = price;

                if (price < minPrice)
                    minPrice = price;
            }

            averagePrice = averagePrice / setSize;

            var tableData = {
                avg: averagePrice,
                max: maxPrice,
                min: minPrice
            };

            return tableData;
        }
    });
    await browser.close();
    res.status(200).send(result);

});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});
