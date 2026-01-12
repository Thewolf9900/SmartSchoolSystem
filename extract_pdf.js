const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('تقارير/TIC_IPI201_S24_amal_246049_C1.pdf');

pdf(dataBuffer).then(function (data) {
    // console.log(data.numpages);
    // console.log(data.info);
    console.log(data.text);
}).catch(function (error) {
    console.error(error);
})
